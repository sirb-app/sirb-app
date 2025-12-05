"use client";

import { cancelSubmission, submitQuiz } from "@/actions/quiz-manage.action";
import { Button } from "@/components/ui/button";
import { ContentStatus } from "@/generated/prisma";
import { Send, Undo } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type QuizFooterActionsProps = {
  quizId: number;
  chapterId: number;
  subjectId: number;
  status: ContentStatus;
  hasQuestions: boolean;
};

export default function QuizFooterActions({
  quizId,
  chapterId,
  subjectId,
  status,
  hasQuestions,
}: QuizFooterActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await submitQuiz(quizId);
      toast.success("تم إرسال الاختبار للمراجعة");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الإرسال");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      await cancelSubmission(quizId);
      toast.success("تم إلغاء الطلب، يمكنك التعديل الآن");
      router.refresh();
    } catch (error) {
      toast.error("حدث خطأ أثناء الإلغاء");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "APPROVED") {
    return (
      <div className="mt-12 flex justify-center border-t pt-6">
        <Button variant="outline" asChild>
          <Link href={`/subjects/${subjectId}/chapters/${chapterId}`}>
            العودة إلى الفصل
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-12 flex justify-end border-t pt-6">
      {(status === "DRAFT" || status === "REJECTED") && (
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !hasQuestions}
          size="lg"
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {status === "REJECTED" ? "إعادة الإرسال للمراجعة" : "إرسال للمراجعة"}
        </Button>
      )}

      {status === "PENDING" && (
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={isLoading}
          size="lg"
          className="gap-2"
        >
          <Undo className="h-4 w-4" />
          إلغاء الطلب والعودة للتعديل
        </Button>
      )}
    </div>
  );
}
