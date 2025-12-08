"use client";

import { cancelSubmission, submitCanvas } from "@/actions/canvas-manage.action";
import { Button } from "@/components/ui/button";
import { ContentStatus } from "@/generated/prisma";
import { Send, Undo } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CanvasFooterActionsProps = {
  canvasId: number;
  status: ContentStatus;
  hasContent: boolean;
};

export default function CanvasFooterActions({
  canvasId,
  status,
  hasContent,
}: CanvasFooterActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await submitCanvas(canvasId);
      toast.success("تم إرسال الشرح للمراجعة");
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء الإرسال");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      await cancelSubmission(canvasId);
      toast.success("تم إلغاء الطلب، يمكنك التعديل الآن");
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء الإلغاء");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "APPROVED") return null;

  return (
    <div className="mt-8 flex justify-end border-t pt-4 sm:mt-12 sm:pt-6">
      {(status === "DRAFT" || status === "REJECTED") && (
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !hasContent}
          size="sm"
          className="sm:size-lg w-full gap-1.5 text-xs sm:w-auto sm:gap-2 sm:text-sm"
        >
          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">
            {status === "REJECTED"
              ? "إعادة الإرسال للمراجعة"
              : "إرسال للمراجعة"}
          </span>
          <span className="sm:hidden">إرسال</span>
        </Button>
      )}

      {status === "PENDING" && (
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={isLoading}
          size="sm"
          className="sm:size-lg w-full gap-1.5 text-xs sm:w-auto sm:gap-2 sm:text-sm"
        >
          <Undo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">إلغاء الطلب والعودة للتعديل</span>
          <span className="sm:hidden">إلغاء</span>
        </Button>
      )}
    </div>
  );
}
