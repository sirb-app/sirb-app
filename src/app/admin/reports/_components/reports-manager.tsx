"use client";

import type { ReportWithRelations } from "@/actions/admin-report.actions";
import {
  resolveReportWithAction,
  updateReportStatus,
} from "@/actions/admin-report.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ReportReason, ReportStatus } from "@/generated/prisma";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  MessageSquare,
  MoreHorizontal,
  Shield,
  User,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const statusFilters = [
  { value: "PENDING", label: "قيد الانتظار" },
  { value: "RESOLVED", label: "تم الحل" },
  { value: "DISMISSED", label: "تم التجاهل" },
  { value: "all", label: "جميع الحالات" },
];

const typeFilters = [
  { value: "all", label: "جميع الأنواع" },
  { value: "canvas", label: "دروس" },
  { value: "comment", label: "تعليقات" },
  { value: "user", label: "مستخدمين" },
  { value: "quiz", label: "اختبارات" },
  { value: "quizComment", label: "تعليقات الاختبارات" },
];

const reasonFilters = [
  { value: "all", label: "جميع الأسباب" },
  { value: "SPAM", label: "محتوى مزعج" },
  { value: "INAPPROPRIATE", label: "محتوى غير لائق" },
  { value: "WRONG_INFO", label: "معلومات خاطئة" },
  { value: "HARASSMENT", label: "تحرش أو إساءة" },
  { value: "COPYRIGHT", label: "انتهاك حقوق ملكية" },
  { value: "OTHER", label: "أخرى" },
];

interface ReportsManagerProps {
  reports: ReportWithRelations[];
  total: number;
  currentPage: number;
  availableUniversities: Array<{ id: number; name: string; code: string }>;
  availableSubjects: Array<{ id: number; name: string; code: string }>;
}

