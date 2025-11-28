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
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  File,
  FileText,
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

type ContentBlock = {
  id: number;
  sequence: number;
  contentType: "TEXT" | "VIDEO" | "FILE";
  data?: any;
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
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get file extension from MIME type
  const getFileExtension = (mimeType: string): string => {
    const extensionMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
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
        return <FileText className="text-primary h-6 w-6" />;
      case "VIDEO":
        return <Video className="text-primary h-6 w-6" />;
      case "FILE":
        return <File className="text-primary h-6 w-6" />;
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
    }
  };

  const getContentPreview = () => {
    if (!block.data) return "محمل...";
    if (block.contentType === "TEXT") {
      return block.data.content;
    }
    if (block.contentType === "FILE") {
      const extension = block.data.mimeType ? getFileExtension(block.data.mimeType) : "";
      const size = block.data.fileSize ? formatFileSize(block.data.fileSize) : "";
      return (
        <div>
          <div className="text-foreground text-base font-medium">{block.data.title}</div>
          <div className="text-muted-foreground mt-1 text-xs">
            <span>{size}</span>
            {extension && size && <span className="mx-1">•</span>}
            <span>{extension}</span>
          </div>
        </div>
      );
    }
    return block.data.title;
  };

  return (
    <Card
      className={cn(
        "group hover:border-primary/20 mb-3 transition-all",
        isDeleting && "opacity-50"
      )}
    >
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Move Buttons */}
        {!isReadOnly && (
          <div className="text-muted-foreground flex flex-row gap-2 sm:flex-col sm:gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent hover:text-accent-foreground h-8 w-8 sm:h-6 sm:w-6"
              disabled={isFirst}
              onClick={onMoveUp}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent hover:text-accent-foreground h-8 w-8 sm:h-6 sm:w-6"
              disabled={isLast}
              onClick={onMoveDown}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Icon & Type */}
        <div className="flex min-w-[70px] flex-col items-center justify-center gap-1 text-center sm:min-w-[80px]">
          <div className="bg-muted/50 group-hover:bg-muted rounded-lg p-2 transition-colors sm:p-3">
            {getIcon()}
          </div>
          <span className="text-foreground text-xs font-bold sm:text-sm">
            {getLabel()}
          </span>
        </div>

        {/* Content Info */}
        <div className="min-w-0 flex-1 border-b pb-4 sm:mr-2 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
          {block.contentType === "FILE" ? (
            getContentPreview()
          ) : (
            <div
              className={cn(
                "text-muted-foreground line-clamp-2 text-sm",
                block.contentType !== "TEXT" &&
                  "text-foreground text-base font-medium"
              )}
            >
              {getContentPreview()}
            </div>
          )}
        </div>

        {/* Actions (Vertical) */}
        {!isReadOnly && (
          <div className="flex flex-row justify-end gap-4 sm:mr-2 sm:flex-col sm:gap-2 sm:border-r sm:pr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="hover:text-primary h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
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
