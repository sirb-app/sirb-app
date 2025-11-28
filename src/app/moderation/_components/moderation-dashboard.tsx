"use client";

import { approveCanvas } from "@/actions/moderation.action";
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
import { AlertTriangle, Check, ExternalLink, Eye, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import RejectDialog from "./reject-dialog";

type ModerationDashboardProps = {
  subjects: { id: number; name: string; code: string }[];
  currentSubjectId: number;
  pendingCanvases: any[];
  reports: any[];
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
  reports,
}: ModerationDashboardProps) {
  const router = useRouter();
  const [rejectDialogState, setRejectDialogState] = useState<{
    isOpen: boolean;
    canvasId: number | null;
  }>({
    isOpen: false,
    canvasId: null,
  });

  const handleSubjectChange = (value: string) => {
    router.push(`/moderation?subjectId=${value}`);
  };

  const handleApprove = async (canvasId: number) => {
    try {
      await approveCanvas(canvasId);
      toast.success("تم قبول المحتوى");
      router.refresh();
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  const getReportLink = (report: any) => {
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
            المساهمات ({pendingCanvases.length})
          </TabsTrigger>
          <TabsTrigger value="reports">البلاغات ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contributions" className="mt-6">
          <div className="grid gap-4">
            {pendingCanvases.length === 0 ? (
              <div className="text-muted-foreground bg-muted/20 rounded-lg border py-12 text-center">
                لا توجد مساهمات معلقة للمراجعة
              </div>
            ) : (
              pendingCanvases.map(canvas => (
                <Card key={canvas.id}>
                  <CardContent className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
                    <div className="flex-1 text-right">
                      <div className="mb-2 flex items-center gap-2">
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
                          href={`/subjects/${currentSubjectId}/chapters/${canvas.chapterId}/canvases/${canvas.id}`}
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
                            canvasId: canvas.id,
                          })
                        }
                      >
                        <X className="ml-2 h-4 w-4" />
                        رفض
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                        onClick={() => handleApprove(canvas.id)}
                      >
                        <Check className="ml-2 h-4 w-4" />
                        قبول
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
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
                          المحتوى المبلغ عنه: {report.reportedCanvas.title}
                        </div>
                      )}
                      {report.reportedComment && (
                        <div>
                          التعليق المبلغ عنه: {report.reportedComment.text}
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
        canvasId={rejectDialogState.canvasId}
        onClose={() =>
          setRejectDialogState(prev => ({ ...prev, isOpen: false }))
        }
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
