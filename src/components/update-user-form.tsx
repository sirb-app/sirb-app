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
import { updateUser } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const UpdateUserSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  image: z.url("يرجى إدخال رابط صورة صالح").optional().or(z.literal("")),
});

type UpdateUserFormData = z.infer<typeof UpdateUserSchema>;

type UpdateUserFormProps = {
  name: string;
  image: string;
};

export const UpdateUserForm = ({ name, image }: UpdateUserFormProps) => {
  const router = useRouter();

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      name: name,
      image: image,
    },
  });

  async function handleSubmit(data: UpdateUserFormData) {
    await updateUser({
      name: data.name,
      image: data.image || "",
      fetchOptions: {
        onSuccess: () => {
          toast.success("تم تحديث الملف الشخصي بنجاح");
          router.refresh();
        },
        onError: ctx => {
          toast.error(ctx.error.message || "فشل تحديث الملف الشخصي");
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  <Input placeholder="أدخل اسمك" className="pr-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رابط الصورة</FormLabel>
              <FormControl>
                <div className="relative">
                  <ImageIcon className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="https://example.com/image.jpg"
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
              جاري التحديث...
            </>
          ) : (
            "تحديث الملف الشخصي"
          )}
        </Button>
      </form>
    </Form>
  );
};
