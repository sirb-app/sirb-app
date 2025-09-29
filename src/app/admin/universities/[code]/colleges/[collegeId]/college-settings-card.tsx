"use client";

import { deleteCollegeAction, updateCollegeAction } from "@/actions/university.actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface CollegeSettingsCardProps {
  collegeId: number;
  universityId: number;
  universityCode: string;
  initialName: string;
}

export function CollegeSettingsCard({
  collegeId,
  universityId,
  universityCode,
  initialName,
}: CollegeSettingsCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentName, setCurrentName] = useState(initialName);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setCurrentName(initialName);
  }, [initialName]);

  const handleUpdate = (formData: FormData) => {
    const nextName = formData.get("name");
    startTransition(async () => {
      const res = await updateCollegeAction(collegeId, formData);
      if (!("error" in res) || res.error === null) {
        if (typeof nextName === "string") {
          setCurrentName(nextName.trim());
        }
        toast.success("تم تحديث الكلية");
        setEditOpen(false);
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteCollegeAction(collegeId, universityId);
      if (!("error" in res) || res.error === null) {
        toast.success("تم حذف الكلية");
        setDeleteOpen(false);
        router.push(`/admin/universities/${encodeURIComponent(universityCode)}`);
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm" dir="rtl">
      <h2 className="text-lg font-semibold">إجراءات سريعة</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        الاسم الحالي: <span className="font-medium text-foreground">{currentName}</span>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
            >
              تعديل الاسم
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل اسم الكلية</DialogTitle>
              <DialogDescription>
                حدّث اسم الكلية وسيتم حفظ التغييرات فورًا.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={event => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                formData.set("universityId", String(universityId));
                handleUpdate(formData);
              }}
            >
              <input type="hidden" name="universityId" value={universityId} />
              <div className="space-y-2">
                <Label htmlFor="college-name">اسم الكلية</Label>
                <Input
                  id="college-name"
                  name="name"
                  defaultValue={currentName}
                  key={currentName}
                  required
                  disabled={isPending}
                  autoFocus
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
          disabled={isPending}
        >
          حذف الكلية
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد أنك تريد حذف هذه الكلية؟ هذا الإجراء لا يمكن التراجع عنه.
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
    </div>
  );
}
