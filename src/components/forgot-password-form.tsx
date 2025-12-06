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
import { forgetPassword } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const ForgotPasswordSchema = z.object({
  email: z.email("يرجى إدخال بريد إلكتروني صالح"),
});

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export const ForgotPasswordForm = () => {
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function handleSubmit(data: ForgotPasswordFormData) {
    await forgetPassword({
      ...data,
      redirectTo: "/auth/reset-password",
      fetchOptions: {
        onError: ctx => {
          toast.error(ctx.error.message);
        },
        onSuccess: () => {
          toast.success("تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني!", {
            duration: 6000,
          });
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    type="email"
                    placeholder="example@email.com"
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
              جاري الإرسال...
            </>
          ) : (
            "إرسال رابط إعادة التعيين"
          )}
        </Button>
      </form>
    </Form>
  );
};
