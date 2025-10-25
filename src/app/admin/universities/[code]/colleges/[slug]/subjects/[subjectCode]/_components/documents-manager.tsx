"use client";

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
import { cn } from "@/lib/utils";
import { FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface DocumentItem {
  id: string;
  title: string;
  description: string | null;
  documentType: string;
  status: string;
  fileName: string;
  fileSize: bigint | number;
  mimeType: string;
  createdAt: Date;
  totalChunks: number;
  totalPages: number | null;
  processingError: string | null;
  chapterId: number | null;
}

interface ChapterOption {
  id: number;
  title: string;
  sequence: number;
}

interface DocumentsManagerProps {
  subjectId: number;
  documents: DocumentItem[];
  chapters: ChapterOption[];
}

const statusLabels: Record<string, string> = {
  UPLOADED: "تم الرفع",
  PROCESSING: "جاري المعالجة",
  INDEXED: "تمت الفهرسة",
  FAILED: "فشل",
};

const statusColors: Record<string, string> = {
  UPLOADED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  PROCESSING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  INDEXED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function DocumentsManager({
  subjectId,
  documents,
  chapters,
}: DocumentsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string>("general");

  const handleUpload = (formData: FormData, form: HTMLFormElement) => {
    startTransition(async () => {
      toast.success("تم رفع المستند بنجاح");
      form.reset();
      setUploadOpen(false);
      router.refresh();
    });
  };

  const formatFileSize = (bytes: bigint | number) => {
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">المستندات</h2>
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
                formData.set("subjectId", String(subjectId));
                handleUpload(formData, form);
              }}
            >
              <input type="hidden" name="subjectId" value={subjectId} />
              <div className="space-y-2">
                <Label htmlFor="document-title">عنوان المستند</Label>
                <Input
                  id="document-title"
                  name="title"
                  required
                  disabled={isPending}
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
                  disabled={isPending}
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
                  disabled={isPending}
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
                {selectedChapter !== "general" && (
                  <input
                    type="hidden"
                    name="chapterId"
                    value={selectedChapter}
                  />
                )}
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
                  disabled={isPending}
                  accept=".pdf,.ppt,.pptx"
                />
                <p className="text-muted-foreground text-xs">
                  الصيغ المدعومة: PDF, PowerPoint
                </p>
              </div>
              <DialogFooter className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadOpen(false)}
                  disabled={isPending}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "جارٍ الرفع..." : "رفع"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-8 text-center">
          <FileText className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <h3 className="mb-1 font-semibold">لا توجد مستندات</h3>
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
          {documents.map(doc => {
            const chapter = doc.chapterId
              ? chapters.find(ch => ch.id === doc.chapterId)
              : null;
            return (
              <li
                key={doc.id}
                className="bg-card rounded-lg border p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <FileText className="text-muted-foreground mt-1 h-5 w-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{doc.title}</h3>
                          {chapter && (
                            <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium">
                              {chapter.sequence}. {chapter.title}
                            </span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-muted-foreground text-sm">
                            {doc.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          statusColors[doc.status]
                        )}
                      >
                        {statusLabels[doc.status]}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>{doc.fileName}</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      {doc.totalPages && <span>{doc.totalPages} صفحة</span>}
                      {doc.status === "INDEXED" && doc.totalChunks > 0 && (
                        <span>{doc.totalChunks} مقطع</span>
                      )}
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                    {doc.status === "FAILED" && doc.processingError && (
                      <p className="text-destructive text-xs">
                        خطأ: {doc.processingError}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
