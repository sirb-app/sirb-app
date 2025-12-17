import { getQuizComments } from "@/actions/quiz-comment.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TipTapViewer } from "@/components/ui/tiptap-viewer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Check, Home, RotateCcw, X } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QuizComments from "../_components/quiz-comments";
import QuizContributorSection from "../_components/quiz-contributor-section";

type PageProps = {
  params: Promise<{
    subjectId: string;
    chapterId: string;
    quizId: string;
  }>;
  searchParams: Promise<{
    attemptId?: string;
  }>;
};

async function getQuizSummaryData(
  attemptId: number,
  userId: string,
  quizId: number
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { sequence: "asc" },
            include: {
              options: {
                orderBy: { sequence: "asc" },
              },
            },
          },
          chapter: {
            select: {
              id: true,
              title: true,
              subjectId: true,
            },
          },
          contributor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      answers: {
        include: {
          selectedOptions: {
            include: {
              option: true,
            },
          },
        },
      },
    },
  });

  if (!attempt || attempt.userId !== userId) {
    return null;
  }

  // Get user's vote on this quiz
  const userVote = await prisma.quizVote.findUnique({
    where: {
      userId_quizId: {
        userId,
        quizId,
      },
    },
    select: {
      voteType: true,
    },
  });

  return { attempt, userVote: userVote?.voteType || null };
}

export default async function QuizSummaryPage({
  params,
  searchParams,
}: PageProps) {
  const { subjectId, chapterId, quizId } = await params;
  const { attemptId } = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  if (!attemptId) {
    redirect(`/subjects/${subjectId}/chapters/${chapterId}/quizzes/${quizId}`);
  }

  const data = await getQuizSummaryData(
    parseInt(attemptId),
    session.user.id,
    parseInt(quizId)
  );

  if (!data) {
    notFound();
  }

  const { attempt, userVote } = data;
  const { quiz, score, totalQuestions, answers } = attempt;

  // Fetch comments for the quiz
  const comments = await getQuizComments(parseInt(quizId));

  // Validate route parameters match database relationships
  const quizIdNum = parseInt(quizId);
  const chapterIdNum = parseInt(chapterId);
  const subjectIdNum = parseInt(subjectId);

  if (
    quiz.id !== quizIdNum ||
    quiz.chapter.id !== chapterIdNum ||
    quiz.chapter.subjectId !== subjectIdNum
  ) {
    notFound(); // Attempt/quiz doesn't belong to this chapter/subject
  }
  const percentage = Math.round((score / totalQuestions) * 100);

  // Create answer map for quick lookup - transform selectedOptions to selectedOptionIds
  const answerMap = new Map(
    answers.map(a => [a.questionId, a.selectedOptions.map(so => so.optionId)])
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Score Card */}
        <Card className="border-primary border-2">
          <CardContent className="p-6">
            <div className="space-y-4 text-center">
              <h1 className="text-3xl font-bold">{quiz.title}</h1>

              <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-6">
                <div className="mb-2 text-6xl font-bold">{percentage}%</div>
                <div className="text-muted-foreground text-lg">
                  {score} من {totalQuestions} إجابة صحيحة
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild>
                  <Link
                    href={`/subjects/${subjectId}/chapters/${chapterId}/quizzes/${quizId}`}
                  >
                    <RotateCcw className="ml-2 h-4 w-4" />
                    إعادة المحاولة
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/subjects/${subjectId}/chapters/${chapterId}`}>
                    <Home className="ml-2 h-4 w-4" />
                    العودة إلى الفصل
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Questions with Answers and Justifications */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">مراجعة الإجابات</h2>

          {quiz.questions.map((question, index) => {
            const userAnswer = answerMap.get(question.id) || [];
            const correctOptionIds = question.options
              .filter(o => o.isCorrect)
              .map(o => o.id);

            const isCorrect =
              userAnswer.length === correctOptionIds.length &&
              userAnswer.every(id => correctOptionIds.includes(id));

            return (
              <Card key={question.id}>
                <CardContent className="space-y-4 p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-muted-foreground text-sm font-medium">
                          السؤال {index + 1}
                        </span>
                        {isCorrect ? (
                          <Badge className="bg-success text-success">
                            <Check className="ml-1 h-3 w-3" />
                            صحيحة
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="ml-1 h-3 w-3" />
                            خاطئة
                          </Badge>
                        )}
                      </div>
                      <div className="text-lg leading-relaxed font-bold">
                        <TipTapViewer content={question.questionText} />
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {question.options.map(option => {
                      const isUserSelection = userAnswer.includes(option.id);
                      const isCorrectOption = option.isCorrect;

                      return (
                        <div
                          key={option.id}
                          className={`rounded-lg border-2 p-3 ${
                            isCorrectOption
                              ? "border-success bg-success/15"
                              : isUserSelection
                                ? "border-destructive bg-destructive/15"
                                : "border-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isCorrectOption && (
                              <Check className="text-success h-4 w-4 shrink-0" />
                            )}
                            {!isCorrectOption && isUserSelection && (
                              <X className="text-destructive h-4 w-4 shrink-0" />
                            )}
                            <span className="text-sm leading-relaxed">
                              {option.optionText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Justification */}
                  {question.justification && (
                    <div className="bg-accent/15 border-accent/30 rounded-lg border p-4">
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 text-sm font-semibold">
                          التوضيح:
                        </span>
                        <div className="text-sm leading-relaxed">
                          <TipTapViewer content={question.justification} />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col justify-center gap-3 border-t pt-6 sm:flex-row">
          <Button asChild size="lg">
            <Link
              href={`/subjects/${subjectId}/chapters/${chapterId}/quizzes/${quizId}`}
            >
              <RotateCcw className="ml-2 h-4 w-4" />
              إعادة المحاولة
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href={`/subjects/${subjectId}/chapters/${chapterId}`}>
              <Home className="ml-2 h-4 w-4" />
              العودة إلى الفصل
            </Link>
          </Button>
        </div>

        {/* Quiz Contributor Section - Voting, Share, Report */}
        <QuizContributorSection
          quiz={{
            id: quiz.id,
            contributorId: quiz.contributor.id,
            createdAt: quiz.createdAt,
            upvotesCount: quiz.upvotesCount,
            downvotesCount: quiz.downvotesCount,
            netScore: quiz.netScore,
            attemptCount: quiz.attemptCount,
            contributor: {
              id: quiz.contributor.id,
              name: quiz.contributor.name || "مستخدم",
              image: quiz.contributor.image,
            },
          }}
          userVote={userVote}
          isAuthenticated={!!session}
        />

        {/* Quiz Comments Section */}
        <QuizComments
          quizId={quiz.id}
          contributorId={quiz.contributor.id}
          initialComments={comments}
          currentUser={
            session?.user
              ? {
                  id: session.user.id,
                  name: session.user.name || "مستخدم",
                  image: session.user.image || null,
                }
              : null
          }
          currentUserId={session?.user?.id}
          isAuthenticated={!!session}
        />
      </div>
    </div>
  );
}
