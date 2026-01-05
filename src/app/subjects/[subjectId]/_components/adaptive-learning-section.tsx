"use client";

import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  createStudyPlan,
  deleteStudyPlan,
  updateStudyPlanTitle,
} from "@/actions/study-plan.action";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Chapter = {
  id: number;
  title: string;
  sequence: number;
};

export type StudyPlanSession = {
  id: string;
  title: string;
  status: string;
  selectedChapterIds: number[];
  progressPercentage: number;
  placementCompleted: boolean;
  updatedAt: Date;
};

interface AdaptiveLearningSectionProps {
  subjectId: number;
  chapters: Chapter[];
  isAuthenticated: boolean;
  isEnrolled: boolean;
  sessions: StudyPlanSession[];
}

export function AdaptiveLearningSection({
  subjectId,
  chapters,
  isAuthenticated,
  isEnrolled,
  sessions,
}: AdaptiveLearningSectionProps) {
  const [selectedChapterIds, setSelectedChapterIds] = useState<number[]>([]);
  const [sessionTitle, setSessionTitle] = useState("");
  const [startWithAssessment, setStartWithAssessment] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localSessions, setLocalSessions] = useState(sessions);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const cancelEditRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null
  );

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `قبل ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `قبل ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "أمس";
    if (days < 7) return `قبل ${days} أيام`;
    return new Date(date).toLocaleDateString("ar");
  };

  const getSessionChapters = (chapterIds: number[]) => {
    return chapters
      .filter(c => chapterIds.includes(c.id))
      .sort((a, b) => a.sequence - b.sequence);
  };

  const allSelected = selectedChapterIds.length === chapters.length;
  const hasSelection = selectedChapterIds.length > 0;

  // Sync local state with prop updates
  useEffect(() => {
    setLocalSessions(sessions);
  }, [sessions]);

  const toggleChapter = (id: number) => {
    setSelectedChapterIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedChapterIds([]);
    } else {
      setSelectedChapterIds(chapters.map(c => c.id));
    }
  };

  const router = useRouter();

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    // Clear stale UI state between dialog sessions.
    setErrorMessage(null);
    if (!nextOpen) {
      setShowCreateForm(false);
      setSelectedChapterIds([]);
      setSessionTitle("");
      setIsSubmitting(false);
      setEditingSessionId(null);
      setEditingTitle("");
      setDeletingSessionId(null);
      cancelEditRef.current = false;
    }
  };

  const handleStart = async () => {
    if (!hasSelection || !isAuthenticated || !isEnrolled) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await createStudyPlan({
        subjectId,
        title: sessionTitle,
        selectedChapterIds,
        startWithAssessment,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      // Keep dialog open (isSubmitting=true shows loading state) until navigation happens
      if (result.startAssessment) {
        router.push(`/sessions/${result.studyPlanId}/assessment`);
      } else {
        router.push(`/sessions/${result.studyPlanId}`);
      }
      // Note: Don't call setOpen(false) or setIsSubmitting(false) here
      // The page will navigate away, so these states don't need to be reset
    } catch {
      setErrorMessage("حدث خطأ أثناء إنشاء الجلسة");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            disabled={!isAuthenticated || !isEnrolled}
            className="from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 bg-gradient-to-l"
          >
            <Sparkles className="me-2 size-4" />
            جلسات التعلم الذكي
          </Button>
        </DialogTrigger>

        <DialogContent dir="rtl" className="max-w-xl">
          <DialogHeader>
            <DialogTitle>جلسات التعلم الذكي</DialogTitle>
            <DialogDescription>
              ابدأ جلسة جديدة أو تابع جلسة موجودة
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="text-destructive border-destructive/30 bg-destructive/10 rounded-md border px-3 py-2 text-sm">
              {errorMessage}
            </div>
          )}

          {!showCreateForm ? (
            <div className="space-y-4">
              {/* Create New Session Card */}
              <Card
                className="hover:border-primary hover:bg-muted/50 cursor-pointer border-2 border-dashed transition-colors"
                onClick={() => {
                  setErrorMessage(null);
                  setShowCreateForm(true);
                }}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="from-primary/20 to-primary/10 flex size-10 items-center justify-center rounded-lg bg-gradient-to-br">
                    <Plus className="text-primary size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">إنشاء جلسة جديدة</p>
                    <p className="text-muted-foreground text-xs">
                      اختر الفصول وابدأ التعلم
                    </p>
                  </div>
                  <ArrowLeft className="text-muted-foreground size-5" />
                </CardContent>
              </Card>

              {localSessions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">الجلسات السابقة</p>
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {localSessions.map(session => {
                      const sessionChapters = getSessionChapters(
                        session.selectedChapterIds
                      );
                      const statusLabel =
                        session.status === "PLACEMENT"
                          ? "اختبار تحديد المستوى"
                          : session.status === "ACTIVE"
                            ? "نشط"
                            : "جديد";
                      const statusColor =
                        session.status === "PLACEMENT"
                          ? "bg-amber-500"
                          : session.status === "ACTIVE"
                            ? "bg-green-500"
                            : "bg-blue-500";
                      return (
                        <div key={session.id} className="group relative">
                          <Link
                            href={
                              session.placementCompleted
                                ? `/sessions/${session.id}`
                                : `/sessions/${session.id}/assessment`
                            }
                            className="block"
                          >
                            <Card className="hover:bg-muted/50 transition-colors">
                              <CardContent className="p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  {editingSessionId === session.id ? (
                                    <input
                                      ref={editInputRef}
                                      type="text"
                                      value={editingTitle}
                                      onChange={e =>
                                        setEditingTitle(e.target.value)
                                      }
                                      onBlur={async () => {
                                        const wasCancelled =
                                          cancelEditRef.current;
                                        cancelEditRef.current = false;

                                        if (wasCancelled) {
                                          setEditingSessionId(null);
                                          return;
                                        }

                                        try {
                                          if (
                                            editingTitle.trim() &&
                                            editingTitle !== session.title
                                          ) {
                                            const result =
                                              await updateStudyPlanTitle(
                                                session.id,
                                                editingTitle
                                              );
                                            if (result.success) {
                                              setLocalSessions(prev =>
                                                prev.map(s =>
                                                  s.id === session.id
                                                    ? {
                                                        ...s,
                                                        title:
                                                          editingTitle.trim(),
                                                      }
                                                    : s
                                                )
                                              );
                                            } else {
                                              setErrorMessage(
                                                result.error ||
                                                  "تعذر تعديل عنوان الجلسة"
                                              );
                                            }
                                          }
                                        } finally {
                                          setEditingSessionId(null);
                                        }
                                      }}
                                      onKeyDown={e => {
                                        if (e.key === "Enter")
                                          e.currentTarget.blur();
                                        if (e.key === "Escape") {
                                          e.preventDefault();
                                          cancelEditRef.current = true;
                                          setEditingTitle(session.title || "");
                                          setEditingSessionId(null);
                                        }
                                      }}
                                      onClick={e => e.preventDefault()}
                                      className="border-primary w-full border-b bg-transparent text-sm font-medium outline-none"
                                      dir="auto"
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="flex min-w-0 items-center gap-1">
                                      <p
                                        className="truncate text-sm font-medium"
                                        dir="auto"
                                      >
                                        {session.title || "جلسة بدون عنوان"}
                                      </p>
                                      <button
                                        onClick={e => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setErrorMessage(null);
                                          setEditingSessionId(session.id);
                                          setEditingTitle(session.title || "");
                                        }}
                                        className="hover:bg-muted rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                                      >
                                        <Pencil className="text-muted-foreground size-3" />
                                      </button>
                                    </div>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className="shrink-0 gap-1 text-xs"
                                  >
                                    <span
                                      className={cn(
                                        "size-1.5 rounded-full",
                                        statusColor
                                      )}
                                    />
                                    {statusLabel}
                                  </Badge>
                                </div>
                                <div className="mb-2 flex flex-wrap gap-1">
                                  {sessionChapters.map(ch => (
                                    <Badge
                                      key={ch.id}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {ch.sequence}. {ch.title}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="text-muted-foreground flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="size-3 shrink-0" />
                                    <span>
                                      {formatRelativeTime(session.updatedAt)}
                                    </span>
                                  </div>
                                  {session.progressPercentage > 0 && (
                                    <span className="text-primary font-medium">
                                      {Math.round(session.progressPercentage)}%
                                      مكتمل
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 absolute top-2 left-2 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={e => e.stopPropagation()}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف الجلسة</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف هذه الجلسة؟ لن يتم حذف
                                  مهاراتك المكتسبة.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={async () => {
                                    try {
                                      setErrorMessage(null);
                                      setDeletingSessionId(session.id);
                                      const result = await deleteStudyPlan(
                                        session.id
                                      );
                                      if (result.success) {
                                        setLocalSessions(prev =>
                                          prev.filter(s => s.id !== session.id)
                                        );
                                        return;
                                      }
                                      setErrorMessage(
                                        result.error ||
                                          "تعذر حذف الجلسة. حاول مرة أخرى."
                                      );
                                    } finally {
                                      setDeletingSessionId(null);
                                    }
                                  }}
                                  disabled={deletingSessionId === session.id}
                                >
                                  {deletingSessionId === session.id ? (
                                    <span className="inline-flex items-center gap-2">
                                      <Loader2 className="size-4 animate-spin" />
                                      حذف
                                    </span>
                                  ) : (
                                    "حذف"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setErrorMessage(null);
                  setShowCreateForm(false);
                  setSelectedChapterIds([]);
                  setSessionTitle("");
                }}
                className="gap-2"
              >
                رجوع
                <ArrowRight className="size-4" />
              </Button>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-title">عنوان الجلسة (اختياري)</Label>
                  <Input
                    id="session-title"
                    placeholder="مثال: مراجعة نهائية"
                    value={sessionTitle}
                    onChange={e => setSessionTitle(e.target.value)}
                    dir="auto"
                  />
                </div>

                <label
                  htmlFor="assessment-switch"
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <span className="text-sm font-medium">
                      اختبار تحديد المستوى
                    </span>
                    <p className="text-muted-foreground text-xs">
                      يحدد مستواك قبل البدء
                    </p>
                  </div>
                  <Switch
                    id="assessment-switch"
                    checked={startWithAssessment}
                    onCheckedChange={setStartWithAssessment}
                  />
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">الفصول</Label>
                    <Button variant="ghost" size="sm" onClick={toggleAll}>
                      {allSelected ? "إلغاء الكل" : "تحديد الكل"}
                    </Button>
                  </div>
                  <div className="max-h-60 space-y-2 overflow-y-auto">
                    {chapters.map(chapter => (
                      <label
                        key={chapter.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                          selectedChapterIds.includes(chapter.id) &&
                            "bg-primary/10 border-primary/40"
                        )}
                      >
                        <Checkbox
                          checked={selectedChapterIds.includes(chapter.id)}
                          onCheckedChange={() => toggleChapter(chapter.id)}
                        />
                        <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                          {chapter.sequence}
                        </span>
                        <span className="flex-1 text-sm">{chapter.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4 sm:justify-start">
                {!isAuthenticated ? (
                  <Button asChild>
                    <Link href="/auth/login">تسجيل الدخول</Link>
                  </Button>
                ) : !isEnrolled ? (
                  <Button disabled>سجل في المقرر أولاً</Button>
                ) : (
                  <Button
                    onClick={handleStart}
                    disabled={!hasSelection || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="me-2 size-4 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      "ابدأ الجلسة"
                    )}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
