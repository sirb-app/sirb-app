import { baseTemplate, COLORS, ctaButton } from "./base-template";

type AuthVerificationData = {
  verificationUrl: string;
};

export function authVerificationTemplate({
  verificationUrl,
}: AuthVerificationData): string {
  const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${COLORS.foreground};line-height:1.4;">
      تأكيد بريدك الإلكتروني
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      شكراً لتسجيلك في سرب!
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      يرجى تأكيد بريدك الإلكتروني لإكمال التسجيل والبدء في استخدام المنصة.
    </p>
    ${ctaButton("تأكيد البريد الإلكتروني", verificationUrl)}
    <p style="margin:24px 0 0;font-size:14px;color:${COLORS.mutedForeground};line-height:1.6;">
      إذا لم تقم بإنشاء حساب في سرب، يمكنك تجاهل هذه الرسالة بأمان.
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:${COLORS.mutedForeground};line-height:1.6;">
      إذا لم يعمل الزر، انسخ الرابط التالي والصقه في متصفحك:
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:${COLORS.primary};word-break:break-all;direction:ltr;text-align:left;">
      ${verificationUrl}
    </p>
  `;

  return baseTemplate({
    title: "تأكيد البريد الإلكتروني - سرب",
    preheader: "تأكيد بريدك الإلكتروني لإكمال التسجيل في سرب",
    content,
  });
}
