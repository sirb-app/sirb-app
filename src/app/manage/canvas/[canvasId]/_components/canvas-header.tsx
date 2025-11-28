"use client";

import { deleteCanvas, updateCanvas } from "@/actions/canvas-manage.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ContentStatus } from "@/generated/prisma";
import {
  AlertCircle,
  Check,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CanvasHeaderProps = {
  canvas: {
    id: number;
    title: string;
    description: string | null;
    status: ContentStatus;
    rejectionReason?: string | null;
    chapterId: number;
    chapter: { subjectId: number };
  };
};

export default function CanvasHeader({ canvas }: CanvasHeaderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [title, setTitle] = useState(canvas.title);
  const [description, setDescription] = useState(canvas.description || "");

  const getStatusBadge = () => {
    switch (canvas.status) {
      case "DRAFT":
        return <Badge variant="secondary">مسودة</Badge>;
      case "PENDING":
        return (
          <Badge className="border-yellow-200 bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25">
            قيد المراجعة
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="border-green-200 bg-green-500/15 text-green-600 hover:bg-green-500/25">
            منشور
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">مرفوض</Badge>;
      default:
        return null;
    }
  };

  const handleSaveDetails = async () => {
    if (!title.trim()) return;
    try {
      setIsLoading(true);
      await updateCanvas({
        canvasId: canvas.id,
        title,
        description,
      });
      setIsEditing(false);
      toast.success("تم تحديث التفاصيل");
      router.refresh();
    } catch (error) {
      toast.error("فشل التحديث");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setTitle(canvas.title);
    setDescription(canvas.description || "");
    setIsEditing(false);
  };

  const handleDeleteCanvas = async () => {
    try {
      setIsLoading(true);
      await deleteCanvas(canvas.id);
      toast.success("تم حذف الشرح");
      router.push(
        `/subjects/${canvas.chapter.subjectId}/chapters/${canvas.chapterId}`
      );
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
      setIsLoading(false);
    }
  };

  const previewUrl = `/subjects/${canvas.chapter.subjectId}/chapters/${canvas.chapterId}/canvases/${canvas.id}`;
  const isEditable = canvas.status !== "PENDING";

  return (
    <div className="space-y-4 border-b pb-6">
      <div className="flex flex-col gap-6">
        {/* Top Bar: Title/Badge & Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Title Section */}
          <div className="flex-1 space-y-2">
            {isEditing ? (
              <div className="max-w-xl space-y-3">
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="text-lg font-bold"
                  placeholder="عنوان الشرح"
                />
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="وصف مختصر (اختياري)"
                  rows={2}
                />
                {/* Buttons in RTL order: Cancel then Save */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    <X className="ml-1 h-4 w-4" /> إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDetails}
                    disabled={isLoading}
                  >
                    <Check className="ml-1 h-4 w-4" /> حفظ
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Options Dropdown */}
                  {isEditable && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setIsEditing(true)}
                          className="flex-row-reverse"
                        >
                          <Pencil className="ml-2 h-4 w-4" />
                          <span>تعديل التفاصيل</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 flex-row-reverse"
                          onClick={() => setIsDeleteDialogOpen(true)}
                        >
                          <Trash2 className="text-destructive ml-2 h-4 w-4" />
                          <span>حذف الشرح</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <h1 className="text-2xl font-bold">{canvas.title}</h1>

                  {getStatusBadge()}
                </div>
                {canvas.description && (
                  <p className="text-muted-foreground mt-1 pr-11">
                    {canvas.description}
                  </p>
                )}
              </div>
            )}

            {canvas.status === "REJECTED" && canvas.rejectionReason && (
              <div className="bg-destructive/10 text-destructive mt-2 flex items-start gap-2 rounded-md p-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <span className="font-semibold">سبب الرفض: </span>
                  {canvas.rejectionReason}
                </div>
              </div>
            )}
          </div>

          {/* Preview Action Only */}
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={previewUrl} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                معاينة
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الشرح نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا الشرح وجميع محتوياته. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCanvas}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
