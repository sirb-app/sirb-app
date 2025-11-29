"use client";

import {
  createSubjectResource,
  deleteSubjectResource,
  generateUploadUrl,
  getResourceStatus,
  triggerResourceIndexing,
} from "@/actions/resource.actions";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { RagStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

interface SubjectResourceItem {
  id: number;
  title: string;
  description: string | null;
  url: string;
  fileSize: bigint;
  mimeType: string;
  createdAt: Date;
  isIndexed: boolean;
  ragStatus: RagStatus | null;
  chapterId: number | null;
  chapter: { id: number; title: string; sequence: number } | null;
}

interface ChapterOption {
  id: number;
  title: string;
  sequence: number;
}

interface DocumentsManagerProps {
  subjectId: number;
  resources: SubjectResourceItem[];
  chapters: ChapterOption[];
}

// RAG status labels and colors
const ragStatusLabels: Record<RagStatus, string> = {
  PENDING: "في الانتظار",
  PROCESSING: "جاري الفهرسة",
  COMPLETED: "تمت الفهرسة",
  FAILED: "فشلت الفهرسة",
};

const ragStatusColors: Record<RagStatus, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  PROCESSING:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const ragStatusIcons: Record<RagStatus, React.ReactNode> = {
  PENDING: <Clock className="h-3.5 w-3.5" />,
  PROCESSING: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  COMPLETED: <CheckCircle2 className="h-3.5 w-3.5" />,
  FAILED: <AlertCircle className="h-3.5 w-3.5" />,
};

export function DocumentsManager({
  subjectId,
  resources: initialResources,
  chapters,
}: DocumentsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string>("general");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [resources, setResources] = useState(initialResources);
  const [deleteTarget, setDeleteTarget] = useState<SubjectResourceItem | null>(
    null
  );
  const [indexingIds, setIndexingIds] = useState<Set<number>>(new Set());
  const pollingRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    setResources(initialResources);
  }, [initialResources]);

  useEffect(() => {
    return () => {
      pollingRef.current.forEach(timer => clearTimeout(timer));
      pollingRef.current.clear();
    };
  }, []);

  const pollStatus = useCallback(async (resourceId: number) => {
    const result = await getResourceStatus(resourceId);
    if (result.error || !result.data) {
      pollingRef.current.delete(resourceId);
      setIndexingIds(prev => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
      return;
    }

    const { isIndexed, ragStatus } = result.data;

    setResources(prev =>
      prev.map(r => (r.id === resourceId ? { ...r, isIndexed, ragStatus } : r))
    );

    if (ragStatus === RagStatus.PENDING || ragStatus === RagStatus.PROCESSING) {
      const timer = setTimeout(() => pollStatus(resourceId), 3000);
      pollingRef.current.set(resourceId, timer);
    } else {
      pollingRef.current.delete(resourceId);
      setIndexingIds(prev => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });

      if (ragStatus === RagStatus.COMPLETED) {
        toast.success("تمت فهرسة المستند بنجاح");
      } else if (ragStatus === RagStatus.FAILED) {
        toast.error("فشلت عملية الفهرسة");
      }
    }
  }, []);

  const startPolling = useCallback(
    (resourceId: number) => {
      if (pollingRef.current.has(resourceId)) return;
      pollStatus(resourceId);
    },
    [pollStatus]
  );

  const handleUpload = async (formData: FormData, form: HTMLFormElement) => {
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || undefined;
    const chapterId =
      selectedChapter !== "general" ? parseInt(selectedChapter) : undefined;

    if (!file || file.size === 0) {
      toast.error("يرجى اختيار ملف");
      return;
    }

    try {
      setUploadProgress(0);

      const urlResult = await generateUploadUrl({
        filename: file.name,
        contentType: file.type,
        subjectId,
      });

      if (urlResult.error || !urlResult.data) {
        toast.error(urlResult.error ?? "فشل إنشاء رابط الرفع");
        setUploadProgress(null);
        return;
      }

      const { uploadUrl, key } = urlResult.data;

      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", e => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      const result = await createSubjectResource({
        title,
        description,
        key,
        fileSize: BigInt(file.size),
        mimeType: file.type,
        subjectId,
        chapterId,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("تم رفع المستند بنجاح");
      form.reset();
      setSelectedChapter("general");
      setUploadOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع الملف");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleTriggerIndexing = async (resource: SubjectResourceItem) => {
    if (resource.mimeType !== "application/pdf") {
      toast.error("الفهرسة مدعومة لملفات PDF فقط");
      return;
    }

    setIndexingIds(prev => new Set(prev).add(resource.id));

    startTransition(async () => {
      const result = await triggerResourceIndexing(resource.id);

      if (result.error) {
        toast.error(result.error);
        setIndexingIds(prev => {
          const next = new Set(prev);
          next.delete(resource.id);
          return next;
        });
        return;
      }

      setResources(prev =>
        prev.map(r =>
          r.id === resource.id ? { ...r, ragStatus: RagStatus.PENDING } : r
        )
      );

      toast.success("تم بدء عملية الفهرسة");
      startPolling(resource.id);
    });
  };

  const handleDelete = async (resource: SubjectResourceItem) => {
    startTransition(async () => {
      const result = await deleteSubjectResource(resource.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Cancel any active polling for this resource
      const timer = pollingRef.current.get(resource.id);
      if (timer) {
        clearTimeout(timer);
        pollingRef.current.delete(resource.id);
      }
      setIndexingIds(prev => {
        const next = new Set(prev);
        next.delete(resource.id);
        return next;
      });

      setResources(prev => prev.filter(r => r.id !== resource.id));
      setDeleteTarget(null);
      toast.success("تم حذف المستند");
    });
  };

  const formatFileSize = (bytes: bigint) => {
    const n = Number(bytes);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  const getStatusDisplay = (resource: SubjectResourceItem) => {
    if (resource.isIndexed) {
      return {
        label: "تمت الفهرسة",
        color: ragStatusColors.COMPLETED,
        icon: ragStatusIcons.COMPLETED,
      };
    }
    if (resource.ragStatus && ragStatusLabels[resource.ragStatus]) {
      return {
        label: ragStatusLabels[resource.ragStatus],
        color: ragStatusColors[resource.ragStatus],
        icon: ragStatusIcons[resource.ragStatus],
      };
    }
    return {
      label: "لم تتم الفهرسة",
      color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      icon: null,
    };
  };

  const canTriggerIndexing = (resource: SubjectResourceItem) => {
    return (
      !resource.isIndexed &&
      resource.mimeType === "application/pdf" &&
      resource.ragStatus !== RagStatus.PENDING &&
      resource.ragStatus !== RagStatus.PROCESSING &&
      !indexingIds.has(resource.id)
    );
  };

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">مصادر المادة</h2>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap" aria-label="رفع مستند جديد">
              <Upload className="ml-2 h-4 w-4" />
              رفع مستند
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>رفع مستند جديد</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={event => {
                event.preventDefault();
                const form = event.currentTarget;
                const formData = new FormData(form);
                handleUpload(formData, form);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="document-title">عنوان المستند</Label>
                <Input
                  id="document-title"
                  name="title"
                  required
                  disabled={isPending || uploadProgress !== null}
                  autoFocus
                  placeholder="مثال: سلايدات الشابتر الأول"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-description">
                  وصف مختصر (اختياري)
                </Label>
                <textarea
                  id="document-description"
                  name="description"
                  disabled={isPending || uploadProgress !== null}
                  rows={2}
                  className={cn(
                    "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
                    "border-input min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs",
                    "focus-visible:border-ring focus-visible:ring-ring/50 transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
                    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-chapter">الفصل (اختياري)</Label>
                <Select
                  value={selectedChapter}
                  onValueChange={setSelectedChapter}
                  disabled={isPending || uploadProgress !== null}
                >
                  <SelectTrigger dir="rtl" id="document-chapter">
                    <SelectValue placeholder="اختر فصل أو اتركه عام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عام (جميع الفصول)</SelectItem>
                    {chapters.map(chapter => (
                      <SelectItem key={chapter.id} value={String(chapter.id)}>
                        {chapter.sequence}. {chapter.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  اختر فصل محدد إذا كان المستند خاص به
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-file">الملف</Label>
                <Input
                  id="document-file"
                  name="file"
                  type="file"
                  required
                  disabled={isPending || uploadProgress !== null}
                  accept=".pdf"
                />
                <p className="text-muted-foreground text-xs">
                  الصيغ المدعومة: PDF
                </p>
              </div>
              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>جارٍ الرفع...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <DialogFooter className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadOpen(false)}
                  disabled={isPending || uploadProgress !== null}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || uploadProgress !== null}
                >
                  {uploadProgress !== null ? "جارٍ الرفع..." : "رفع"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {resources.length === 0 ? (
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-8 text-center">
          <FileText className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <h3 className="mb-1 font-semibold">لا توجد مصادر</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            ارفع ملفات PDF ليتم فهرستها بالذكاء الاصطناعي
          </p>
          <Button
            onClick={() => setUploadOpen(true)}
            variant="outline"
            size="sm"
          >
            <Upload className="ml-2 h-4 w-4" />
            رفع أول مستند
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {resources.map(resource => {
            const status = getStatusDisplay(resource);
            return (
              <li
                key={resource.id}
                className="bg-card rounded-lg border p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <FileText className="text-muted-foreground mt-1 h-5 w-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{resource.title}</h3>
                          {resource.chapter && (
                            <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium">
                              {resource.chapter.sequence}.{" "}
                              {resource.chapter.title}
                            </span>
                          )}
                        </div>
                        {resource.description && (
                          <p className="text-muted-foreground text-sm">
                            {resource.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            status.color
                          )}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span dir="ltr">{formatFileSize(resource.fileSize)}</span>
                      <span dir="ltr">{resource.mimeType}</span>
                      <span>{formatDate(resource.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {canTriggerIndexing(resource) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTriggerIndexing(resource)}
                          disabled={isPending}
                        >
                          <Bot className="ml-1.5 h-3.5 w-3.5" />
                          تفعيل البحث الذكي
                        </Button>
                      )}
                      {indexingIds.has(resource.id) && (
                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          جاري الإرسال...
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(resource)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">حذف</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المستند &quot;{deleteTarget?.title}&quot; نهائياً. هذا
              الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
