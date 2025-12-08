"use client";

import { createQuiz } from "@/actions/quiz-manage.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const createQuizSchema = z.object({
  title: z
    .string()
    .min(3, "عنوان الاختبار يجب أن يكون 3 أحرف على الأقل")
    .max(100, "عنوان الاختبار طويل جداً (الحد الأقصى 100 حرف)"),
  description: z
    .string()
    .max(500, "الوصف طويل جداً (الحد الأقصى 500 حرف)")
    .optional(),
});

type CreateQuizFormData = z.infer<typeof createQuizSchema>;

type CreateQuizModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
};

export default function CreateQuizModal({
  isOpen,
  onClose,
  chapterId,
}: CreateQuizModalProps) {
  const router = useRouter();

  const form = useForm<CreateQuizFormData>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (data: CreateQuizFormData) => {
    try {
      const result = await createQuiz({
        title: data.title,
        description: data.description,
        chapterId,
      });

      if (result.success) {
        toast.success("تم إنشاء الاختبار");
        form.reset();
        router.push(`/manage/quiz/${result.quizId}`);
      }
    } catch {
      toast.error("حدث خطأ أثناء إنشاء الاختبار");
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة اختبار جديد</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    عنوان الاختبار <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: اختبار الفصل الأول"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف مختصر (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="اكتب نبذة عن محتوى الاختبار..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "جاري الإنشاء..." : "إنشاء"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
