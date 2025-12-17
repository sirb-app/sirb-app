"use client";

import { rejectCanvas, rejectQuiz } from "@/actions/moderation.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

type RejectDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  contentId: number | null;
  contentType: "canvas" | "quiz" | null;
  onSuccess: () => void;
};

export default function RejectDialog({
  isOpen,
  onClose,
  contentId,
  contentType,
  onSuccess,
}: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!contentId || !reason.trim() || !contentType) return;

    try {
      setIsLoading(true);

      if (contentType === "canvas") {
        await rejectCanvas({ canvasId: contentId, reason });
        toast.success("تم رفض الشرح");
      } else if (contentType === "quiz") {
        await rejectQuiz({ quizId: contentId, reason });
        toast.success("تم رفض الاختبار");
      }

      onSuccess();
      setReason("");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("already been processed")) {
        toast.info(
          contentType === "quiz"
            ? "تمت معالجة هذا الاختبار مسبقاً"
            : "تمت معالجة هذا الشرح مسبقاً"
        );
        onSuccess(); // Refresh to update the list
        onClose();
      } else {
        toast.error("حدث خطأ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>
            {contentType === "quiz" ? "رفض الاختبار" : "رفض الشرح"}
          </DialogTitle>
          <DialogDescription>
            يرجى كتابة سبب الرفض ليتمكن المساهم من التعديل.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="سبب الرفض..."
            rows={4}
          />
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || reason.length < 5}
            className="w-full sm:w-auto"
          >
            {isLoading ? "جاري الرفض..." : "رفض"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
