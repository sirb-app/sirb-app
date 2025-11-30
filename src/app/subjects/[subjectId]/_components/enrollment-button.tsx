"use client";

import { toggleEnrollment } from "@/actions/enrollment.action";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type EnrollmentButtonProps = {
  readonly subjectId: number;
  readonly initialIsEnrolled: boolean;
  readonly isAuthenticated: boolean;
};

export default function EnrollmentButton({
  subjectId,
  initialIsEnrolled,
  isAuthenticated,
}: EnrollmentButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEnrolled, setIsEnrolled] = useState(initialIsEnrolled);

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.info("يجب تسجيل الدخول للتسجيل في المقرر", {
        description: "سجل دخولك للوصول إلى هذه الميزة",
        action: {
          label: "تسجيل الدخول",
          onClick: () => router.push("/auth/login"),
        },
      });
      return;
    }

    const previousState = isEnrolled;
    setIsEnrolled(!previousState);

    startTransition(async () => {
      try {
        const result = await toggleEnrollment(subjectId);

        if (result.success) {
          setIsEnrolled(result.isEnrolled ?? false);

          if (result.isEnrolled) {
            toast.success("تم التسجيل في المقرر بنجاح");
          } else {
            toast.success("تم إلغاء التسجيل من المقرر");
          }

          router.refresh();
        } else {
          setIsEnrolled(previousState);
          toast.error(result.error || "حدث خطأ");
        }
      } catch (error) {
        setIsEnrolled(previousState);
        toast.error("حدث خطأ أثناء تحديث التسجيل");
        console.error("Enrollment error:", error);
      }
    });
  };

  return (
    <Button
      size="lg"
      variant={isEnrolled ? "destructive" : "accent"}
      className="w-full md:w-auto"
      onClick={handleClick}
      disabled={isPending}
    >
      {isEnrolled ? "إلغاء التسجيل" : "التسجيل في المقرر"}
    </Button>
  );
}
