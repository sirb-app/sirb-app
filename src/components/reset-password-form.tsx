"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const ResetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "يجب أن تكون كلمة المرور 8 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

type ResetPasswordFormProps = {
  token: string;
};

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const router = useRouter();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function handleSubmit(data: ResetPasswordFormData) {
    await resetPassword({
      newPassword: data.newPassword,
      token,
      fetchOptions: {
        onError: ctx => {
          toast.error(ctx.error.message);
        },
        onSuccess: () => {
          toast.success("تم إعادة تعيين كلمة المرور بنجاح");
          router.push("/auth/login");
        },
      },
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full space-y-4"
      >
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور الجديدة</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pr-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تأكيد كلمة المرور</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pr-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري إعادة التعيين...
            </>
          ) : (
            "إعادة تعيين كلمة المرور"
          )}
        </Button>
      </form>
    </Form>
  );
};
