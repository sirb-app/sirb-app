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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Prisma } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { MoreVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type ChapterWithCounts = Prisma.ChapterGetPayload<{
  include: { _count: { select: { content: true } } };
}>;

interface ChaptersManagerProps {
  subjectId: number;
  chapters: ChapterWithCounts[];
}

export function ChaptersManager({ subjectId, chapters }: ChaptersManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetChapter, setTargetChapter] = useState<ChapterWithCounts | null>(
    null
  );

  const handleCreate = (formData: FormData, form: HTMLFormElement) => {
    startTransition(async () => {
      const { createChapterAction } = await import("@/actions/chapter.actions");
      const res = await createChapterAction(formData);
      if (!("error" in res) || res.error === null) {
        toast.success("تمت إضافة الفصل");
        form.reset();
        setCreateOpen(false);
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  const handleUpdate = (formData: FormData, form: HTMLFormElement) => {
    if (!targetChapter) return;
    startTransition(async () => {
      const { updateChapterAction } = await import("@/actions/chapter.actions");
      const res = await updateChapterAction(targetChapter.id, formData);
      if (!("error" in res) || res.error === null) {
        toast.success("تم تحديث الفصل");
        form.reset();
        setEditOpen(false);
        setTargetChapter(null);
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = () => {
    if (!targetChapter) return;
    startTransition(async () => {
      const { deleteChapterAction } = await import("@/actions/chapter.actions");
      const res = await deleteChapterAction(targetChapter.id, subjectId);
      if (!("error" in res) || res.error === null) {
        toast.success("تم حذف الفصل");
        setDeleteOpen(false);
        setTargetChapter(null);
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">الفصول</h2>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap" aria-label="إضافة فصل جديد">
              <Plus className="ml-2 h-4 w-4" />
              إضافة فصل
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>فصل جديد</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={event => {
                event.preventDefault();
                const form = event.currentTarget;
                const formData = new FormData(form);
                formData.set("subjectId", String(subjectId));
                handleCreate(formData, form);
              }}
            >
              <input type="hidden" name="subjectId" value={subjectId} />
              <div className="space-y-2">
                <Label htmlFor="new-chapter-title">عنوان الفصل</Label>
                <Input
                  id="new-chapter-title"
                  name="title"
                  required
                  disabled={isPending}
                  autoFocus
                  placeholder="مثال: مقدمة في البرمجة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-chapter-sequence">الترتيب</Label>
                <Input
                  id="new-chapter-sequence"
                  name="sequence"
                  type="number"
                  min="1"
                  required
                  disabled={isPending}
                  defaultValue={chapters.length + 1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-chapter-description">
                  وصف مختصر (اختياري)
                </Label>
                <textarea
                  id="new-chapter-description"
                  name="description"
                  disabled={isPending}
                  rows={3}
                  className={cn(
                    "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
                    "border-input min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs",
                    "focus-visible:border-ring focus-visible:ring-ring/50 transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
                    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                />
              </div>
              <DialogFooter className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={isPending}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "جارٍ الحفظ..." : "حفظ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {chapters.length === 0 ? (
        <p className="text-muted-foreground text-sm">لم تتم إضافة فصول بعد.</p>
      ) : (
        <ul className="space-y-3">
          {chapters.map(chapter => (
            <li
              key={chapter.id}
              className="bg-card rounded-lg border p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded text-xs font-semibold">
                      {chapter.sequence}
                    </span>
                    <h3 className="font-semibold">{chapter.title}</h3>
                  </div>
                  {chapter.description && (
                    <p className="text-muted-foreground text-sm">
                      {chapter.description}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    المحتوى:{" "}
                    {new Intl.NumberFormat("ar-SA-u-nu-latn").format(
                      chapter._count?.content ?? 0
                    )}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`إجراءات الفصل ${chapter.title}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-right">
                    <DropdownMenuItem
                      onSelect={() => {
                        setTargetChapter(chapter);
                        setEditOpen(true);
                      }}
                    >
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => {
                        setTargetChapter(chapter);
                        setDeleteOpen(true);
                      }}
                    >
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editOpen}
        onOpenChange={open => {
          setEditOpen(open);
          if (!open) setTargetChapter(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الفصل</DialogTitle>
          </DialogHeader>
          <form
            key={targetChapter?.id ?? "edit"}
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault();
              if (!targetChapter) return;
              const form = event.currentTarget;
              const formData = new FormData(form);
              formData.set("subjectId", String(subjectId));
              handleUpdate(formData, form);
            }}
          >
            <input type="hidden" name="subjectId" value={subjectId} />
            <div className="space-y-2">
              <Label htmlFor="edit-chapter-title">عنوان الفصل</Label>
              <Input
                id="edit-chapter-title"
                name="title"
                required
                disabled={isPending}
                defaultValue={targetChapter?.title ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-chapter-sequence">الترتيب</Label>
              <Input
                id="edit-chapter-sequence"
                name="sequence"
                type="number"
                min="1"
                required
                disabled={isPending}
                defaultValue={targetChapter?.sequence ?? 1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-chapter-description">
                وصف مختصر (اختياري)
              </Label>
              <textarea
                id="edit-chapter-description"
                name="description"
                disabled={isPending}
                defaultValue={targetChapter?.description ?? ""}
                rows={3}
                className={cn(
                  "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
                  "border-input min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs",
                  "focus-visible:border-ring focus-visible:ring-ring/50 transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
                  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>
            <DialogFooter className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={open => {
          setDeleteOpen(open);
          if (!open) setTargetChapter(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف الفصل</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            هل أنت متأكد من حذف الفصل &quot;{targetChapter?.title}&quot;؟ سيتم
            حذف جميع المحتوى المرتبط به.
          </p>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "جارٍ الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
