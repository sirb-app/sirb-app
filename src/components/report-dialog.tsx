"use client";

import { reportCanvas, reportComment } from "@/actions/report.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ReportReason } from "@/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const reasonLabels: Record<ReportReason, string> = {
  SPAM: "رسائل مزعجة أو غير مرغوبة",
  INAPPROPRIATE: "محتوى غير لائق",
  WRONG_INFO: "معلومات خاطئة",
  HARASSMENT: "مضايقة أو تنمر",
  COPYRIGHT: "انتهاك حقوق الطبع",
  OTHER: "أخرى",
};

const reportSchema = z.object({
  reason: z.enum(ReportReason, {
    message: "يرجى اختيار السبب",
  }),
  description: z
    .string()
    .max(500, "التفاصيل طويلة جداً (الحد الأقصى 500 حرف)")
    .optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

type ReportDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly type: "canvas" | "comment";
  readonly targetId: number;
};

export default function ReportDialog({
  open,
  onOpenChange,
  type,
  targetId,
}: ReportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    mode: "onSubmit",
    defaultValues: {
      description: "",
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);

    try {
      if (type === "canvas") {
        await reportCanvas(targetId, data.reason, data.description);
      } else {
        await reportComment(targetId, data.reason, data.description);
      }

      toast.success("تم إرسال البلاغ");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      if (error instanceof Error && error.message === "تم الإبلاغ مسبقاً") {
        toast.error("تم الإبلاغ مسبقاً");
      } else {
        toast.error("فشل إرسال البلاغ");
      }
      console.error("Report error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        if (!open) {
          form.reset();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent
        dir="rtl"
        className="[&>button]:right-auto [&>button]:left-4"
      >
        <DialogHeader className="!text-right">
          <DialogTitle>
            {type === "canvas" ? "الإبلاغ عن المحتوى" : "الإبلاغ عن التعليق"}
          </DialogTitle>
          <DialogDescription>
            يرجى تحديد سبب الإبلاغ وإضافة أي تفاصيل إضافية
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>السبب *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر السبب" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(reasonLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التفاصيل (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أضف أي تفاصيل إضافية..."
                      className="resize-none"
                      rows={4}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الإرسال..." : "إرسال البلاغ"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
