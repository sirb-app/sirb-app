"use client";

import {
  deleteCollegeAction,
  updateCollegeAction,
} from "@/actions/university.actions";
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
import { slugify } from "@/lib/utils";
import { MoreVertical, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface CollegeHeaderActionsProps {
  collegeId: number;
  universityId: number;
  universityCode: string;
  initialName: string;
}

export function CollegeHeaderActions({
  collegeId,
  universityId,
  universityCode,
  initialName,
}: CollegeHeaderActionsProps) {
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
        let nextSlug: string | null = null;
        if (typeof nextName === "string") {
          const trimmed = nextName.trim();
          setCurrentName(trimmed);
          nextSlug = slugify(trimmed);
        }
        toast.success("تم تحديث الكلية");
        setEditOpen(false);
        if (nextSlug) {
          router.push(
            `/admin/universities/${encodeURIComponent(
              universityCode
            )}/colleges/${encodeURIComponent(nextSlug)}`
          );
        } else {
          router.refresh();
        }
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
        router.push(
          `/admin/universities/${encodeURIComponent(universityCode)}`
        );
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-1" dir="rtl">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            aria-label="تعديل اسم الكلية"
            disabled={isPending}
          >
            <PenLine className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل اسم الكلية</DialogTitle>
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            aria-label="المزيد من خيارات الكلية"
            disabled={isPending}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-right">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={event => {
              event.preventDefault();
              setDeleteOpen(true);
            }}
          >
            حذف الكلية
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد حذف الكلية</DialogTitle>
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
              {isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
