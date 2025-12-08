"use client";

import { deleteQuiz, updateQuiz } from "@/actions/quiz-manage.action";
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

type QuizHeaderProps = {
  quiz: {
    id: number;
    title: string;
    description: string | null;
    status: ContentStatus;
    rejectionReason?: string | null;
    chapter: {
      id: number;
      title: string;
      subjectId: number;
    };
  };
};

export default function QuizHeader({ quiz }: QuizHeaderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description || "");

  const getStatusBadge = () => {
    switch (quiz.status) {
      case "DRAFT":
        return <Badge variant="secondary">مسودة</Badge>;
      case "PENDING":
        return (
          <Badge className="border-accent/30 bg-accent/20 hover:bg-accent/30">
            قيد المراجعة
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="border-success/30 bg-success/20 hover:bg-success/30 text-success">
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
      await updateQuiz({
        quizId: quiz.id,
        title,
        description,
      });
      setIsEditing(false);
      toast.success("تم تحديث التفاصيل");
      router.refresh();
    } catch {
      toast.error("فشل التحديث");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setTitle(quiz.title);
    setDescription(quiz.description || "");
    setIsEditing(false);
  };

  const handleDeleteQuiz = async () => {
    try {
      setIsLoading(true);
      await deleteQuiz(quiz.id);
      toast.success("تم حذف الاختبار");
      router.push(
        `/subjects/${quiz.chapter.subjectId}/chapters/${quiz.chapter.id}`
      );
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
      setIsLoading(false);
    }
  };

  const previewUrl = `/subjects/${quiz.chapter.subjectId}/chapters/${quiz.chapter.id}/quizzes/${quiz.id}`;
  const isEditable = quiz.status !== "PENDING";

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
                  placeholder="عنوان الاختبار"
                />
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="وصف مختصر (اختياري)"
                  rows={2}
                />
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
                          className="text-destructive focus:text-destructive focus:bg-destructive/15 flex-row-reverse"
                          onClick={() => setIsDeleteDialogOpen(true)}
                        >
                          <Trash2 className="text-destructive ml-2 h-4 w-4" />
                          <span>حذف الاختبار</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <h1 className="text-2xl font-bold">{quiz.title}</h1>

                  {getStatusBadge()}
                </div>
                {quiz.description && (
                  <p className="text-muted-foreground mt-1 pr-11">
                    {quiz.description}
                  </p>
                )}
              </div>
            )}

            {quiz.status === "REJECTED" && quiz.rejectionReason && (
              <div className="bg-destructive/15 border-destructive/30 text-destructive mt-2 flex items-start gap-2 rounded-md border p-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <span className="font-semibold">سبب الرفض: </span>
                  {quiz.rejectionReason}
                </div>
              </div>
            )}
          </div>

          {/* Preview Action */}
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
            <AlertDialogTitle>حذف الاختبار نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا الاختبار وجميع أسئلته. لا يمكن التراجع عن هذا
              الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuiz}
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
