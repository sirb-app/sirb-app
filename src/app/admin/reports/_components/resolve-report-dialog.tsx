"use client";

import { resolveReportWithAction } from "@/actions/admin-report.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

type ResolveReportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  reportId: number | null;
  onSuccess: () => void;
};

export default function ResolveReportDialog({
  isOpen,
  onClose,
  reportId,
  onSuccess,
}: ResolveReportDialogProps) {
  const [notes, setNotes] = useState("");
  const [deleteContent, setDeleteContent] = useState(false);
  const [banUser, setBanUser] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("7");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reportId) return;

    if (banUser && !banReason.trim()) {
      toast.error("يرجى كتابة سبب الحظر");
      return;
    }

    try {
      setIsLoading(true);

      const result = await resolveReportWithAction(reportId, {
        deleteContent,
        banUser,
        banReason: banUser ? banReason.trim() : undefined,
        banDuration: banUser ? parseInt(banDuration) : undefined,
        resolutionNotes: notes.trim() || undefined,
      });

      if ("error" in result && result.error) {
        toast.error(typeof result.error === "string" ? result.error : "حدث خطأ");
        return;
      }

      toast.success("تم حل البلاغ بنجاح");
      setNotes("");
      setDeleteContent(false);
      setBanUser(false);
      setBanReason("");
      setBanDuration("7");
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
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>حل البلاغ</DialogTitle>
          <DialogDescription>
            تأكيد أن المحتوى المبلغ عنه يخالف القواعد واتخاذ الإجراءات المناسبة.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="resolve-notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="resolve-notes"
              placeholder="أضف ملاحظات حول القرار..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-muted-foreground text-xs">{notes.length}/500</p>
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">الإجراءات</h4>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="delete-content"
                  checked={deleteContent}
                  onCheckedChange={(checked) =>
                    setDeleteContent(checked === true)
                  }
                />
                <Label
                  htmlFor="delete-content"
                  className="cursor-pointer text-sm font-normal"
                >
                  حذف المحتوى المخالف
                </Label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="ban-user"
                    checked={banUser}
                    onCheckedChange={(checked) => {
                      setBanUser(checked === true);
                      if (checked !== true) {
                        setBanReason("");
                        setBanDuration("7");
                      }
                    }}
                  />
                  <Label
                    htmlFor="ban-user"
                    className="cursor-pointer text-sm font-normal"
                  >
                    حظر المستخدم
                  </Label>
                </div>

                {banUser && (
                  <div className="mr-6 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="ban-reason" className="text-sm">
                        سبب الحظر <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="ban-reason"
                        placeholder="اكتب سبب الحظر..."
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        className="min-h-[60px] resize-none"
                        maxLength={200}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ban-duration" className="text-sm">
                        مدة الحظر
                      </Label>
                      <Select value={banDuration} onValueChange={setBanDuration}>
                        <SelectTrigger id="ban-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">يوم واحد</SelectItem>
                          <SelectItem value="3">3 أيام</SelectItem>
                          <SelectItem value="7">7 أيام</SelectItem>
                          <SelectItem value="14">14 يوم</SelectItem>
                          <SelectItem value="30">30 يوم</SelectItem>
                          <SelectItem value="0">دائم</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
            className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
          >
            {isLoading ? "جاري الحل..." : "حل البلاغ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
