"use client";

import { updateReportStatus } from "@/actions/admin-report.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

type DismissReportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  reportId: number | null;
  onSuccess: () => void;
};

export default function DismissReportDialog({
  isOpen,
  onClose,
  reportId,
  onSuccess,
}: DismissReportDialogProps) {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reportId) return;

    try {
      setIsLoading(true);

      const result = await updateReportStatus(
        reportId,
        "DISMISSED",
        notes.trim() || undefined
      );

      if ("error" in result && result.error) {
        toast.error(typeof result.error === "string" ? result.error : "حدث خطأ");
        return;
      }

      toast.success("تم تجاهل البلاغ");
      setNotes("");
      onClose();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تجاهل البلاغ</DialogTitle>
          <DialogDescription>
            سيتم وضع علامة على هذا البلاغ كـ &quot;تم التجاهل&quot; بدون اتخاذ
            أي إجراء.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dismiss-notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="dismiss-notes"
              placeholder="أضف ملاحظات حول سبب التجاهل..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-muted-foreground text-xs">
              {notes.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "جاري التجاهل..." : "تجاهل البلاغ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
