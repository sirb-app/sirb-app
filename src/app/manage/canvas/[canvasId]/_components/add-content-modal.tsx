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
  const [fileIsExternal, setFileIsExternal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.data) {
        setContentType(initialData.contentType);

        // Reset ALL fields to empty strings first (prevents undefined → defined)
        setTextContent("");
        setVideoTitle("");
        setVideoUrl("");
        setVideoIsExternal(false);
        setFileTitle("");
        setFileIsExternal(false);
        setSelectedFile(null);
        setIsUploading(false);

        // Then populate only the relevant fields for the content type
        if (initialData.contentType === "TEXT") {
          setTextContent(initialData.data.content || "");
        } else if (initialData.contentType === "VIDEO") {
          setVideoTitle(initialData.data.title || "");
          setVideoUrl(initialData.data.url || "");
          setVideoIsExternal(!initialData.data.isOriginal);
        } else if (initialData.contentType === "FILE") {
          setFileTitle(initialData.data.title || "");
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
    setFileIsExternal(false);
    setSelectedFile(null);
    setIsUploading(false);
  };

  // File validation
  const validateFile = (file: File): boolean => {
    const maxSize = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

    if (file.size > maxSize) {
      toast.error("حجم الملف يجب أن يكون أقل من 10 ميجابايت");
      return false;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "image/png",
      "image/jpeg",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("نوع الملف غير مدعوم");
      return false;
    }

    return true;
  };

  // Upload file to R2
  const uploadFileToR2 = async (file: File): Promise<string> => {
    // 1. Get presigned URL from API
    const res = await fetch("/api/r2/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        canvasId,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { presignedUrl, key } = await res.json();

    // 2. Upload file directly to R2
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("Upload failed");
    }

    return key;
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
        if (!fileTitle.trim()) {
          toast.error("الرجاء إدخال عنوان الملف");
          return;
        }

        if (!initialData && !selectedFile) {
          toast.error("الرجاء اختيار ملف");
          return;
        }

        let uploadedKey: string | null = null;

        try {
          // Upload file to R2 if new file selected
          if (selectedFile) {
            setIsUploading(true);
            uploadedKey = await uploadFileToR2(selectedFile);
          }

          const data: any = {
            canvasId,
            title: fileTitle,
            isOriginal: !fileIsExternal,
          };

          if (initialData) {
            // Update existing file
            if (uploadedKey) {
              data.r2Key = uploadedKey;
              data.fileSize = selectedFile!.size;
              data.mimeType = selectedFile!.type;
            }
            const result = await updateFileBlock({ blockId: initialData.id, ...data });

            // Cleanup old file from R2 if it was replaced
            if (result.oldKey && uploadedKey) {
              fetch("/api/r2/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: result.oldKey }),
              }).catch(() => {}); // Silent cleanup
            }

            toast.success("تم تحديث الملف");
          } else {
            // Add new file
            data.r2Key = uploadedKey!;
            data.fileSize = selectedFile!.size;
            data.mimeType = selectedFile!.type;
            await addFileBlock(data);
            toast.success("تم إضافة الملف بنجاح");
          }
        } catch (uploadError) {
          // Cleanup orphaned file if DB save failed
          if (uploadedKey) {
            fetch("/api/r2/delete", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: uploadedKey }),
            }).catch(() => {}); // Silent cleanup
          }
          throw uploadError;
        } finally {
          setIsUploading(false);
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
    if (contentType === "FILE") {
      const hasTitle = fileTitle.trim().length > 0;
      const hasFile = initialData ? true : selectedFile !== null;
      return hasTitle && hasFile;
    }
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
          <div className="animate-in fade-in zoom-in-95 space-y-5 pt-2 duration-200">
            {/* File Title */}
            <div className="space-y-2">
              <Label htmlFor="f-title">عنوان الملف</Label>
              <Input
                id="f-title"
                value={fileTitle}
                onChange={e => setFileTitle(e.target.value)}
                placeholder="مثال: ملخص الفصل الأول"
                autoFocus
                disabled={isUploading}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">الملف</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.gif"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && validateFile(file)) {
                    setSelectedFile(file);
                  } else if (file) {
                    e.target.value = ""; // Reset input
                  }
                }}
                disabled={isUploading}
                className="cursor-pointer"
              />

              {/* File Info */}
              {selectedFile && !isUploading && (
                <div className="bg-muted/50 mt-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <File className="text-muted-foreground h-5 w-5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-foreground truncate text-sm font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} ميجابايت
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        const input = document.getElementById("file-upload") as HTMLInputElement;
                        if (input) input.value = "";
                      }}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      disabled={isUploading}
                    >
                      <span className="text-xs">إزالة</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="bg-primary/5 mt-2 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div className="bg-primary h-full w-full animate-pulse rounded-full" />
                    </div>
                    <span className="text-primary shrink-0 text-xs font-medium">
                      جاري الرفع...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Source Attribution */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="f-external"
                  checked={fileIsExternal}
                  onCheckedChange={checked => setFileIsExternal(checked === true)}
                  disabled={isUploading}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="f-external"
                  className="cursor-pointer text-sm font-normal leading-relaxed"
                >
                  هذا المحتوى ليس من إعدادي الشخصي (منقول من مصدر خارجي)
                </Label>
              </div>
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
            disabled={isLoading || isUploading || !isFormValid()}
            className="w-full sm:w-auto"
          >
            {isUploading
              ? "جاري الرفع..."
              : isLoading
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