export function ReportsManager({
  reports,
  total,
  currentPage,
  availableUniversities,
  availableSubjects,
}: ReportsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") === "all"
      ? "all"
      : searchParams.get("status") || "PENDING"
  );
  const [reasonFilter, setReasonFilter] = useState<string>(
    searchParams.get("reason") || "all"
  );
  const [typeFilter, setTypeFilter] = useState<string>(
    searchParams.get("type") || "all"
  );
  const [universityFilter, setUniversityFilter] = useState<string>(
    searchParams.get("university") || "all"
  );
  const [subjectFilter, setSubjectFilter] = useState<string>(
    searchParams.get("subject") || "all"
  );

  const [selectedReport, setSelectedReport] =
    useState<ReportWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | null>(
    null
  );
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [deleteContent, setDeleteContent] = useState(false);
  const [banUser, setBanUser] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<string>("7");

  const totalPages = Math.ceil(total / 10);

  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === "status" && value === "all") {
        params.set(key, value);
      } else if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.set("page", "1");
      router.push(`/admin/reports?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`/admin/reports?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      setStatusFilter("PENDING");
      setReasonFilter("all");
      setTypeFilter("all");
      setUniversityFilter("all");
      setSubjectFilter("all");
      router.push("/admin/reports");
    });
  };

  const openDetails = (report: ReportWithRelations) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const openAction = (
    type: "resolve" | "dismiss",
    report: ReportWithRelations
  ) => {
    setActionType(type);
    setSelectedReport(report);
    setResolutionNotes("");
  };

  const closeAction = () => {
    setActionType(null);
    if (!detailsOpen) {
      setSelectedReport(null);
    }
    setResolutionNotes("");
    setDeleteContent(false);
    setBanUser(false);
    setBanReason("");
    setBanDuration("7");
  };

  const handleAction = () => {
    if (!selectedReport || !actionType) return;

    startTransition(async () => {
      try {
        if (actionType === "resolve") {
          await resolveReportWithAction(selectedReport.id, {
            deleteContent,
            banUser,
            banReason: banReason.trim() || undefined,
            banDuration:
              banUser && banDuration ? parseInt(banDuration) : undefined,
            resolutionNotes: resolutionNotes.trim() || undefined,
          });
        } else {
          await updateReportStatus(
            selectedReport.id,
            "DISMISSED",
            resolutionNotes.trim() || undefined
          );
        }

        toast.success(
          actionType === "resolve"
            ? "تم حل البلاغ بنجاح"
            : "تم تجاهل البلاغ بنجاح"
        );
        closeAction();
        setDetailsOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحديث حالة البلاغ"
        );
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  const getReasonLabel = (reason: ReportReason) => {
    const labels: Record<ReportReason, string> = {
      SPAM: "محتوى مزعج",
      INAPPROPRIATE: "محتوى غير لائق",
      WRONG_INFO: "معلومات خاطئة",
      HARASSMENT: "تحرش أو إساءة",
      COPYRIGHT: "انتهاك حقوق ملكية",
      OTHER: "أخرى",
    };
    return labels[reason];
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            قيد الانتظار
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge
            variant="default"
            className="gap-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-3 w-3" />
            تم الحل
          </Badge>
        );
      case "DISMISSED":
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            تم التجاهل
          </Badge>
        );
    }
  };

  const getTypeBadge = (report: ReportWithRelations) => {
    if (report.reportedCanvas) {
      return (
        <Badge variant="default" className="gap-1 bg-blue-600">
          <FileText className="h-3 w-3" />
          درس
        </Badge>
      );
    }
    if (report.reportedComment) {
      return (
        <Badge variant="default" className="gap-1 bg-purple-600">
          <MessageSquare className="h-3 w-3" />
          تعليق
        </Badge>
      );
    }
    if (report.reportedUser) {
      return (
        <Badge variant="default" className="gap-1 bg-orange-600">
          <User className="h-3 w-3" />
          مستخدم
        </Badge>
      );
    }
    if (report.reportedQuiz) {
      return (
        <Badge variant="default" className="gap-1 bg-emerald-600">
          <FileText className="h-3 w-3" />
          اختبار
        </Badge>
      );
    }
    if (report.reportedQuizComment) {
      return (
        <Badge variant="default" className="gap-1 bg-teal-600">
          <MessageSquare className="h-3 w-3" />
          تعليق اختبار
        </Badge>
      );
    }
    return null;
  };

  const getSubjectInfo = (report: ReportWithRelations) => {
    const subject =
      report.reportedCanvas?.chapter.subject ||
      report.reportedComment?.canvas?.chapter.subject ||
      report.reportedQuiz?.chapter.subject ||
      report.reportedQuizComment?.quiz?.chapter.subject;
    if (!subject) return null;
    return {
      subject: { id: subject.id, name: subject.name, code: subject.code },
      university: subject.college?.university ?? null,
    };
  };

  const hasActiveFilters =
    (statusFilter !== "all" && statusFilter !== "PENDING") ||
    reasonFilter !== "all" ||
    typeFilter !== "all" ||
    universityFilter !== "all" ||
    subjectFilter !== "all";

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة البلاغات</h1>
          <p className="text-muted-foreground mt-2">
            {total.toLocaleString("ar-SA-u-nu-latn")} بلاغ إجمالاً
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map(option => (
            <Button
              key={option.value}
              type="button"
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              className="rounded-full px-4"
              disabled={isPending}
              onClick={() => {
                setStatusFilter(option.value);
                handleFilterChange("status", option.value);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {typeFilters.map(option => (
            <Button
              key={option.value}
              type="button"
              variant={typeFilter === option.value ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full border"
              disabled={isPending}
              onClick={() => {
                setTypeFilter(option.value);
                handleFilterChange("type", option.value);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {reasonFilters.map(option => (
              <Button
                key={option.value}
                type="button"
                variant={reasonFilter === option.value ? "secondary" : "ghost"}
                size="sm"
                className="rounded-full border"
                disabled={isPending}
                onClick={() => {
                  setReasonFilter(option.value);
                  handleFilterChange("reason", option.value);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {availableUniversities.length > 0 && (
            <div className="flex items-center gap-2">
              <Label
                className="text-muted-foreground text-xs"
                htmlFor="university-filter"
              >
                الجامعة
              </Label>
              <Select
                value={universityFilter}
                disabled={isPending}
                onValueChange={val => {
                  startTransition(() => {
                    setUniversityFilter(val);
                    setSubjectFilter("all");
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("subject");
                    if (val === "all") {
                      params.delete("university");
                    } else {
                      params.set("university", val);
                    }
                    params.set("page", "1");
                    router.push(`/admin/reports?${params.toString()}`);
                  });
                }}
              >
                <SelectTrigger id="university-filter" className="w-56">
                  <SelectValue placeholder="جميع الجامعات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الجامعات</SelectItem>
                  {availableUniversities.map(university => (
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
          )}

          {availableSubjects.length > 0 && universityFilter !== "all" && (
            <div className="flex items-center gap-2">
              <Label
                className="text-muted-foreground text-xs"
                htmlFor="subject-filter"
              >
                المادة
              </Label>
              <Select
                value={subjectFilter}
                disabled={isPending}
                onValueChange={val => {
                  setSubjectFilter(val);
                  handleFilterChange("subject", val);
                }}
              >
                <SelectTrigger id="subject-filter" className="w-56">
                  <SelectValue placeholder="جميع المواد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المواد</SelectItem>
                  {availableSubjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              الفلاتر النشطة:{" "}
              {
                [
                  statusFilter !== "PENDING" ? statusFilter : null,
                  reasonFilter,
                  typeFilter,
                  universityFilter,
                  subjectFilter,
                ].filter(f => f !== "all" && f !== null).length
              }
            </p>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
              disabled={isPending}
            >
              <X className="ml-2 h-4 w-4" />
              مسح جميع الفلاتر
            </Button>
          </div>
        )}
      </div>

      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="text-muted-foreground mb-4 h-16 w-16" />
            <h3 className="mb-2 text-lg font-semibold">لا توجد بلاغات</h3>
            <p className="text-muted-foreground text-center">
              {hasActiveFilters
                ? "لم يتم العثور على نتائج. جرب تغيير الفلاتر."
                : "لا توجد بلاغات في النظام."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden rounded-lg border shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right">المُبلِّغ</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">المحتوى</TableHead>
                  <TableHead className="text-right">الجامعة والمادة</TableHead>
                  <TableHead className="text-right">السبب</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(report => {
                  const subjectInfo = getSubjectInfo(report);
                  return (
                    <TableRow
                      key={report.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => openDetails(report)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={report.reporter.image ?? undefined}
                            />
                            <AvatarFallback className="text-xs uppercase">
                              {report.reporter.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 text-sm">
                            <p className="truncate font-medium">
                              {report.reporter.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {report.reporter.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(report)}</TableCell>
                      <TableCell className="max-w-[200px]">
                        {report.reportedCanvas && (
                          <div className="flex flex-col gap-1">
                            <span className="truncate font-medium">
                              {report.reportedCanvas.title}
                            </span>
                            <span className="text-muted-foreground truncate text-xs">
                              {report.reportedCanvas.chapter.title}
                            </span>
                          </div>
                        )}
                        {report.reportedComment && (
                          <div className="flex flex-col gap-1">
                            <span className="line-clamp-2 text-sm">
                              {report.reportedComment.text}
                            </span>
                            {report.reportedComment.canvas && (
                              <span className="text-muted-foreground truncate text-xs">
                                في: {report.reportedComment.canvas.title}
                              </span>
                            )}
                          </div>
                        )}
                        {report.reportedUser && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {report.reportedUser.name}
                            </span>
                          </div>
                        )}
                        {report.reportedQuiz && (
                          <div className="flex flex-col gap-1">
                            <span className="truncate font-medium">
                              {report.reportedQuiz.title}
                            </span>
                            <span className="text-muted-foreground truncate text-xs">
                              {report.reportedQuiz.chapter.title}
                            </span>
                          </div>
                        )}
                        {report.reportedQuizComment && (
                          <div className="flex flex-col gap-1">
                            <span className="line-clamp-2 text-sm">
                              {report.reportedQuizComment.text}
                            </span>
                            {report.reportedQuizComment.quiz && (
                              <span className="text-muted-foreground truncate text-xs">
                                في: {report.reportedQuizComment.quiz.title}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {subjectInfo ? (
                          <div className="flex items-center gap-2">
                            {subjectInfo.university?.imageUrl ? (
                              <img
                                src={subjectInfo.university.imageUrl}
                                alt="University logo"
                                className="h-6 w-6 rounded-full border object-contain"
                              />
                            ) : (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>U</AvatarFallback>
                              </Avatar>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {subjectInfo.subject.code}
                              </p>
                              <p className="text-muted-foreground truncate text-xs">
                                {subjectInfo.subject.name}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {getReasonLabel(report.reason)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(report.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          {report.status === "PENDING" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openAction("resolve", report)}
                                className="text-green-600 hover:bg-green-50 hover:text-green-700"
                                title="حل البلاغ"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openAction("dismiss", report)}
                                className="text-muted-foreground hover:bg-muted"
                                title="تجاهل البلاغ"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetails(report)}
                            >
                              التفاصيل
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            {reports.map(report => {
              const subjectInfo = getSubjectInfo(report);
              return (
                <Card key={report.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={report.reporter.image ?? undefined}
                          />
                          <AvatarFallback className="text-xs uppercase">
                            {report.reporter.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {report.reporter.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatDate(report.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(report.status)}
                        {getTypeBadge(report)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-3 text-sm">
                    {subjectInfo && (
                      <div className="bg-muted/50 flex items-center gap-2 rounded-md p-2.5">
                        {subjectInfo.university?.imageUrl ? (
                          <img
                            src={subjectInfo.university.imageUrl}
                            alt="University logo"
                            className="h-6 w-6 rounded-full border object-cover"
                          />
                        ) : (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {subjectInfo.subject.code} -{" "}
                            {subjectInfo.subject.name}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-muted-foreground h-4 w-4 shrink-0" />
                      <span className="text-foreground font-medium">
                        السبب:
                      </span>
                      <span>{getReasonLabel(report.reason)}</span>
                    </div>

                    <div className="bg-muted/50 rounded-md p-3">
                      <div className="text-muted-foreground mb-2 text-xs font-medium">
                        المحتوى المُبلَّغ عنه:
                      </div>
                      {report.reportedCanvas && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="font-medium">
                              {report.reportedCanvas.title}
                            </span>
                          </div>
                          <p className="text-muted-foreground pr-6 text-xs">
                            {report.reportedCanvas.chapter.title}
                          </p>
                        </div>
                      )}
                      {report.reportedComment && (
                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="line-clamp-2">
                              {report.reportedComment.text}
                            </span>
                          </div>
                          {report.reportedComment.canvas && (
                            <p className="text-muted-foreground pr-6 text-xs">
                              في: {report.reportedComment.canvas.title}
                            </p>
                          )}
                        </div>
                      )}
                      {report.reportedUser && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 shrink-0" />
                          <span className="font-medium">
                            {report.reportedUser.name}
                          </span>
                        </div>
                      )}
                      {report.reportedQuiz && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="font-medium">
                              {report.reportedQuiz.title}
                            </span>
                          </div>
                          <p className="text-muted-foreground pr-6 text-xs">
                            {report.reportedQuiz.chapter.title}
                          </p>
                        </div>
                      )}
                      {report.reportedQuizComment && (
                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="line-clamp-2">
                              {report.reportedQuizComment.text}
                            </span>
                          </div>
                          {report.reportedQuizComment.quiz && (
                            <p className="text-muted-foreground pr-6 text-xs">
                              في: {report.reportedQuizComment.quiz.title}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/20 flex justify-end gap-2 p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetails(report)}
                    >
                      التفاصيل
                    </Button>
                    {report.status === "PENDING" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="default" size="sm">
                            إجراءات <MoreHorizontal className="mr-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openAction("resolve", report)}
                            className="text-green-600"
                          >
                            <CheckCircle className="ml-2 h-4 w-4" />
                            حل البلاغ
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openAction("dismiss", report)}
                          >
                            <XCircle className="ml-2 h-4 w-4" />
                            تجاهل البلاغ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <p className="text-muted-foreground text-sm">
                  صفحة {currentPage.toLocaleString("ar-SA-u-nu-latn")} من{" "}
                  {totalPages.toLocaleString("ar-SA-u-nu-latn")}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side="left"
          className="w-full overflow-y-auto p-6 sm:max-w-2xl"
          dir="rtl"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              تفاصيل البلاغ
            </SheetTitle>
            <SheetDescription>
              رقم البلاغ #{selectedReport?.id}
            </SheetDescription>
          </SheetHeader>

          {selectedReport && (
            <div className="space-y-6">
              <div className="bg-muted/30 flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">
                    الحالة الحالية
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedReport.status)}
                    {getTypeBadge(selectedReport)}
                  </div>
                </div>
                <div className="space-y-1 text-left">
                  <div className="text-muted-foreground text-sm">
                    تاريخ البلاغ
                  </div>
                  <div className="text-sm font-medium">
                    {formatDate(selectedReport.createdAt)}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4" />
                  معلومات المُبلِّغ
                </h3>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={selectedReport.reporter.image ?? undefined}
                      />
                      <AvatarFallback className="text-xs uppercase">
                        {selectedReport.reporter.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {selectedReport.reporter.name}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {selectedReport.reporter.email}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  سبب البلاغ
                </h3>
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <span className="text-muted-foreground mb-1.5 block text-sm">
                        السبب الرئيسي
                      </span>
                      <Badge variant="outline" className="text-base">
                        {getReasonLabel(selectedReport.reason)}
                      </Badge>
                    </div>
                    {selectedReport.description && (
                      <div>
                        <span className="text-muted-foreground mb-1.5 block text-sm">
                          التفاصيل الإضافية
                        </span>
                        <p className="bg-muted/50 rounded-md p-3 text-sm leading-relaxed">
                          {selectedReport.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <FileText className="h-4 w-4" />
                  المحتوى المُبلَّغ عنه
                </h3>
                <Card>
                  <CardContent className="p-4">
                    {selectedReport.reportedCanvas && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {getTypeBadge(selectedReport)}
                          <h4 className="text-lg font-semibold">
                            {selectedReport.reportedCanvas.title}
                          </h4>
                          {selectedReport.reportedCanvas.description && (
                            <p className="text-muted-foreground text-sm">
                              {selectedReport.reportedCanvas.description}
                            </p>
                          )}
                        </div>

                        <div className="bg-muted/50 space-y-2 rounded-lg p-3">
                          {selectedReport.reportedCanvas.chapter.subject.college
                            ?.university && (
                            <div className="flex items-center gap-2 text-sm">
                              <GraduationCap className="text-muted-foreground h-4 w-4" />
                              <span className="text-muted-foreground">
                                الجامعة:
                              </span>
                              <span className="font-medium">
                                {
                                  selectedReport.reportedCanvas.chapter.subject
                                    .college.university.name
                                }
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <BookOpen className="text-muted-foreground h-4 w-4" />
                            <span className="text-muted-foreground">
                              المادة:
                            </span>
                            <span className="font-medium">
                              {
                                selectedReport.reportedCanvas.chapter.subject
                                  .name
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="text-muted-foreground h-4 w-4" />
                            <span className="text-muted-foreground">
                              الفصل:
                            </span>
                            <span className="font-medium">
                              {selectedReport.reportedCanvas.chapter.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="text-muted-foreground h-4 w-4" />
                            <span className="text-muted-foreground">
                              المساهم:
                            </span>
                            <span className="font-medium">
                              {selectedReport.reportedCanvas.contributor.name}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <Link
                            href={`/subjects/${selectedReport.reportedCanvas.chapter.subjectId}/chapters/${selectedReport.reportedCanvas.chapter.id}/canvases/${selectedReport.reportedCanvas.id}`}
                            target="_blank"
                          >
                            عرض الدرس <ExternalLink className="mr-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    )}

                    {selectedReport.reportedComment && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {getTypeBadge(selectedReport)}
                          <div className="bg-muted/50 rounded-lg p-4">
                            <MessageSquare className="text-muted-foreground mb-2 h-5 w-5" />
                            <p className="leading-relaxed">
                              {selectedReport.reportedComment.text}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="text-muted-foreground h-4 w-4" />
                            <span className="text-muted-foreground">
                              بواسطة:
                            </span>
                            <span className="font-medium">
                              {selectedReport.reportedComment.user.name}
                            </span>
                          </div>
                        </div>

                        {selectedReport.reportedComment.canvas && (
                          <>
                            <div className="bg-muted/50 space-y-2 rounded-lg p-3">
                              {selectedReport.reportedComment.canvas.chapter
                                .subject.college?.university && (
                                <div className="flex items-center gap-2 text-sm">
                                  <GraduationCap className="text-muted-foreground h-4 w-4" />
                                  <span className="text-muted-foreground">
                                    الجامعة:
                                  </span>
                                  <span className="font-medium">
                                    {
                                      selectedReport.reportedComment.canvas
                                        .chapter.subject.college.university.name
                                    }
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm">
                                <BookOpen className="text-muted-foreground h-4 w-4" />
                                <span className="text-muted-foreground">
                                  المادة:
                                </span>
                                <span className="font-medium">
                                  {
                                    selectedReport.reportedComment.canvas
                                      .chapter.subject.name
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="text-muted-foreground h-4 w-4" />
                                <span className="text-muted-foreground">
                                  الدرس:
                                </span>
                                <span className="font-medium">
                                  {selectedReport.reportedComment.canvas.title}
                                </span>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              asChild
                            >
                              <Link
                                href={`/subjects/${selectedReport.reportedComment.canvas.chapter.subjectId}/chapters/${selectedReport.reportedComment.canvas.chapter.id}/canvases/${selectedReport.reportedComment.canvas.id}`}
                                target="_blank"
                              >
                                عرض سياق التعليق{" "}
                                <ExternalLink className="mr-2 h-4 w-4" />
                              </Link>
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {selectedReport.reportedUser && (
                      <div className="space-y-4">
                        {getTypeBadge(selectedReport)}
                        <div className="flex items-center gap-4 rounded-lg border p-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage
                              src={
                                selectedReport.reportedUser.image ?? undefined
                              }
                            />
                            <AvatarFallback className="text-xs uppercase">
                              {selectedReport.reportedUser.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">
                              {selectedReport.reportedUser.name}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {selectedReport.reportedUser.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <Link
                            href={`/admin/users?search=${selectedReport.reportedUser.email}`}
                          >
                            إدارة المستخدم{" "}
                            <ExternalLink className="mr-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {selectedReport.status !== "PENDING" && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <Shield className="h-4 w-4" />
                    تفاصيل الحل
                  </h3>
                  <Card className="bg-muted/30">
                    <CardContent className="space-y-3 p-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-muted-foreground mb-1 block text-xs">
                            تم الحل بواسطة
                          </span>
                          <span className="font-medium">
                            {selectedReport.resolver?.name || "غير معروف"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground mb-1 block text-xs">
                            تاريخ الحل
                          </span>
                          <span>
                            {selectedReport.resolvedAt
                              ? formatDate(selectedReport.resolvedAt)
                              : "-"}
                          </span>
                        </div>
                      </div>
                      {selectedReport.resolutionNotes && (
                        <div>
                          <span className="text-muted-foreground mb-1.5 block text-xs">
                            ملاحظات الحل
                          </span>
                          <p className="bg-background rounded-lg border p-3 leading-relaxed">
                            {selectedReport.resolutionNotes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedReport.status === "PENDING" && (
                <div className="flex gap-3 border-t pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => openAction("resolve", selectedReport)}
                  >
                    <CheckCircle className="ml-2 h-4 w-4" />
                    حل البلاغ
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => openAction("dismiss", selectedReport)}
                  >
                    <XCircle className="ml-2 h-4 w-4" />
                    تجاهل البلاغ
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!actionType} onOpenChange={open => !open && closeAction()}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "resolve" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  حل البلاغ
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  تجاهل البلاغ
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionType === "resolve" && selectedReport && (
              <>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  اختر الإجراءات المناسبة لحل هذا البلاغ:
                </p>

                {(selectedReport.reportedCanvasId ||
                  selectedReport.reportedCommentId) && (
                  <div
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                      deleteContent
                        ? "border-red-500 bg-red-50 shadow-sm dark:bg-red-950/30"
                        : "hover:bg-muted/50 hover:border-muted-foreground/20"
                    }`}
                    onClick={() => setDeleteContent(!deleteContent)}
                  >
                    <input
                      type="checkbox"
                      id="delete-content"
                      checked={deleteContent}
                      onChange={e => setDeleteContent(e.target.checked)}
                      className="mt-1 h-4 w-4 cursor-pointer accent-red-600"
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor="delete-content"
                        className={`cursor-pointer font-medium ${
                          deleteContent ? "text-red-700 dark:text-red-400" : ""
                        }`}
                      >
                        حذف المحتوى المُبلَّغ عنه
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        {selectedReport.reportedCanvasId
                          ? "سيتم حذف الدرس نهائياً من النظام"
                          : "سيتم حذف التعليق نهائياً"}
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`space-y-3 rounded-lg border p-3 transition-all ${
                    banUser
                      ? "border-orange-500 bg-orange-50 shadow-sm dark:bg-orange-950/30"
                      : "hover:border-muted-foreground/20"
                  }`}
                >
                  <div
                    className="flex cursor-pointer items-start gap-3"
                    onClick={() => setBanUser(!banUser)}
                  >
                    <input
                      type="checkbox"
                      id="ban-user"
                      checked={banUser}
                      onChange={e => setBanUser(e.target.checked)}
                      className="mt-1 h-4 w-4 cursor-pointer accent-orange-600"
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor="ban-user"
                        className={`cursor-pointer font-medium ${
                          banUser ? "text-orange-700 dark:text-orange-400" : ""
                        }`}
                      >
                        حظر المستخدم
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        {selectedReport.reportedUserId
                          ? "حظر المستخدم المُبلَّغ عنه"
                          : selectedReport.reportedCanvasId
                            ? "حظر المساهم الذي أنشأ الدرس"
                            : "حظر صاحب التعليق"}
                      </p>
                    </div>
                  </div>

                  {banUser && (
                    <div className="space-y-3 pr-9">
                      <div className="space-y-2">
                        <Label htmlFor="ban-reason" className="text-sm">
                          سبب الحظر
                        </Label>
                        <Textarea
                          id="ban-reason"
                          value={banReason}
                          onChange={e => setBanReason(e.target.value)}
                          rows={2}
                          placeholder="اذكر سبب الحظر..."
                          className="resize-none text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ban-duration" className="text-sm">
                          مدة الحظر
                        </Label>
                        <Select
                          value={banDuration}
                          onValueChange={setBanDuration}
                        >
                          <SelectTrigger id="ban-duration">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">يوم واحد</SelectItem>
                            <SelectItem value="3">3 أيام</SelectItem>
                            <SelectItem value="7">7 أيام</SelectItem>
                            <SelectItem value="14">14 يوم</SelectItem>
                            <SelectItem value="30">30 يوم</SelectItem>
                            <SelectItem value="0">دائم</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {actionType === "dismiss" && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                سيتم وضع علامة على هذا البلاغ كـ &quot;تم التجاهل&quot; بدون اتخاذ أي
                إجراء.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="resolution-notes">
                ملاحظات {actionType === "dismiss" ? "" : "(اختياري)"}
              </Label>
              <Textarea
                id="resolution-notes"
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                disabled={isPending}
                rows={3}
                placeholder="أضف ملاحظات توضيحية..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeAction}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant={actionType === "resolve" ? "default" : "secondary"}
              onClick={handleAction}
              disabled={
                isPending ||
                (actionType === "resolve" && banUser && !banReason.trim())
              }
              className={
                actionType === "resolve"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
            >
              {isPending ? "جارٍ الحفظ..." : "تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
