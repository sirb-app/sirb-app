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

type ContentBlock = {
  id: number;
  sequence: number;
  contentType: "TEXT" | "VIDEO" | "FILE";
  contentId: number;
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
      await deleteContentBlock(block.id, canvasId);
      toast.success("تم حذف المحتوى");
      router.refresh();
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  const getIcon = () => {
    switch (block.contentType) {
      case "TEXT":
        return <FileText className="h-6 w-6 text-blue-600" />;
      case "VIDEO":
        return <Video className="h-6 w-6 text-red-600" />;
      case "FILE":
        return <File className="h-6 w-6 text-yellow-600" />;
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
    return block.data.title;
  };

  return (
    <Card
      className={cn(
        "group hover:border-primary/20 mb-3 transition-all",
        isDeleting && "opacity-50"
      )}
    >
      <CardContent className="flex items-center gap-6 p-4">
        {/* Move Buttons */}
        {!isReadOnly && (
          <div className="text-muted-foreground flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent hover:text-accent-foreground h-6 w-6"
              disabled={isFirst}
              onClick={onMoveUp}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent hover:text-accent-foreground h-6 w-6"
              disabled={isLast}
              onClick={onMoveDown}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Icon & Type */}
        <div className="flex min-w-[80px] flex-col items-center justify-center gap-1 text-center">
          <div className="bg-muted/50 group-hover:bg-muted rounded-lg p-3 transition-colors">
            {getIcon()}
          </div>
          <span className="text-foreground text-sm font-bold">
            {getLabel()}
          </span>
        </div>

        {/* Content Info */}
        <div className="mr-2 min-w-0 flex-1 border-r pr-6">
          <div
            className={cn(
              "text-muted-foreground line-clamp-2 text-sm",
              block.contentType !== "TEXT" &&
                "text-foreground text-base font-medium"
            )}
          >
            {getContentPreview()}
          </div>
        </div>

        {/* Actions (Vertical) */}
        {!isReadOnly && (
          <div className="mr-2 flex flex-col gap-2 border-r pr-4">
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
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف هذا المحتوى نهائياً.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
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
