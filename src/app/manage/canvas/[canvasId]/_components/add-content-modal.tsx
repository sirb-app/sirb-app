"use client";

import {
  addFileBlock,
  addTextBlock,
  addVideoBlock,
  updateFileBlock,
  updateTextBlock,
  updateVideoBlock,
} from "@/actions/canvas-manage.action";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { File, FileText, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ContentBlock = {
  id: number;
  sequence: number;
  contentType: "TEXT" | "VIDEO" | "FILE";
  contentId: number;
  data?: any;
};

type AddContentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  canvasId: number;
  initialData?: ContentBlock | null;
};

type ContentType = "TEXT" | "VIDEO" | "FILE";

export default function AddContentModal({
  isOpen,
  onClose,
  canvasId,
  initialData,
}: AddContentModalProps) {
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>("TEXT");
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [textContent, setTextContent] = useState("");

  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoIsExternal, setVideoIsExternal] = useState(false);

  const [fileTitle, setFileTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("application/pdf");
  const [fileIsExternal, setFileIsExternal] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.data) {
        setContentType(initialData.contentType);
        // Populate forms
        if (initialData.contentType === "TEXT") {
          setTextContent(initialData.data.content || "");
        } else if (initialData.contentType === "VIDEO") {
          setVideoTitle(initialData.data.title || "");
          setVideoUrl(initialData.data.url || "");
          setVideoIsExternal(!initialData.data.isOriginal);
        } else if (initialData.contentType === "FILE") {
          setFileTitle(initialData.data.title || "");
          setFileUrl(initialData.data.url || "");
          setFileType(initialData.data.mimeType || "application/pdf");
          setFileIsExternal(!initialData.data.isOriginal);
        }
      } else {
        setContentType("TEXT");
        resetForms();
      }
    }
  }, [isOpen, initialData]);

  const resetForms = () => {
    setTextContent("");
    setVideoTitle("");
    setVideoUrl("");
    setVideoIsExternal(false);
    setFileTitle("");
    setFileUrl("");
    setFileType("application/pdf");
    setFileIsExternal(false);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (contentType === "TEXT") {
        if (!textContent.trim()) return;
        if (initialData) {
          await updateTextBlock({
            blockId: initialData.id,
            canvasId,
            content: textContent,
          });
          toast.success("تم تحديث النص");
        } else {
          await addTextBlock({ canvasId, content: textContent });
          toast.success("تم إضافة النص");
        }
      } else if (contentType === "VIDEO") {
        if (!videoTitle.trim() || !videoUrl.trim()) return;
        const data = {
          canvasId,
          title: videoTitle,
          url: videoUrl,
          isOriginal: !videoIsExternal,
        };
        if (initialData) {
          await updateVideoBlock({ blockId: initialData.id, ...data });
          toast.success("تم تحديث الفيديو");
        } else {
          await addVideoBlock(data);
          toast.success("تم إضافة الفيديو");
        }
      } else if (contentType === "FILE") {
        if (!fileTitle.trim() || !fileUrl.trim()) return;
        const data = {
          canvasId,
          title: fileTitle,
          url: fileUrl,
          mimeType: fileType,
          isOriginal: !fileIsExternal,
        };
        if (initialData) {
          await updateFileBlock({ blockId: initialData.id, ...data });
          toast.success("تم تحديث الملف");
        } else {
          await addFileBlock({ ...data, fileSize: 1024 * 1024 }); // Mock size for new files
          toast.success("تم إضافة الملف");
        }
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (contentType === "TEXT") return textContent.trim().length > 0;
    if (contentType === "VIDEO")
      return videoTitle.trim().length > 0 && videoUrl.trim().length > 0;
    if (contentType === "FILE")
      return fileTitle.trim().length > 0 && fileUrl.trim().length > 0;
    return false;
  };

  const TypeButton = ({
    type,
    icon: Icon,
    label,
  }: {
    type: ContentType;
    icon: any;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => !initialData && setContentType(type)}
      disabled={!!initialData}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
        contentType === type
          ? "border-primary bg-primary/5 text-primary"
          : "bg-muted hover:bg-muted/80 text-muted-foreground border-transparent",
        initialData && contentType !== type && "cursor-not-allowed opacity-50"
      )}
    >
      <div
        className={cn(
          "rounded-full p-2",
          contentType === type ? "bg-primary/10" : "bg-background"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );

  const renderForm = () => {
    switch (contentType) {
      case "TEXT":
        return (
          <div className="animate-in fade-in zoom-in-95 space-y-4 pt-2 duration-200">
            <div className="space-y-2">
              <Label htmlFor="content">المحتوى النصي</Label>
              <Textarea
                id="content"
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="اكتب الشرح هنا..."
                rows={8}
                className="resize-none"
                autoFocus
              />
            </div>
          </div>
        );
      case "VIDEO":
        return (
          <div className="animate-in fade-in zoom-in-95 space-y-4 pt-2 duration-200">
            <div className="space-y-2">
              <Label htmlFor="v-title">عنوان الفيديو</Label>
              <Input
                id="v-title"
                value={videoTitle}
                onChange={e => setVideoTitle(e.target.value)}
                placeholder="مثال: شرح الدرس الأول"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-url">رابط يوتيوب</Label>
              <Input
                id="v-url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                dir="ltr"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <Checkbox
                id="v-external"
                checked={videoIsExternal}
                onCheckedChange={checked =>
                  setVideoIsExternal(checked === true)
                }
              />
              <Label
                htmlFor="v-external"
                className="cursor-pointer text-sm font-normal"
              >
                هذا المحتوى ليس من إعدادي الشخصي
              </Label>
            </div>
          </div>
        );
      case "FILE":
        return (
          <div className="animate-in fade-in zoom-in-95 space-y-4 pt-2 duration-200">
            <div className="space-y-2">
              <Label htmlFor="f-title">عنوان الملف</Label>
              <Input
                id="f-title"
                value={fileTitle}
                onChange={e => setFileTitle(e.target.value)}
                placeholder="مثال: ملخص PDF"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-url">رابط الملف</Label>
              <Input
                id="f-url"
                value={fileUrl}
                onChange={e => setFileUrl(e.target.value)}
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع الملف</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="application/pdf">PDF</SelectItem>
                  <SelectItem value="image/png">صورة</SelectItem>
                  <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                    Word Doc
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <Checkbox
                id="f-external"
                checked={fileIsExternal}
                onCheckedChange={checked => setFileIsExternal(checked === true)}
              />
              <Label
                htmlFor="f-external"
                className="cursor-pointer text-sm font-normal"
              >
                هذا المحتوى ليس من إعدادي الشخصي
              </Label>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="space-y-4 sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "تعديل المحتوى" : "إضافة محتوى جديد"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 pt-2 sm:grid-cols-3">
          <TypeButton type="TEXT" icon={FileText} label="نص" />
          <TypeButton type="VIDEO" icon={Video} label="فيديو" />
          <TypeButton type="FILE" icon={File} label="ملف" />
        </div>

        <div className="border-t pt-4">{renderForm()}</div>

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
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid()}
            className="w-full sm:w-auto"
          >
            {isLoading
              ? "جاري الحفظ..."
              : initialData
                ? "حفظ التعديلات"
                : "حفظ المحتوى"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
