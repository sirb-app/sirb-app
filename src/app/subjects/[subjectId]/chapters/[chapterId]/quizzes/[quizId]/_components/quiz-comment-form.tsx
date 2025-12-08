"use client";

import { createQuizComment } from "@/actions/quiz-comment.action";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const commentSchema = z.object({
  text: z
    .string()
    .min(1, "التعليق فارغ")
    .max(2000, "التعليق طويل جداً (الحد الأقصى 2000 حرف)"),
});

type CommentFormData = z.infer<typeof commentSchema>;

type QuizCommentFormProps = {
  readonly quizId: number;
  readonly parentCommentId?: number;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
  readonly placeholder?: string;
  readonly isAuthenticated: boolean;
  readonly onAddComment?: (text: string) => void;
};

export default function QuizCommentForm({
  quizId,
  parentCommentId,
  onSuccess,
  onCancel,
  placeholder = "أضف تعليقاً...",
  isAuthenticated,
  onAddComment,
}: QuizCommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      text: "",
    },
  });

  const onSubmit = async (data: CommentFormData) => {
    if (!isAuthenticated) {
      toast.info("يجب تسجيل الدخول للتعليق");
      return;
    }

    setIsSubmitting(true);

    try {
      const textValue = data.text;
      form.reset();
      onSuccess?.();
      onAddComment?.(textValue);

      await createQuizComment({
        quizId,
        text: textValue,
        parentCommentId,
      });

      toast.success("تم إضافة التعليق");
      router.refresh();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "يرجى الانتظار قبل إضافة تعليق آخر"
      ) {
        toast.error(error.message);
      } else {
        toast.error("فشل إضافة التعليق");
      }
      console.error("Comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-muted/50 text-muted-foreground rounded-lg border p-4 text-center text-sm">
        يجب تسجيل الدخول للتعليق
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={placeholder}
                  className="min-h-[2.5rem] resize-none"
                  rows={1}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                  {...field}
                  onChange={e => {
                    field.onChange(e);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "جاري النشر..." : "نشر"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
