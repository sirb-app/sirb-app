"use client";

import { createQuiz } from "@/actions/quiz-manage.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CreateQuizModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
};

export default function CreateQuizModal({
  isOpen,
  onClose,
  chapterId,
}: CreateQuizModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      setIsLoading(true);
      const result = await createQuiz({
        title,
        description,
        chapterId,
      });

      if (result.success) {
        toast.success("تم إنشاء الاختبار");
        router.push(`/manage/quiz/${result.quizId}`);
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء الاختبار");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="space-y-4 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة اختبار جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              عنوان الاختبار <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: اختبار الفصل الأول"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">وصف مختصر (اختياري)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="اكتب نبذة عن محتوى الاختبار..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading || !title.trim()}
            className="w-full sm:w-auto"
          >
            {isLoading ? "جاري الإنشاء..." : "إنشاء"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
