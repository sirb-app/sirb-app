"use client";

import {
  createCollegeAction,
  deleteCollegeAction,
  updateCollegeAction,
} from "@/actions/university.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { slugify } from "@/lib/utils";
import { MoreVertical, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type UniversityWithColleges = Prisma.UniversityGetPayload<{
  include: {
    colleges: { include: { _count: { select: { subjects: true } } } };
  };
}>;

type College = UniversityWithColleges["colleges"][number];

interface CollegeManagerProps {
  universityId: number;
  universityCode: string;
  colleges: UniversityWithColleges["colleges"];
}

export function CollegeManager({
  universityId,
  universityCode,
  colleges,
}: CollegeManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetCollege, setTargetCollege] = useState<College | null>(null);

  const handleCreate = (formData: FormData, form: HTMLFormElement) => {
    startTransition(async () => {
      const res = await createCollegeAction(formData);
      if (!("error" in res) || res.error === null) {
        toast.success("تمت إضافة الكلية");
        form.reset();
        setCreateOpen(false);
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  const handleUpdate = (formData: FormData, form: HTMLFormElement) => {
    if (!targetCollege) return;
    startTransition(async () => {
      const res = await updateCollegeAction(targetCollege.id, formData);
      if (!("error" in res) || res.error === null) {
        toast.success("تم تحديث الكلية");
        form.reset();
        setEditOpen(false);
        setTargetCollege(null);
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = () => {
    if (!targetCollege) return;
    startTransition(async () => {
      const res = await deleteCollegeAction(targetCollege.id, universityId);
      if (!("error" in res) || res.error === null) {
        toast.success("تم حذف الكلية");
        setDeleteOpen(false);
        setTargetCollege(null);
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
          <h2 className="text-xl font-semibold">الكليات</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            أضف أو عدّل كليات الجامعة.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap" aria-label="إضافة كلية جديدة">
              <Plus className="ml-2 h-4 w-4" />
              إضافة كلية
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>كلية جديدة</DialogTitle>
              <DialogDescription>أدخل معلومات الكلية.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={event => {
                event.preventDefault();
                const form = event.currentTarget;
                const formData = new FormData(form);
                formData.set("universityId", String(universityId));
                handleCreate(formData, form);
              }}
            >
              <input type="hidden" name="universityId" value={universityId} />
              <div className="space-y-2">
                <Label htmlFor="new-college-name">اسم الكلية</Label>
                <Input
                  id="new-college-name"
                  name="name"
                  required
                  disabled={isPending}
                  autoFocus
                  placeholder="مثال: كلية الهندسة"
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

      {colleges.length === 0 ? (
        <p className="text-muted-foreground text-sm">لا توجد كليات بعد.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colleges.map(college => {
            const slug = slugify(college.name);
            return (
              <li
                key={college.id}
                className="bg-card rounded-lg border p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/universities/${encodeURIComponent(
                      universityCode
                    )}/colleges/${encodeURIComponent(slug)}`}
                    className="group min-w-0 flex-1"
                    aria-label={`عرض الكلية ${college.name}`}
                  >
                    <h3 className="leading-6 font-medium group-hover:underline">
                      {college.name}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      المواد:{" "}
                      {new Intl.NumberFormat("ar-SA-u-nu-latn").format(
                        college._count?.subjects ?? 0
                      )}
                    </p>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`إجراءات الكلية ${college.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-right">
                      <DropdownMenuItem
                        onSelect={() => {
                          setTargetCollege(college);
                          setEditOpen(true);
                        }}
                      >
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => {
                          setTargetCollege(college);
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
          if (!open) setTargetCollege(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الكلية</DialogTitle>
            <DialogDescription>قم بتحديث اسم الكلية.</DialogDescription>
          </DialogHeader>
          <form
            key={targetCollege?.id ?? "edit"}
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault();
              if (!targetCollege) return;
              const form = event.currentTarget;
              const formData = new FormData(form);
              formData.set("universityId", String(universityId));
              handleUpdate(formData, form);
            }}
          >
            <input type="hidden" name="universityId" value={universityId} />
            <div className="space-y-2">
              <Label htmlFor="edit-college-name">اسم الكلية</Label>
              <Input
                id="edit-college-name"
                name="name"
                required
                disabled={isPending}
                defaultValue={targetCollege?.name ?? ""}
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
          if (!open) setTargetCollege(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف الكلية</DialogTitle>
            <DialogDescription>
              هل أنت متأكد أنك تريد حذف الكلية {targetCollege?.name}؟ هذا
              الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
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
