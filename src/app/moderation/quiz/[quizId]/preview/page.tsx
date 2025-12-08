import { getQuizForModeratorPreview } from "@/actions/moderation.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionType } from "@/generated/prisma";
import { ArrowLeft, Check, CheckSquare, Circle, HelpCircle, User, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function ModeratorQuizPreviewPage({ params }: PageProps) {
  const { quizId } = await params;
  const quizIdNum = parseInt(quizId);

  if (isNaN(quizIdNum)) {
    notFound();
  }

  try {
    const quiz = await getQuizForModeratorPreview(quizIdNum);

    const getQuestionTypeIcon = (type: QuestionType) => {
      switch (type) {
        case QuestionType.MCQ_SINGLE:
          return <Circle className="h-4 w-4" />;
        case QuestionType.MCQ_MULTI:
          return <CheckSquare className="h-4 w-4" />;
        case QuestionType.TRUE_FALSE:
          return <HelpCircle className="h-4 w-4" />;
      }
    };

    const getQuestionTypeLabel = (type: QuestionType) => {
      switch (type) {
        case QuestionType.MCQ_SINGLE:
          return "اختيار واحد";
        case QuestionType.MCQ_MULTI:
          return "اختيار متعدد";
        case QuestionType.TRUE_FALSE:
          return "صح/خطأ";
      }
    };

    return (
      <div className="container mx-auto max-w-4xl space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/moderation">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">معاينة الاختبار</h1>
              <Badge variant="secondary">للمراجعة فقط</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {quiz.chapter.title}
            </p>
          </div>
        </div>

        {/* Quiz Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
            {quiz.description && (
              <p className="text-muted-foreground text-sm">{quiz.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="text-muted-foreground">المساهم:</span>
              <span>{quiz.contributor.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">عدد الأسئلة:</span>
              <span className="font-bold">{quiz.questions.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          {quiz.questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="space-y-4 p-6">
                {/* Question Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm font-medium">
                      السؤال {index + 1}
                    </span>
                    <Badge variant="outline" className="gap-1">
                      {getQuestionTypeIcon(question.questionType)}
                      {getQuestionTypeLabel(question.questionType)}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold leading-relaxed">
                    {question.questionText}
                  </h3>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const isCorrect = option.isCorrect;

                    return (
                      <div
                        key={option.id}
                        className={`rounded-lg border-2 p-3 ${
                          isCorrect
                            ? "border-success bg-success/15"
                            : "border-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCorrect && (
                            <Check className="h-4 w-4 shrink-0 text-success" />
                          )}
                          {!isCorrect && (
                            <X className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                  <div className="rounded-lg border bg-accent/15 border-accent/30 p-4">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-sm font-semibold">
                        التوضيح:
                      </span>
                      <p className="text-sm leading-relaxed">
                        {question.justification}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link href="/moderation">
              <ArrowLeft className="ml-2 h-5 w-5" />
              العودة إلى لوحة الإشراف
            </Link>
          </Button>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading quiz preview:", error);
    notFound();
  }
}
