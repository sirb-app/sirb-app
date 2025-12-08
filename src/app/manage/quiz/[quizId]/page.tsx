import { ContentStatus } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QuizFooterActions from "./_components/quiz-footer-actions";
import QuizHeader from "./_components/quiz-header";
import QuestionList from "./_components/question-list";

type PageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

async function getQuizDetails(quizId: number, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
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
    },
  });

  if (!quiz || quiz.isDeleted) return null;

  if (quiz.contributorId !== userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      return "UNAUTHORIZED";
    }
  }

  return quiz;
}

export default async function QuizManagePage({ params }: PageProps) {
  const { quizId } = await params;
  const id = parseInt(quizId);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const quiz = await getQuizDetails(id, session.user.id);

  if (quiz === "UNAUTHORIZED") {
    return (
      <div className="text-destructive container py-10 text-center">
        ليس لديك صلاحية لتعديل هذا الاختبار
      </div>
    );
  }

  if (!quiz) {
    notFound();
  }

  const isReadOnly = quiz.status === ContentStatus.PENDING;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <QuizHeader quiz={quiz} />

      <div className="mt-8">
        <QuestionList
          initialQuestions={quiz.questions}
          quizId={quiz.id}
          isReadOnly={isReadOnly}
        />
      </div>

      <QuizFooterActions
        quizId={quiz.id}
        chapterId={quiz.chapter.id}
        subjectId={quiz.chapter.subjectId}
        status={quiz.status}
        hasQuestions={quiz.questions.length > 0}
      />
    </div>
  );
}
