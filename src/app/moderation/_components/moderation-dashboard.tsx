"use client";

import {
  approveCanvas,
  approveQuiz,
  resolveReport,
} from "@/actions/moderation.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Prisma } from "@/generated/prisma";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Eye,
  FileQuestion,
  MessageSquare,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import RejectDialog from "./reject-dialog";

// Define proper Prisma payload types based on getModerationQueue includes
type PendingCanvasPayload = Prisma.CanvasGetPayload<{
  include: {
    contributor: {
      select: {
        name: true;
        image: true;
      };
    };
    chapter: {
      select: {
        id: true;
        title: true;
        subjectId: true;
      };
    };
  };
}>;

type PendingQuizPayload = Prisma.QuizGetPayload<{
  include: {
    contributor: {
      select: {
        name: true;
        image: true;
      };
    };
    chapter: {
      select: {
        id: true;
        title: true;
        subjectId: true;
      };
    };
    questions: {
      select: {
        id: true;
      };
    };
  };
}>;

// ReportPayload includes base fields (id, createdAt, reason, description) plus relations
type ReportPayload = Prisma.ReportGetPayload<{
  include: {
    reporter: {
      select: { name: true };
    };
    reportedCanvas: {
      select: {
        id: true;
        title: true;
        chapterId: true;
        chapter: { select: { subjectId: true } };
      };
    };
    reportedComment: {
      select: {
        id: true;
        text: true;
        canvasId: true;
        canvas: {
          select: {
            id: true;
            chapterId: true;
            chapter: { select: { subjectId: true } };
          };
        };
      };
    };
    reportedQuiz: {
      select: {
        id: true;
        title: true;
        chapterId: true;
        chapter: { select: { subjectId: true } };
      };
    };
    reportedQuizComment: {
      select: {
        id: true;
        text: true;
        quizId: true;
        quiz: {
          select: {
            id: true;
            chapterId: true;
            chapter: { select: { subjectId: true } };
          };
        };
      };
    };
  };
}>;

type ModerationDashboardProps = {
  subjects: { id: number; name: string; code: string }[];
  currentSubjectId: number;
  pendingCanvases: PendingCanvasPayload[];
  pendingQuizzes: PendingQuizPayload[];
  reports: ReportPayload[];
};

const reportReasonMap: Record<string, string> = {
  SPAM: "محتوى مكرر / مزعج",
  INAPPROPRIATE: "محتوى غير لائق",
  WRONG_INFO: "معلومات خاطئة",
  HARASSMENT: "تحرش / إساءة",
  COPYRIGHT: "انتهاك حقوق ملكية",
  OTHER: "أخرى",
};

