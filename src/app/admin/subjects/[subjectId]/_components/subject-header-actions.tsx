"use client";

import { updateSubjectAction } from "@/actions/subject.actions";
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
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface SubjectHeaderActionsProps {
  subjectId: number;
  collegeId: number;
  initialName: string;
  initialCode: string;
  initialDescription: string | null;
}

export function SubjectHeaderActions({
  subjectId,
  collegeId,
  initialName,
  initialCode,
  initialDescription,
}: SubjectHeaderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const handleUpdate = (formData: FormData, form: HTMLFormElement) => {
    const code = formData.get("code");
    if (typeof code === "string") {
      formData.set("code", code.toUpperCase());
    }
    startTransition(async () => {
      const res = await updateSubjectAction(subjectId, formData);
      if (res.error === null) {
        toast.success("تم تحديث المادة");
        form.reset();
        setEditOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="تعديل المادة"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل المادة</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={event => {
            event.preventDefault();
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
              defaultValue={initialName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-subject-code">كود المادة</Label>
            <Input
              id="edit-subject-code"
              name="code"
              required
              disabled={isPending}
              defaultValue={initialCode}
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
              defaultValue={initialDescription ?? ""}
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
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
