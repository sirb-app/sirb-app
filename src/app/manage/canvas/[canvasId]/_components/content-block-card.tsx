"use client";

import { deleteContentBlock } from "@/actions/canvas-manage.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TipTapViewer } from "@/components/ui/tiptap-viewer";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  File,
  FileText,
  HelpCircle,
  Pencil,
  Trash2,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// Format file size helper
function formatFileSize(bytes: bigint): string {
  const size = Number(bytes);
  if (size < 1024) return `${size} بايت`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} كيلوبايت`;
  return `${(size / (1024 * 1024)).toFixed(2)} ميجابايت`;
}

type ContentBlockData = {
  content?: string;
  title?: string;
  url?: string;
  isOriginal?: boolean;
  mimeType?: string;
  fileSize?: bigint;
  questionText?: string;
  questionType?: string;
  justification?: string | null;
  options?: Array<{ optionText: string; isCorrect: boolean }>;
  [key: string]: unknown;
};

type ContentBlock = {
  id: number;
  sequence: number;
  contentType: "TEXT" | "VIDEO" | "FILE" | "QUESTION";
  data?: ContentBlockData | null;
};

type ContentBlockCardProps = {
  block: ContentBlock;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  canvasId: number;
  isReadOnly?: boolean;
};

export default function ContentBlockCard({
  block,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  canvasId,
  isReadOnly = false,
}: ContentBlockCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteContentBlock(block.id, canvasId);

      // Cleanup file from R2 if it was a FILE block
      if (result.r2Key) {
        fetch("/api/r2/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: result.r2Key }),
        }).catch(() => {}); // Silent cleanup
      }

      toast.success("تم حذف المحتوى");
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get file extension from MIME type
  const getFileExtension = (mimeType: string): string => {
    const extensionMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        ".pptx",
      "text/plain": ".txt",
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/gif": ".gif",
    };
    return extensionMap[mimeType] || "";
  };

  const getIcon = () => {
    switch (block.contentType) {
      case "TEXT":
        return <FileText className="text-primary h-5 w-5 sm:h-6 sm:w-6" />;
      case "VIDEO":
        return <Video className="text-primary h-5 w-5 sm:h-6 sm:w-6" />;
      case "FILE":
        return <File className="text-primary h-5 w-5 sm:h-6 sm:w-6" />;
      case "QUESTION":
        return <HelpCircle className="text-primary h-5 w-5 sm:h-6 sm:w-6" />;
    }
  };

  const getLabel = () => {
    switch (block.contentType) {
      case "TEXT":
        return "نص";
      case "VIDEO":
        return "مقطع فيديو";
      case "FILE":
        return "ملف";
      case "QUESTION":
        return "سؤال";
    }
  };

  const getContentPreview = () => {
    if (!block.data) return "محمل...";
    if (block.contentType === "TEXT") {
      return (
        <TipTapViewer
          content={block.data.content || ""}
          className="line-clamp-2 text-sm [&>*]:my-0"
        />
      );
    }
    if (block.contentType === "FILE") {
      const extension = block.data.mimeType
        ? getFileExtension(block.data.mimeType)
        : "";
      const size = block.data.fileSize
        ? formatFileSize(block.data.fileSize)
        : "";
      return (
        <div>
          <div className="text-foreground text-base font-medium">
            {block.data.title}
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            <span>{size}</span>
            {extension && size && <span className="mx-1">•</span>}
            <span>{extension}</span>
          </div>
        </div>
      );
    }
    if (block.contentType === "QUESTION") {
      const questionTypeLabels: Record<string, string> = {
        MCQ_SINGLE: "اختيار واحد",
        MCQ_MULTI: "خيارات متعددة",
        TRUE_FALSE: "صح أم خطأ",
      };
      const typeLabel = block.data.questionType
        ? questionTypeLabels[block.data.questionType]
        : "سؤال";
      return (
        <div>
          <div className="text-foreground text-base font-medium">
            <TipTapViewer
              content={block.data.questionText || ""}
              className="line-clamp-2 [&>*]:my-0"
            />
          </div>
          <div className="text-muted-foreground mt-1 text-xs">{typeLabel}</div>
        </div>
      );
    }
    return block.data.title;
  };

  return (
    <Card
      className={cn(
        "group hover:border-primary/20 transition-all",
        isDeleting && "opacity-50"
      )}
    >
      <CardContent className="flex flex-row items-center justify-between gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="flex flex-row items-center gap-3 sm:gap-4">
          {/* Move Buttons - Always stacked vertically */}
          {!isReadOnly && (
            <div className="text-muted-foreground flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent hover:text-accent-foreground h-7 w-7 sm:h-6 sm:w-6"
                disabled={isFirst}
                onClick={onMoveUp}
              >
                <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent hover:text-accent-foreground h-7 w-7 sm:h-6 sm:w-6"
                disabled={isLast}
                onClick={onMoveDown}
              >
                <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}

          {/* Icon & Type */}
          <div className="flex min-w-[60px] flex-row items-center gap-2 sm:min-w-[80px] sm:flex-col sm:items-center sm:justify-center sm:gap-1 sm:text-center">
            <div className="bg-muted/50 group-hover:bg-muted rounded-md p-1.5 transition-colors sm:rounded-lg sm:p-2.5">
              {getIcon()}
            </div>
            <span className="text-foreground text-xs font-semibold sm:text-xs sm:font-bold">
              {getLabel()}
            </span>
          </div>

          {/* Content Info - Hidden on mobile, shown on desktop */}
          <div className="hidden min-w-0 flex-1 sm:mr-2 sm:block sm:border-r sm:pr-4">
            {block.contentType === "FILE" ||
            block.contentType === "TEXT" ||
            block.contentType === "QUESTION" ? (
              getContentPreview()
            ) : (
              <div
                className={cn(
                  "text-muted-foreground line-clamp-2 text-sm",
                  "text-foreground text-sm font-medium sm:text-base"
                )}
              >
                {getContentPreview()}
              </div>
            )}
          </div>
        </div>

        {/* Actions - Always stacked vertically, positioned at the end */}
        {!isReadOnly && (
          <div className="flex shrink-0 flex-col gap-2 sm:mr-2 sm:border-r sm:pr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="hover:text-primary h-7 w-7 p-0 sm:h-8 sm:w-8"
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-7 w-7 p-0 sm:h-8 sm:w-8"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف هذا المحتوى نهائياً.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
