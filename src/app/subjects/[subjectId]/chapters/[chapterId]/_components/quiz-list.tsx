"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { FileQuestion, Lock, Trophy, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Quiz = {
  id: number;
  title: string;
  description: string | null;
  sequence: number;
  netScore: number;
  attemptCount: number;
  createdAt: Date;
  contributor: {
    id: string;
    name: string | null;
  };
  questions: { id: number }[];
  attempts: { score: number; totalQuestions: number; completedAt: Date }[] | false;
};

type QuizListProps = {
  readonly quizzes: Quiz[];
  readonly chapterId: number;
  readonly subjectId: number;
  readonly isAuthenticated: boolean;
};

export default function QuizList({
  quizzes,
  chapterId,
  subjectId,
  isAuthenticated,
}: QuizListProps) {
  const router = useRouter();

  const handleQuizClick = (e: React.MouseEvent, quizId: number) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.info("يجب تسجيل الدخول لعرض المحتوى", {
        description: "سجل دخولك للوصول إلى الاختبارات",
        action: {
          label: "تسجيل الدخول",
          onClick: () => router.push("/auth/login"),
        },
      });
    }
  };

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileQuestion />
              </EmptyMedia>
              <EmptyContent>
                <EmptyTitle>لا توجد اختبارات بعد</EmptyTitle>
                <EmptyDescription>
                  لم يتم إضافة أي اختبارات لهذا الفصل حتى الآن
                </EmptyDescription>
              </EmptyContent>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {quizzes.map(quiz => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            chapterId={chapterId}
            subjectId={subjectId}
            isAuthenticated={isAuthenticated}
            onQuizClick={handleQuizClick}
          />
        ))}
      </div>
    </div>
  );
}

type QuizCardProps = {
  readonly quiz: Quiz;
  readonly chapterId: number;
  readonly subjectId: number;
  readonly isAuthenticated: boolean;
  readonly onQuizClick: (e: React.MouseEvent, quizId: number) => void;
};

function QuizCard({
  quiz,
  chapterId,
  subjectId,
  isAuthenticated,
  onQuizClick,
}: QuizCardProps) {
  const bestAttempt =
    isAuthenticated && quiz.attempts && quiz.attempts.length > 0
      ? quiz.attempts[0]
      : null;

  const scorePercentage = bestAttempt
    ? Math.round((bestAttempt.score / bestAttempt.totalQuestions) * 100)
    : null;

  return (
    <div className="group relative">
      <Link
        href={`/subjects/${subjectId}/chapters/${chapterId}/quizzes/${quiz.id}`}
        onClick={e => !isAuthenticated && onQuizClick(e, quiz.id)}
        className={cn("block", !isAuthenticated && "pointer-events-none")}
      >
        <Card
          className={cn(
            "hover:border-primary/50 h-full gap-0 p-0 transition-all hover:shadow-md",
            !isAuthenticated && "opacity-75"
          )}
        >
          <CardContent className="flex h-full flex-col p-0">
            {/* Thumbnail Area */}
            <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
              <div
                className={cn(
                  "from-primary/20 to-secondary/20 flex h-full w-full items-center justify-center bg-gradient-to-br transition-all",
                  scorePercentage !== null && scorePercentage >= 100 && "opacity-50 saturate-0"
                )}
              >
                {isAuthenticated ? (
                  <FileQuestion className="text-primary/30 h-16 w-16" />
                ) : (
                  <Lock className="text-muted-foreground/20 h-16 w-16" />
                )}
              </div>

              {/* Best Score Badge - Top Right */}
              {scorePercentage !== null && (
                <div
                  className={cn(
                    "absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm",
                    scorePercentage >= 90
                      ? "bg-success/90 text-success"
                      : scorePercentage >= 70
                        ? "bg-accent/90 text-accent-foreground"
                        : "bg-destructive/90 text-destructive-foreground"
                  )}
                >
                  <Trophy className="h-3 w-3" />
                  {scorePercentage}%
                </div>
              )}

              {/* Locked Overlay */}
              {!isAuthenticated && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <div className="bg-background/90 flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-medium">مقفل</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Info */}
            <div className="flex flex-1 flex-col p-3">
              <h3
                className={cn(
                  "line-clamp-2 leading-tight font-semibold transition-colors",
                  isAuthenticated && "group-hover:text-primary",
                  scorePercentage !== null && scorePercentage >= 100 && "text-muted-foreground"
                )}
              >
                {quiz.title}
              </h3>

              {quiz.description && (
                <p
                  className={cn(
                    "text-muted-foreground mt-2 line-clamp-2 flex-1 text-sm leading-relaxed",
                    scorePercentage !== null && scorePercentage >= 100 && "opacity-70"
                  )}
                >
                  {quiz.description}
                </p>
              )}

              {/* Quiz Stats */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {quiz.questions.length} سؤال
                </Badge>
                {quiz.attemptCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {quiz.attemptCount} محاولة
                  </Badge>
                )}
              </div>

              <div
                className={cn(
                  "text-muted-foreground mt-3 flex items-center gap-1.5 text-xs",
                  scorePercentage !== null && scorePercentage >= 100 && "opacity-70"
                )}
              >
                <User className="h-3 w-3" />
                <span>{quiz.contributor.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
