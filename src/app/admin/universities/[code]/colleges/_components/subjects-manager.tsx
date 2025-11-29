"use client";

import {
  createSubjectAction,
  deleteSubjectAction,
  updateSubjectAction,
} from "@/actions/subject.actions";
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
import { BookMarked, MoreVertical, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const chaptersLabel = (count: number) => {
  if (count === 0) return "بدون فصول";
  if (count === 1) return "فصل واحد";
  if (count === 2) return "فصلان";
  if (count <= 10) return `${count} فصول`;
  return `${count} فصل`;
};

type SubjectWithCounts = Prisma.SubjectGetPayload<{
  include: { _count: { select: { chapters: true } } };
}>;

interface SubjectsManagerProps {
  collegeId: number;
  universityCode: string;
  collegeSlug: string;
  subjects: SubjectWithCounts[];
}

export function SubjectsManager({
  collegeId,
  universityCode,
  collegeSlug,
  subjects,
}: SubjectsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetSubject, setTargetSubject] = useState<SubjectWithCounts | null>(
    null
  );

  const handleCreate = (formData: FormData, form: HTMLFormElement) => {
    const code = formData.get("code");
    if (typeof code === "string") {
      formData.set("code", code.toUpperCase());
    }
    startTransition(async () => {
      const res = await createSubjectAction(formData);
      if (res.error === null) {
        toast.success("تمت إضافة المادة");
        form.reset();
        setCreateOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleUpdate = (formData: FormData, form: HTMLFormElement) => {
    if (!targetSubject) return;
    const code = formData.get("code");
    if (typeof code === "string") {
      formData.set("code", code.toUpperCase());
    }
    startTransition(async () => {
      const res = await updateSubjectAction(targetSubject.id, formData);
      if (res.error === null) {
        toast.success("تم تحديث المادة");
        form.reset();
        setEditOpen(false);
        setTargetSubject(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = () => {
    if (!targetSubject) return;
    startTransition(async () => {
      const res = await deleteSubjectAction(targetSubject.id, collegeId);
      if (res.error === null) {
        toast.success("تم حذف المادة");
        setDeleteOpen(false);
        setTargetSubject(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">المواد</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap" aria-label="إضافة مادة جديدة">
              <Plus className="ml-2 h-4 w-4" />
              إضافة مادة
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>مادة جديدة</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={event => {
                event.preventDefault();
                const form = event.currentTarget;
                const formData = new FormData(form);
                formData.set("collegeId", String(collegeId));
                handleCreate(formData, form);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="new-subject-name">اسم المادة</Label>
                <Input
                  id="new-subject-name"
                  name="name"
                  required
                  disabled={isPending}
                  placeholder="مثال: مقدمة في البرمجة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-subject-code">كود المادة</Label>
                <Input
                  id="new-subject-code"
                  name="code"
                  required
                  disabled={isPending}
                  className="uppercase"
                  pattern="[A-Za-z0-9]+"
                  title="استخدم حروف إنجليزية وأرقام فقط بدون مسافات"
                  placeholder="مثال: CS101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-subject-description">
                  وصف مختصر (اختياري)
                </Label>
                <textarea
                  id="new-subject-description"
                  name="description"
                  disabled={isPending}
                  placeholder="وصف يساعد الطلبة على فهم محتوى المادة"
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

      {subjects.length === 0 ? (
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-8 text-center">
          <BookMarked className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <h3 className="mb-1 font-semibold">لا توجد مواد</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            ابدأ بإضافة أول مادة لهذه الكلية
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            variant="outline"
            size="sm"
          >
            إضافة أول مادة
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {subjects.map(subject => {
            return (
              <li
                key={subject.id}
                className="bg-card rounded-lg border p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/universities/${encodeURIComponent(universityCode)}/colleges/${encodeURIComponent(collegeSlug)}/subjects/${encodeURIComponent(subject.code)}`}
                    className="group min-w-0 flex-1 space-y-2"
                    aria-label={`عرض تفاصيل المادة ${subject.name}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg leading-6 font-semibold group-hover:underline">
                        {subject.name}
                      </h3>
                      <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs font-medium uppercase">
                        {subject.code}
                      </span>
                    </div>
                    {subject.description ? (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {subject.description}
                      </p>
                    ) : null}
                    <p className="text-muted-foreground text-xs">
                      {chaptersLabel(subject._count?.chapters ?? 0)}
                    </p>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`إجراءات المادة ${subject.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-right">
                      <DropdownMenuItem
                        onSelect={() => {
                          setTargetSubject(subject);
                          setEditOpen(true);
                        }}
                      >
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => {
                          setTargetSubject(subject);
                          setDeleteOpen(true);
                        }}
                      >
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={editOpen}
        onOpenChange={open => {
          setEditOpen(open);
          if (!open) setTargetSubject(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المادة</DialogTitle>
          </DialogHeader>
          <form
            key={targetSubject?.id ?? "edit"}
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault();
              if (!targetSubject) return;
              const form = event.currentTarget;
              const formData = new FormData(form);
              formData.set("collegeId", String(collegeId));
              handleUpdate(formData, form);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-subject-name">اسم المادة</Label>
              <Input
                id="edit-subject-name"
                name="name"
                required
                disabled={isPending}
                defaultValue={targetSubject?.name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject-code">كود المادة</Label>
              <Input
                id="edit-subject-code"
                name="code"
                required
                disabled={isPending}
                defaultValue={targetSubject?.code ?? ""}
                className="uppercase"
                pattern="[A-Za-z0-9]+"
                title="استخدم حروف إنجليزية وأرقام فقط بدون مسافات"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject-description">
                وصف مختصر (اختياري)
              </Label>
              <textarea
                id="edit-subject-description"
                name="description"
                disabled={isPending}
                defaultValue={targetSubject?.description ?? ""}
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
          if (!open) setTargetSubject(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف المادة</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            هل أنت متأكد من حذف مادة &quot;{targetSubject?.name}&quot;؟ سيتم حذف
            جميع الفصول والمحتوى المرتبط بها.
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
