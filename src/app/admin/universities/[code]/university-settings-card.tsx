"use client";

import { updateUniversityAction } from "@/actions/university.actions";
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
import { PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface UniversityHeaderActionsProps {
  universityId: number;
  name: string;
  code: string;
}

export function UniversityHeaderActions({
  universityId,
  name,
  code,
}: UniversityHeaderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="تعديل بيانات الجامعة"
          disabled={isPending}
        >
          <PenLine className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الجامعة</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={event => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              try {
                const res = await updateUniversityAction(
                  universityId,
                  formData
                );
                if (res.error === null) {
                  toast.success("تم تحديث بيانات الجامعة");
                  setOpen(false);
                  router.refresh();
                } else {
                  toast.error(res.error || "حدث خطأ");
                }
              } catch {
                toast.error("فشل الاتصال بالخادم");
              }
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="university-name">اسم الجامعة</Label>
              <Input
                id="university-name"
                name="name"
                defaultValue={name}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="university-code">كود الجامعة</Label>
              <Input
                id="university-code"
                name="code"
                defaultValue={code}
                required
                disabled={isPending}
                className="uppercase"
                pattern="[A-Za-z0-9]+"
                title="استخدم حروف إنجليزية وأرقام فقط بدون مسافات"
              />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
  );
}
