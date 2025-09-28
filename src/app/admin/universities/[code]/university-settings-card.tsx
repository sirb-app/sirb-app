"use client";

import { updateUniversityAction } from "@/actions/university.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface UniversitySettingsCardProps {
  universityId: number;
  name: string;
  code: string;
}

export function UniversitySettingsCard({
  universityId,
  name,
  code,
}: UniversitySettingsCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <section className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-xl font-semibold">إعدادات الجامعة</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          حدّث بيانات الجامعة الأساسية.
        </p>
      </div>
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <form
          className="space-y-4"
          onSubmit={event => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            startTransition(async () => {
              const res = await updateUniversityAction(universityId, formData);
              if (!("error" in res) || res.error === null) {
                toast.success("تم تحديث بيانات الجامعة");
                router.refresh();
              } else if (res.error) {
                toast.error(res.error);
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
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
