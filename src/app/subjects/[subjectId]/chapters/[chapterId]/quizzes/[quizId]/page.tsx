import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
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

  return { quiz, attempt, bestAttempt };
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

  const { quiz, attempt, bestAttempt } = data;

  // Validate route parameters match database relationships
  const chapterIdNum = parseInt(chapterId);
  const subjectIdNum = parseInt(subjectId);

  if (quiz.chapter.id !== chapterIdNum || quiz.chapter.subjectId !== subjectIdNum) {
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
    </div>
  );
}
