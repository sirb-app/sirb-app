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
import { Card, CardTitle } from "@/components/ui/card";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type ContentWithRelations = Prisma.CanvasGetPayload<{
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
        sequence: true;
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
    contentBlocks: {
      select: {
        contentType: true;
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
  universities: Array<{ id: number; name: string }>;
}

const statusLabels = {
  PENDING: "قيد المراجعة",
  APPROVED: "موافق عليه",
  REJECTED: "مرفوض",
};

const contentTypeIcons = {
  VIDEO: Video,
  FILE: FileText,
  QUIZ: FileText,
};

const contentTypeLabels: Record<keyof typeof contentTypeIcons, string> = {
  VIDEO: "فيديو",
  FILE: "ملف",
  QUIZ: "اختبار",
};

const statusFilters = [
  { value: "PENDING", label: "قيد المراجعة" },
  { value: "APPROVED", label: "مقبول" },
  { value: "REJECTED", label: "مرفوض" },
  { value: "ALL", label: "جميع الحالات" },
];

const typeFilters = [
  { value: "ALL", label: "كل الأنواع" },
  { value: "VIDEO", label: "فيديو" },
  { value: "FILE", label: "ملف" },
  { value: "QUIZ", label: "اختبار" },
];

export function ContentManager({
  content,
  total,
  currentPage,
  universities,
}: ContentManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetContent, setTargetContent] =
    useState<ContentWithRelations | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  const [moderatorNotes, setModeratorNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? ""
  );

  const statusFilter = (searchParams.get("status") ?? "PENDING").toUpperCase();
  const typeFilter = (searchParams.get("type") ?? "ALL").toUpperCase();
  const universityFilter = searchParams.get("university") ?? "ALL";
  const itemsPerPage = 20;
  const totalPages = Math.ceil(total / itemsPerPage);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (key === "status") {
        const normalized = value.toUpperCase();
        if (normalized === "PENDING" || !normalized) {
          params.delete(key);
        } else {
          params.set(key, normalized);
        }
        return;
      }

      if (key === "type") {
        const normalized = value.toUpperCase();
        if (normalized === "ALL" || !normalized) {
          params.delete(key);
        } else {
          params.set(key, normalized);
        }
        return;
      }

      if (key === "university") {
        if (!value || value === "ALL") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
        return;
      }

      const trimmed = value.trim();
      if (!trimmed) {
        params.delete(key);
      } else {
        params.set(key, trimmed);
      }
    });
    params.delete("page");
    router.push(`/admin/content?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
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

  const subjectGroups = useMemo(() => {
    return Object.values(
      content.reduce(
        (acc, item) => {
          const subject = item.chapter.subject;
          const subjectId = subject.id;

          if (!acc[subjectId]) {
            acc[subjectId] = {
              id: subjectId,
              subjectName: subject.name,
              subjectCode: subject.code,
              collegeName: subject.college.name,
              universityName: subject.college.university.name,
              items: [],
            };
          }

          acc[subjectId].items.push(item);
          return acc;
        },
        {} as Record<
          number,
          {
            id: number;
            subjectName: string;
            subjectCode: string;
            collegeName: string;
            universityName: string;
            items: ContentWithRelations[];
          }
        >
      )
    ).sort((a, b) => {
      if (a.universityName === b.universityName) {
        if (a.collegeName === b.collegeName) {
          return a.subjectName.localeCompare(b.subjectName, "ar");
        }
        return a.collegeName.localeCompare(b.collegeName, "ar");
      }
      return a.universityName.localeCompare(b.universityName, "ar");
    });
  }, [content]);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">طلبات المحتوى</h1>
          <p className="text-muted-foreground">
            مراجعة والموافقة على طلبات المحتوى الجديدة
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="ابحث بالعنوان أو الوصف أو اسم المساهم..."
              className="pr-10"
            />
            {searchInput && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-2 h-6 w-6 -translate-y-1/2"
                onClick={clearSearch}
                aria-label="مسح البحث"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>

          {(searchInput ||
            typeFilter !== "ALL" ||
            statusFilter !== "PENDING" ||
            universityFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchInput("");
                const params = new URLSearchParams();
                params.set("status", "PENDING");
                router.push(`/admin/content?${params.toString()}`);
              }}
            >
              <X className="ml-1 h-4 w-4" />
              إعادة تعيين
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map(option => (
            <Button
              key={option.value}
              type="button"
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              className="rounded-full px-4"
              onClick={() => updateFilters({ status: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {typeFilters.map(option => (
              <Button
                key={option.value}
                type="button"
                variant={typeFilter === option.value ? "secondary" : "ghost"}
                size="sm"
                className="rounded-full border"
                onClick={() => updateFilters({ type: option.value })}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Label
              className="text-muted-foreground text-xs"
              htmlFor="university-filter"
            >
              الجامعة
            </Label>
            <Select
              value={universityFilter}
              onValueChange={value => updateFilters({ university: value })}
            >
              <SelectTrigger id="university-filter" className="w-56">
                <SelectValue placeholder="جميع الجامعات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">جميع الجامعات</SelectItem>
                {universities.map(university => (
                  <SelectItem
                    key={university.id}
                    value={university.id.toString()}
                  >
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {content.length === 0 ? (
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-12 text-center">
          <FileText className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="mb-2 text-lg font-semibold">لا توجد طلبات</h3>
          <p className="text-muted-foreground">
            لا توجد طلبات محتوى تطابق الفلاتر المحددة
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {subjectGroups.map(group => {
              const latestSubmission = group.items.reduce(
                (latest, current) =>
                  current.createdAt > latest ? current.createdAt : latest,
                group.items[0].createdAt
              );
              return (
                <section
                  key={group.id}
                  className="bg-card/40 rounded-xl border p-3 shadow-sm"
                >
                  <div className="flex flex-col gap-2 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[11px]">
                          {group.subjectCode}
                        </Badge>
                        <h2 className="text-lg font-semibold">
                          {group.subjectName}
                        </h2>
                        <Badge variant="secondary" className="text-[11px]">
                          {group.items.length} طلب
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {group.universityName} • {group.collegeName}
                      </p>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      آخر تقديم: {formatDate(latestSubmission)}
                    </div>
                  </div>

                  <div className="grid gap-2 pt-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {group.items.map(item => {
                      const primaryType =
                        item.contentBlocks[0]?.contentType || "FILE";
                      const Icon =
                        contentTypeIcons[
                          primaryType as keyof typeof contentTypeIcons
                        ] || FileText;
                      const typeLabel =
                        contentTypeLabels[
                          primaryType as keyof typeof contentTypeLabels
                        ] || "ملف";
                      const isExpanded = expandedCardId === item.id;
                      const showEngagement = item.status !== "PENDING";
                      const chapterSequenceLabel = `الفصل ${item.chapter.sequence}`;
                      const cleanChapterTitle = item.chapter.title?.trim();
                      const showChapterTitle =
                        !!cleanChapterTitle &&
                        !cleanChapterTitle
                          .replace(/\s+/g, " ")
                          .toLowerCase()
                          .startsWith(chapterSequenceLabel.toLowerCase());

                      return (
                        <Card
                          key={item.id}
                          className="bg-background flex h-full flex-col border"
                        >
                          <div className="space-y-3 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-muted-foreground bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]">
                                    <Icon className="h-3.5 w-3.5" />
                                    {typeLabel}
                                  </span>
                                  <Badge
                                    variant={
                                      item.status === "APPROVED"
                                        ? "default"
                                        : item.status === "PENDING"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                    className="text-[10px]"
                                  >
                                    {statusLabels[item.status]}
                                  </Badge>
                                </div>
                                <CardTitle className="line-clamp-2 text-base">
                                  {item.title}
                                </CardTitle>
                              </div>
                            </div>

                            {item.description ? (
                              <div className="bg-muted/40 rounded-md px-3 py-2">
                                <p
                                  className={cn(
                                    "text-xs leading-relaxed",
                                    isExpanded ? "" : "line-clamp-2"
                                  )}
                                >
                                  {item.description}
                                </p>
                                {item.description.length > 140 && (
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="px-0 text-[11px]"
                                    onClick={() =>
                                      setExpandedCardId(
                                        isExpanded ? null : item.id
                                      )
                                    }
                                  >
                                    {isExpanded ? "إخفاء" : "عرض المزيد"}
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-xs">
                                لا يوجد وصف مضاف
                              </p>
                            )}

                            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[11px]">
                              <Badge variant="outline" className="text-[10px]">
                                {chapterSequenceLabel}
                              </Badge>
                              {showChapterTitle && (
                                <span className="truncate">
                                  {cleanChapterTitle}
                                </span>
                              )}
                              <span>•</span>
                              <span>{formatDate(item.createdAt)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={item.contributor.image ?? undefined}
                                />
                                <AvatarFallback>
                                  {getUserInitials(item.contributor.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {item.contributor.name}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">
                                  {item.contributor.email}
                                </p>
                              </div>
                            </div>

                            {showEngagement && (
                              <div className="text-muted-foreground flex flex-wrap gap-1.5 text-[10px]">
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {item._count.votes} تفاعل
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {item._count.comments} تعليق
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {item._count.userProgress} متابعة
                                </Badge>
                              </div>
                            )}

                            <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                              {item.status === "PENDING" ? (
                                <>
                                  <Button
                                    variant="default"
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setTargetContent(item);
                                      setDeleteOpen(true);
                                    }}
                                    disabled={isPending}
                                    className="text-destructive gap-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    حذف
                                  </Button>
                                </>
                              ) : (
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
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
                {Math.min(currentPage * itemsPerPage, total)} من أصل {total} طلب
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
