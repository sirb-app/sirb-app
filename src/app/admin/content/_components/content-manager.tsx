"use client";

import {
  approveContentAction,
  deleteContentAction,
  rejectContentAction,
} from "@/actions/content.actions";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Prisma } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  Trash2,
  Video,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type ContentWithRelations = Prisma.ContentGetPayload<{
  include: {
    contributor: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
      };
    };
    chapter: {
      select: {
        id: true;
        title: true;
        subject: {
          select: {
            id: true;
            name: true;
            code: true;
            college: {
              select: {
                name: true;
                university: {
                  select: {
                    name: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    _count: {
      select: {
        votes: true;
        comments: true;
        userProgress: true;
      };
    };
  };
}>;

interface ContentManagerProps {
  content: ContentWithRelations[];
  total: number;
  currentPage: number;
  subjects: Array<{ id: number; name: string; code: string }>;
}

const statusLabels = {
  PENDING: "قيد المراجعة",
  APPROVED: "موافق عليه",
  REJECTED: "مرفوض",
};

const contentTypeLabels = {
  VIDEO: "فيديو",
  FILE: "ملف",
  QUIZ: "اختبار",
};

const contentTypeIcons = {
  VIDEO: Video,
  FILE: FileText,
  QUIZ: FileText,
};

export function ContentManager({
  content,
  total,
  currentPage,
  subjects,
}: ContentManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetContent, setTargetContent] =
    useState<ContentWithRelations | null>(null);

  const [moderatorNotes, setModeratorNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? ""
  );

  const statusFilter = searchParams.get("status") ?? "all";
  const typeFilter = searchParams.get("type") ?? "all";
  const subjectFilter = searchParams.get("subject") ?? "all";
  const itemsPerPage = 20;
  const totalPages = Math.ceil(total / itemsPerPage);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "all" || !value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.delete("page");
    router.push(`/admin/content?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const clearSearch = () => {
    setSearchInput("");
    updateFilters({ search: "" });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    router.push(`/admin/content?${params.toString()}`);
  };

  const handleApprove = () => {
    if (!targetContent) return;
    startTransition(async () => {
      const res = await approveContentAction(
        targetContent.id,
        moderatorNotes || undefined
      );
      if (!("error" in res) || res.error === null) {
        toast.success("تمت الموافقة على المحتوى");
        setApproveOpen(false);
        setTargetContent(null);
        setModeratorNotes("");
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  const handleReject = () => {
    if (!targetContent || !rejectionReason.trim()) {
      toast.error("سبب الرفض مطلوب");
      return;
    }
    startTransition(async () => {
      const res = await rejectContentAction(
        targetContent.id,
        rejectionReason,
        moderatorNotes || undefined
      );
      if (!("error" in res) || res.error === null) {
        toast.success("تم رفض المحتوى");
        setRejectOpen(false);
        setTargetContent(null);
        setRejectionReason("");
        setModeratorNotes("");
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = () => {
    if (!targetContent) return;
    startTransition(async () => {
      const res = await deleteContentAction(targetContent.id);
      if (!("error" in res) || res.error === null) {
        toast.success("تم حذف المحتوى");
        setDeleteOpen(false);
        setTargetContent(null);
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .filter(n => n.trim().length > 0)
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المحتوى</h1>
          <p className="text-muted-foreground mt-1">
            مراجعة والموافقة على المحتوى المقدم من المساهمين
          </p>
        </div>
      </div>

      <div className="bg-card space-y-4 rounded-lg border p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="ابحث بالعنوان أو الوصف..."
              className="pr-10"
            />
            {searchInput && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-2 h-6 w-6 -translate-y-1/2"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button type="submit">بحث</Button>
        </form>

        <div className="flex flex-wrap gap-3">
          <Select
            value={statusFilter}
            onValueChange={value => updateFilters({ status: value })}
          >
            <SelectTrigger className="w-[180px]" dir="rtl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="PENDING">قيد المراجعة</SelectItem>
              <SelectItem value="APPROVED">موافق عليه</SelectItem>
              <SelectItem value="REJECTED">مرفوض</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={value => updateFilters({ type: value })}
          >
            <SelectTrigger className="w-[180px]" dir="rtl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="VIDEO">فيديو</SelectItem>
              <SelectItem value="FILE">ملف</SelectItem>
              <SelectItem value="QUIZ">اختبار</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={subjectFilter}
            onValueChange={value => updateFilters({ subject: value })}
          >
            <SelectTrigger className="w-[220px]" dir="rtl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواد</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={String(subject.id)}>
                  {subject.code} - {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(statusFilter !== "all" ||
            typeFilter !== "all" ||
            subjectFilter !== "all" ||
            searchInput) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput("");
                const params = new URLSearchParams();
                router.push(`/admin/content?${params.toString()}`);
              }}
            >
              إعادة تعيين
            </Button>
          )}
        </div>
      </div>

      {content.length === 0 ? (
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-12 text-center">
          <FileText className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="mb-2 text-lg font-semibold">لا يوجد محتوى</h3>
          <p className="text-muted-foreground">
            لا توجد محتويات تطابق الفلاتر المحددة
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المحتوى</TableHead>
                  <TableHead className="text-right">المساهم</TableHead>
                  <TableHead className="text-right">المادة والفصل</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإحصائيات</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map(item => {
                  const Icon = contentTypeIcons[item.contentType];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Icon className="text-muted-foreground mt-1 h-5 w-5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium">{item.title}</p>
                            {item.description && (
                              <p className="text-muted-foreground line-clamp-2 text-xs">
                                {item.description}
                              </p>
                            )}
                            {item.url && (
                              <Link
                                href={item.url}
                                target="_blank"
                                className="text-primary mt-1 block text-xs hover:underline"
                              >
                                عرض المحتوى ↗
                              </Link>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={item.contributor.image ?? undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(item.contributor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {item.contributor.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {item.contributor.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">
                            {item.chapter.subject.code}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {item.chapter.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {contentTypeLabels[item.contentType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "APPROVED"
                              ? "default"
                              : item.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {statusLabels[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground space-y-0.5 text-xs">
                          <div>{item._count.votes} تصويت</div>
                          <div>{item._count.comments} تعليق</div>
                          <div>{item._count.userProgress} مستخدم</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-xs">
                          {formatDate(item.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {item.status === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTargetContent(item);
                                  setApproveOpen(true);
                                }}
                                disabled={isPending}
                                className="gap-1"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                موافقة
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTargetContent(item);
                                  setRejectOpen(true);
                                }}
                                disabled={isPending}
                                className="gap-1"
                              >
                                <XCircle className="h-4 w-4" />
                                رفض
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTargetContent(item);
                              setDeleteOpen(true);
                            }}
                            disabled={isPending}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
                {Math.min(currentPage * itemsPerPage, total)} من أصل {total}{" "}
                محتوى
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isPending}
                  aria-label="الصفحة السابقة"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isPending}
                  aria-label="الصفحة التالية"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={approveOpen}
        onOpenChange={open => {
          setApproveOpen(open);
          if (!open) {
            setTargetContent(null);
            setModeratorNotes("");
          }
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>الموافقة على المحتوى</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من الموافقة على هذا المحتوى؟ سيظهر للمستخدمين ويحصل
              المساهم على 10 نقاط.
            </DialogDescription>
          </DialogHeader>
          {targetContent && (
            <div className="bg-muted space-y-2 rounded-lg p-3 text-sm">
              <p className="font-semibold">{targetContent.title}</p>
              <p className="text-muted-foreground text-xs">
                المساهم: {targetContent.contributor.name}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="approve-notes">ملاحظات المشرف (اختيارية)</Label>
            <Textarea
              id="approve-notes"
              value={moderatorNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setModeratorNotes(e.target.value)
              }
              placeholder="أضف ملاحظات للمساهم..."
              rows={3}
              disabled={isPending}
            />
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button type="button" onClick={handleApprove} disabled={isPending}>
              {isPending ? "جارٍ الموافقة..." : "موافقة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectOpen}
        onOpenChange={open => {
          setRejectOpen(open);
          if (!open) {
            setTargetContent(null);
            setRejectionReason("");
            setModeratorNotes("");
          }
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض المحتوى</DialogTitle>
            <DialogDescription>
              يرجى تقديم سبب واضح للرفض ليتمكن المساهم من تحسين محتواه.
            </DialogDescription>
          </DialogHeader>
          {targetContent && (
            <div className="bg-muted space-y-2 rounded-lg p-3 text-sm">
              <p className="font-semibold">{targetContent.title}</p>
              <p className="text-muted-foreground text-xs">
                المساهم: {targetContent.contributor.name}
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                سبب الرفض <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRejectionReason(e.target.value)
                }
                placeholder="مثال: المحتوى غير واضح أو يحتوي على أخطاء..."
                rows={3}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reject-notes">ملاحظات إضافية (اختيارية)</Label>
              <Textarea
                id="reject-notes"
                value={moderatorNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setModeratorNotes(e.target.value)
                }
                placeholder="ملاحظات للمساهم..."
                rows={2}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || !rejectionReason.trim()}
            >
              {isPending ? "جارٍ الرفض..." : "رفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={open => {
          setDeleteOpen(open);
          if (!open) setTargetContent(null);
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المحتوى</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المحتوى؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {targetContent && (
            <div className="bg-muted space-y-2 rounded-lg p-3 text-sm">
              <p className="font-semibold">{targetContent.title}</p>
              <p className="text-muted-foreground text-xs">
                المساهم: {targetContent.contributor.name}
              </p>
            </div>
          )}
          <AlertDialogFooter className="flex items-center justify-end gap-2">
            <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className={cn("bg-destructive hover:bg-destructive/90")}
            >
              {isPending ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