export default function ModerationDashboard({
  subjects,
  currentSubjectId,
  pendingCanvases,
  pendingQuizzes,
  reports,
}: ModerationDashboardProps) {
  const router = useRouter();
  const [rejectDialogState, setRejectDialogState] = useState<{
    isOpen: boolean;
    contentId: number | null;
    contentType: "canvas" | "quiz" | null;
  }>({
    isOpen: false,
    contentId: null,
    contentType: null,
  });

  const [reportDialogState, setReportDialogState] = useState<{
    isOpen: boolean;
    reportId: number | null;
    resolution: "RESOLVED" | "DISMISSED" | null;
  }>({
    isOpen: false,
    reportId: null,
    resolution: null,
  });

  const [reportNotes, setReportNotes] = useState("");
  const [isResolvingReport, setIsResolvingReport] = useState(false);

  const handleSubjectChange = (value: string) => {
    router.push(`/moderation?subjectId=${value}`);
  };

  const handleApproveCanvas = async (canvasId: number) => {
    try {
      await approveCanvas(canvasId);
      toast.success("تم قبول الشرح");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("already been processed")) {
        toast.info("تمت معالجة هذا الشرح مسبقاً");
      } else {
        toast.error("حدث خطأ");
      }
      router.refresh();
    }
  };

  const handleApproveQuiz = async (quizId: number) => {
    try {
      await approveQuiz(quizId);
      toast.success("تم قبول الاختبار");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("already been processed")) {
        toast.info("تمت معالجة هذا الاختبار مسبقاً");
      } else {
        toast.error("حدث خطأ");
      }
      router.refresh();
    }
  };

  const openReportDialog = (
    reportId: number,
    resolution: "RESOLVED" | "DISMISSED"
  ) => {
    setReportDialogState({
      isOpen: true,
      reportId,
      resolution,
    });
    setReportNotes("");
  };

  const handleResolveReport = async () => {
    if (!reportDialogState.reportId || !reportDialogState.resolution) return;

    setIsResolvingReport(true);
    try {
      await resolveReport({
        reportId: reportDialogState.reportId,
        resolution: reportDialogState.resolution,
        notes: reportNotes.trim() || undefined,
      });

      toast.success(
        reportDialogState.resolution === "RESOLVED"
          ? "تم تأكيد البلاغ"
          : "تم رفض البلاغ"
      );
      setReportDialogState({ isOpen: false, reportId: null, resolution: null });
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء معالجة البلاغ");
    } finally {
      setIsResolvingReport(false);
    }
  };

  const getReportLink = (report: ReportPayload) => {
    if (report.reportedCanvas) {
      const { subjectId } = report.reportedCanvas.chapter;
      const { chapterId, id } = report.reportedCanvas;
      return `/subjects/${subjectId}/chapters/${chapterId}/canvases/${id}`;
    }
    if (report.reportedComment) {
      const { subjectId } = report.reportedComment.canvas.chapter;
      const { chapterId, id } = report.reportedComment.canvas;
      return `/subjects/${subjectId}/chapters/${chapterId}/canvases/${id}`;
    }
    if (report.reportedQuiz) {
      const { subjectId } = report.reportedQuiz.chapter;
      const { chapterId, id } = report.reportedQuiz;
      return `/subjects/${subjectId}/chapters/${chapterId}/quizzes/${id}`;
    }
    if (report.reportedQuizComment) {
      const { subjectId } = report.reportedQuizComment.quiz.chapter;
      const { chapterId, id } = report.reportedQuizComment.quiz;
      return `/subjects/${subjectId}/chapters/${chapterId}/quizzes/${id}`;
    }
    return "#";
  };

  const getReportContentType = (report: ReportPayload) => {
    if (report.reportedCanvas) return "شرح";
    if (report.reportedComment) return "تعليق";
    if (report.reportedQuiz) return "اختبار";
    if (report.reportedQuizComment) return "تعليق اختبار";
    return "محتوى";
  };

  const getReportedContent = (report: ReportPayload) => {
    if (report.reportedCanvas) return report.reportedCanvas.title;
    if (report.reportedComment) {
      const text = report.reportedComment.text;
      return text.length > 100 ? text.slice(0, 100) + "..." : text;
    }
    if (report.reportedQuiz) return report.reportedQuiz.title;
    if (report.reportedQuizComment) {
      const text = report.reportedQuizComment.text;
      return text.length > 100 ? text.slice(0, 100) + "..." : text;
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">لوحة المشرفين</h1>
        <div className="w-full sm:w-[240px]">
          <Select
            value={currentSubjectId.toString()}
            onValueChange={handleSubjectChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(s => (
                <SelectItem
                  key={s.id}
                  value={s.id.toString()}
                  className="text-right"
                >
                  <span className="text-muted-foreground ml-2 font-mono">
                    {s.code}
                  </span>
                  - {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="contributions" className="w-full" dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto rounded-lg px-1">
          <TabsTrigger value="contributions">
            المساهمات ({pendingCanvases.length + pendingQuizzes.length})
          </TabsTrigger>
          <TabsTrigger value="reports">البلاغات ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contributions" className="mt-6">
          <div className="grid gap-4">
            {pendingCanvases.length === 0 && pendingQuizzes.length === 0 ? (
              <div className="text-muted-foreground bg-muted/20 rounded-lg border py-12 text-center">
                لا توجد مساهمات معلقة للمراجعة
              </div>
            ) : (
              <>
                {pendingCanvases.map(canvas => (
                  <Card key={`canvas-${canvas.id}`}>
                    <CardContent className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
                      <div className="flex-1 text-right">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge className="bg-accent/20 border-accent/30 border">
                            شرح
                          </Badge>
                          <Badge variant="outline">
                            {canvas.chapter.title}
                          </Badge>
                          <span
                            className="text-muted-foreground text-sm"
                            suppressHydrationWarning
                          >
                            {new Date(canvas.createdAt).toLocaleDateString(
                              "ar-SA"
                            )}
                          </span>
                        </div>
                        <h3 className="mb-1 text-lg font-semibold">
                          {canvas.title}
                        </h3>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <span>بواسطة: {canvas.contributor.name}</span>
                        </div>
                      </div>

                      <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:justify-between md:w-auto md:flex-nowrap md:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full sm:w-auto"
                        >
                          <Link
                            href={`/subjects/${canvas.chapter.subjectId}/chapters/${canvas.chapter.id}/canvases/${canvas.id}`}
                            target="_blank"
                          >
                            <Eye className="ml-2 h-4 w-4" />
                            معاينة
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() =>
                            setRejectDialogState({
                              isOpen: true,
                              contentId: canvas.id,
                              contentType: "canvas",
                            })
                          }
                        >
                          <X className="ml-2 h-4 w-4" />
                          رفض
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
                          onClick={() => handleApproveCanvas(canvas.id)}
                        >
                          <Check className="ml-2 h-4 w-4" />
                          قبول
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingQuizzes.map(quiz => (
                  <Card key={`quiz-${quiz.id}`}>
                    <CardContent className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
                      <div className="flex-1 text-right">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge className="bg-accent/20 border-accent/30 border">
                            اختبار
                          </Badge>
                          <Badge variant="outline">{quiz.chapter.title}</Badge>
                          <Badge variant="secondary">
                            <FileQuestion className="ml-1 h-3 w-3" />
                            {quiz.questions.length} سؤال
                          </Badge>
                          <span
                            className="text-muted-foreground text-sm"
                            suppressHydrationWarning
                          >
                            {new Date(quiz.createdAt).toLocaleDateString(
                              "ar-SA"
                            )}
                          </span>
                        </div>
                        <h3 className="mb-1 text-lg font-semibold">
                          {quiz.title}
                        </h3>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <span>بواسطة: {quiz.contributor.name}</span>
                        </div>
                      </div>

                      <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:justify-between md:w-auto md:flex-nowrap md:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full sm:w-auto"
                        >
                          <Link
                            href={`/moderation/quiz/${quiz.id}/preview`}
                            target="_blank"
                          >
                            <Eye className="ml-2 h-4 w-4" />
                            معاينة
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() =>
                            setRejectDialogState({
                              isOpen: true,
                              contentId: quiz.id,
                              contentType: "quiz",
                            })
                          }
                        >
                          <X className="ml-2 h-4 w-4" />
                          رفض
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
                          onClick={() => handleApproveQuiz(quiz.id)}
                        >
                          <Check className="ml-2 h-4 w-4" />
                          قبول
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="grid gap-4">
            {reports.length === 0 ? (
              <div className="text-muted-foreground bg-muted/20 rounded-lg border py-12 text-center">
                لا توجد بلاغات جديدة
              </div>
            ) : (
              reports.map(report => (
                <Card key={report.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500" />
                        <Badge
                          variant="outline"
                          className="border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                        >
                          {reportReasonMap[report.reason] || report.reason}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getReportContentType(report)}
                        </Badge>
                      </div>
                      <span
                        className="text-muted-foreground shrink-0 text-xs"
                        suppressHydrationWarning
                      >
                        {new Date(report.createdAt).toLocaleDateString(
                          "ar-SA",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Reported content preview */}
                    <div className="bg-muted/50 dark:bg-muted/20 rounded-lg border p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <MessageSquare className="text-muted-foreground h-4 w-4" />
                        <span className="text-muted-foreground text-xs font-medium">
                          المحتوى المبلغ عنه
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        {getReportedContent(report)}
                      </p>
                    </div>

                    {/* Reporter description */}
                    {report.description && (
                      <div>
                        <span className="text-muted-foreground mb-1 block text-xs font-medium">
                          وصف البلاغ
                        </span>
                        <p className="text-sm">{report.description}</p>
                      </div>
                    )}

                    {/* Reporter info */}
                    <div className="text-muted-foreground text-xs">
                      المبلغ: {report.reporter.name}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                      >
                        <Link href={getReportLink(report)} target="_blank">
                          <ExternalLink className="ml-2 h-4 w-4" />
                          معاينة المحتوى
                        </Link>
                      </Button>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                          onClick={() =>
                            openReportDialog(report.id, "DISMISSED")
                          }
                        >
                          <X className="ml-2 h-4 w-4" />
                          رفض البلاغ
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto dark:bg-green-700 dark:hover:bg-green-600"
                          onClick={() =>
                            openReportDialog(report.id, "RESOLVED")
                          }
                        >
                          <Check className="ml-2 h-4 w-4" />
                          تأكيد البلاغ
                        </Button>
                      </div>
                    </div>

                    {/* Hint text */}
                    <p className="text-muted-foreground text-xs">
                      ملاحظة: تأكيد البلاغ يعني أن المحتوى يخالف القواعد. يمكنك
                      بعدها حذف المحتوى من صفحته مباشرة.
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <RejectDialog
        isOpen={rejectDialogState.isOpen}
        contentId={rejectDialogState.contentId}
        contentType={rejectDialogState.contentType}
        onClose={() =>
          setRejectDialogState(prev => ({ ...prev, isOpen: false }))
        }
        onSuccess={() => router.refresh()}
      />

      {/* Report Resolution Dialog */}
      <Dialog
        open={reportDialogState.isOpen}
        onOpenChange={open => {
          if (!open) {
            setReportDialogState({
              isOpen: false,
              reportId: null,
              resolution: null,
            });
          }
        }}
      >
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {reportDialogState.resolution === "RESOLVED"
                ? "تأكيد البلاغ"
                : "رفض البلاغ"}
            </DialogTitle>
            <DialogDescription>
              {reportDialogState.resolution === "RESOLVED"
                ? "بتأكيد هذا البلاغ، أنت توافق على أن المحتوى المبلغ عنه يخالف القواعد. سيحصل المبلِّغ على نقاط مكافأة."
                : "برفض هذا البلاغ، أنت تقر بأن المحتوى لا يخالف القواعد. لن يحصل المبلِّغ على نقاط."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="أضف ملاحظات حول قرارك..."
                value={reportNotes}
                onChange={e => setReportNotes(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-muted-foreground text-xs">
                {reportNotes.length}/500
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() =>
                setReportDialogState({
                  isOpen: false,
                  reportId: null,
                  resolution: null,
                })
              }
              disabled={isResolvingReport}
              className="w-full sm:w-auto"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleResolveReport}
              disabled={isResolvingReport}
              className={`w-full sm:w-auto ${
                reportDialogState.resolution === "RESOLVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isResolvingReport
                ? "جارٍ المعالجة..."
                : reportDialogState.resolution === "RESOLVED"
                  ? "تأكيد البلاغ"
                  : "رفض البلاغ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
