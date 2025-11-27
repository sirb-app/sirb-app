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
    } catch (error) {
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
    } catch (error) {
      toast.error("حدث خطأ أثناء الإلغاء");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "APPROVED") return null;

  return (
    <div className="mt-12 flex justify-end border-t pt-6">
      {(status === "DRAFT" || status === "REJECTED") && (
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !hasContent}
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
