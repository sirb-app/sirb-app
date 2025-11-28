"use client";

import { rejectCanvas } from "@/actions/moderation.action";
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
  canvasId: number | null;
  onSuccess: () => void;
};

export default function RejectDialog({
  isOpen,
  onClose,
  canvasId,
  onSuccess,
}: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!canvasId || !reason.trim()) return;

    try {
      setIsLoading(true);
      await rejectCanvas({ canvasId, reason });
      toast.success("تم رفض المحتوى");
      onSuccess();
      setReason("");
      onClose();
    } catch (error) {
      toast.error("حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>رفض المحتوى</DialogTitle>
          <DialogDescription>
            يرجى كتابة سبب الرفض ليتمكن المساهم من تعديل المحتوى.
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
