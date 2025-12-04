"use client";

import { approveCanvas, approveQuiz } from "@/actions/moderation.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prisma } from "@/generated/prisma";
import { AlertTriangle, Check, ExternalLink, Eye, FileQuestion, X } from "lucide-react";
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

  const handleSubjectChange = (value: string) => {
    router.push(`/moderation?subjectId=${value}`);
  };

  const handleApproveCanvas = async (canvasId: number) => {
    try {
      await approveCanvas(canvasId);
      toast.success("تم قبول الشرح");
      router.refresh();
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  const handleApproveQuiz = async (quizId: number) => {
    try {
      await approveQuiz(quizId);
      toast.success("تم قبول الاختبار");
      router.refresh();
    } catch (error) {
      toast.error("حدث خطأ");
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
                            <Badge className="bg-accent/20 border-accent/30 border">شرح</Badge>
                            <Badge variant="outline">{canvas.chapter.title}</Badge>
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
                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
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
                            <Badge className="bg-accent/20 border-accent/30 border">اختبار</Badge>
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
                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
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
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        {reportReasonMap[report.reason] || report.reason}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={getReportLink(report)} target="_blank">
                          <ExternalLink className="ml-2 h-4 w-4" />
                          الذهاب للمحتوى
                        </Link>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm">
                      {report.description || "لا يوجد وصف"}
                    </p>
                    <div className="bg-muted rounded p-3 text-sm">
                      {report.reportedCanvas && (
                        <div>
                          الشرح المبلغ عنه: {report.reportedCanvas.title}
                        </div>
                      )}
                      {report.reportedComment && (
                        <div>
                          التعليق المبلغ عنه: {report.reportedComment.text}
                        </div>
                      )}
                      {report.reportedQuiz && (
                        <div>
                          الاختبار المبلغ عنه: {report.reportedQuiz.title}
                        </div>
                      )}
                      {report.reportedQuizComment && (
                        <div>
                          تعليق الاختبار المبلغ عنه: {report.reportedQuizComment.text}
                        </div>
                      )}
                    </div>
                    <div className="text-muted-foreground mt-4 text-xs">
                      المبلغ: {report.reporter.name}
                    </div>
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
    </div>
  );
}
