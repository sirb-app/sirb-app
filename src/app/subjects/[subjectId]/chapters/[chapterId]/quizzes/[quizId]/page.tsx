import { getQuizComments } from "@/actions/quiz-comment.action";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QuizComments from "./_components/quiz-comments";
import QuizContributorSection from "./_components/quiz-contributor-section";
import QuizInterface from "./_components/quiz-interface";

type PageProps = {
  params: Promise<{
    subjectId: string;
    chapterId: string;
    quizId: string;
  }>;
  searchParams: Promise<{
    summary?: string;
  }>;
};

async function getQuizData(quizId: number, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
      isDeleted: false,
    },
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
  });

  if (!quiz) return null;

  // Allow contributors to view their own quizzes regardless of status
  // Others can only view APPROVED quizzes
  if (quiz.contributor.id !== userId && quiz.status !== "APPROVED") {
    return null;
  }

  // Get or create active attempt
  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      userId,
      quizId,
      completedAt: null,
    },
    include: {
      answers: {
        include: {
          question: {
            include: {
              options: {
                orderBy: { sequence: "asc" },
              },
            },
          },
          selectedOptions: {
            include: {
              option: true,
            },
          },
        },
      },
    },
  });

  // Get user's best attempt for displaying best score
  const bestAttempt = await prisma.quizAttempt.findFirst({
    where: {
      userId,
      quizId,
      completedAt: { not: null },
    },
    orderBy: { score: "desc" },
    select: {
      score: true,
      totalQuestions: true,
    },
  });

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

  return { quiz, attempt, bestAttempt, userVote: userVote?.voteType || null };
}

export default async function QuizPage({ params, searchParams }: PageProps) {
  const { subjectId, chapterId, quizId } = await params;
  const { summary } = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const data = await getQuizData(parseInt(quizId), session.user.id);

  if (!data || !data.quiz) {
    notFound();
  }

  const { quiz, attempt, bestAttempt, userVote } = data;

  // Fetch comments for the quiz
  const comments = await getQuizComments(parseInt(quizId));

  // Validate route parameters match database relationships
  const chapterIdNum = parseInt(chapterId);
  const subjectIdNum = parseInt(subjectId);

  if (
    quiz.chapter.id !== chapterIdNum ||
    quiz.chapter.subjectId !== subjectIdNum
  ) {
    notFound(); // Quiz doesn't belong to this chapter/subject
  }

  // If summary param is present, redirect to summary page
  if (summary === "true" && attempt?.completedAt) {
    redirect(
      `/subjects/${subjectId}/chapters/${chapterId}/quizzes/${quizId}/summary?attemptId=${attempt.id}`
    );
  }

  // Transform attempt data to match QuizInterface expected format
  const transformedAttempt = attempt
    ? {
        id: attempt.id,
        answers: attempt.answers.map(answer => ({
          questionId: answer.questionId,
          selectedOptionIds: answer.selectedOptions.map(so => so.optionId),
          isCorrect: answer.isCorrect,
          question: answer.question,
        })),
      }
    : null;

  // Prepare quiz data for contributor section
  const quizForContributor = {
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
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <QuizInterface
        quiz={quiz}
        attempt={transformedAttempt}
        bestAttempt={bestAttempt}
        userId={session.user.id}
        subjectId={parseInt(subjectId)}
        chapterId={parseInt(chapterId)}
      />

      {/* Quiz Contributor Section - Voting, Share, Report */}
      <div className="mt-8">
        <QuizContributorSection
          quiz={quizForContributor}
          userVote={userVote}
          isAuthenticated={!!session}
        />
      </div>

      {/* Quiz Comments Section */}
      <div className="mt-8">
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
