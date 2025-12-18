"use client";

import { createCanvas } from "@/actions/canvas-manage.action";
import { CanvasImageUpload } from "@/components/canvas-image-upload";
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
import { useRef, useState } from "react";
import { toast } from "sonner";

type CreateCanvasModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
};

export default function CreateCanvasModal({
  isOpen,
  onClose,
  chapterId,
}: CreateCanvasModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const imageKeyRef = useRef<string | null>(null);

  const handleImageChange = (url: string | null, key: string | null) => {
    setImageUrl(url);
    imageKeyRef.current = key;
  };

  const cleanupTempImage = async () => {
    if (imageKeyRef.current) {
      try {
        await fetch("/api/r2/delete/canvas-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: imageKeyRef.current }),
        });
      } catch (error) {
        console.error("Failed to cleanup temp image:", error);
      }
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl(null);
    imageKeyRef.current = null;
  };

  const handleClose = async () => {
    await cleanupTempImage();
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      setIsLoading(true);
      const result = await createCanvas({
        title,
        description,
        chapterId,
        imageUrl: imageUrl || undefined,
      });

      if (result.success) {
        // Don't cleanup the image since it's now saved with the canvas
        resetForm();
        toast.success("تم إنشاء الدرس");
        router.push(`/manage/canvas/${result.canvasId}`);
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء الدرس");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="space-y-4 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة شرح جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              عنوان الشرح <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: مقدمة في التكامل"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">وصف مختصر</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="اكتب نبذة عن محتوى الشرح..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>صورة الغلاف</Label>
            <CanvasImageUpload
              currentImageUrl={imageUrl}
              onImageChange={handleImageChange}
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-xs">
              صيغ مدعومة: PNG, JPEG, WebP. الحد الأقصى: 5 ميجابايت
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
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
