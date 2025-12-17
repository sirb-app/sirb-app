"use client";

import { deleteQuestion } from "@/actions/quiz-question.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TipTapViewer } from "@/components/ui/tiptap-viewer";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type QuestionOption = {
  id: number;
  sequence: number;
  optionText: string;
  isCorrect: boolean;
};

type Question = {
  id: number;
  sequence: number;
  questionType: "MCQ_SINGLE" | "MCQ_MULTI" | "TRUE_FALSE";
  questionText: string;
  justification: string | null;
  options: QuestionOption[];
};

type QuestionCardProps = {
  question: Question;
  questionNumber: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  quizId: number;
  isReadOnly?: boolean;
};

export default function QuestionCard({
  question,
  questionNumber,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  quizId,
  isReadOnly = false,
}: QuestionCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteQuestion(question.id, quizId);
      toast.success("تم حذف السؤال");
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  const getQuestionTypeBadge = () => {
    switch (question.questionType) {
      case "MCQ_SINGLE":
        return <Badge variant="secondary">اختيار من متعدد (إجابة واحدة)</Badge>;
      case "MCQ_MULTI":
        return (
          <Badge variant="secondary">اختيار من متعدد (أكثر من إجابة)</Badge>
        );
      case "TRUE_FALSE":
        return <Badge variant="secondary">صح/خطأ</Badge>;
    }
  };

  return (
    <Card
      className={cn(
        "group hover:border-primary/20 mb-3 transition-all",
        isDeleting && "opacity-50"
      )}
    >
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-6">
        {/* Move Buttons */}
        {!isReadOnly && (
          <div className="text-muted-foreground flex flex-row gap-2 sm:flex-col sm:gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent hover:text-accent-foreground h-8 w-8 sm:h-6 sm:w-6"
              disabled={isFirst}
              onClick={onMoveUp}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent hover:text-accent-foreground h-8 w-8 sm:h-6 sm:w-6"
              disabled={isLast}
              onClick={onMoveDown}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Question Number Badge */}
        <div className="flex min-w-[60px] flex-col items-center justify-center">
          <div className="bg-primary/15 border-primary/30 text-primary flex h-12 w-12 items-center justify-center rounded-full border text-lg font-bold">
            {questionNumber}
          </div>
        </div>

        {/* Question Content */}
        <div className="min-w-0 flex-1 space-y-3 border-b pb-4 sm:mr-2 sm:border-r sm:border-b-0 sm:pr-6 sm:pb-0">
          <div className="flex flex-wrap items-start gap-2">
            <div className="text-foreground flex-1 text-base font-medium">
              <TipTapViewer
                content={question.questionText}
                className="[&>*]:my-0"
              />
            </div>
            {getQuestionTypeBadge()}
          </div>

          {/* Options */}
          <div className="space-y-2">
            {question.options.map(option => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  option.isCorrect
                    ? "bg-success/15 text-success border-success/30 border"
                    : "bg-muted/50"
                )}
              >
                {option.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <Circle className="text-muted-foreground h-4 w-4 shrink-0" />
                )}
                <span>{option.optionText}</span>
              </div>
            ))}
          </div>

          {/* Justification */}
          {question.justification && (
            <div className="bg-accent/15 border-accent/30 rounded-md border p-3 text-sm">
              <span className="text-foreground font-semibold">التوضيح: </span>
              <span className="text-muted-foreground">
                <TipTapViewer
                  content={question.justification}
                  className="inline [&>*]:my-0 [&>*]:inline"
                />
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isReadOnly && (
          <div className="flex flex-row justify-end gap-4 sm:mr-2 sm:flex-col sm:gap-2 sm:border-r sm:pr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="hover:text-primary h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف هذا السؤال نهائياً.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
