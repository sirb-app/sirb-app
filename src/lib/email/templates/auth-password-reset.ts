import { baseTemplate, COLORS, ctaButton } from "./base-template";

type AuthPasswordResetData = {
  resetUrl: string;
};

export function authPasswordResetTemplate({
  resetUrl,
}: AuthPasswordResetData): string {
  const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${COLORS.foreground};line-height:1.4;">
      استعادة كلمة المرور
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في سرب.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:
    </p>
    ${ctaButton("إعادة تعيين كلمة المرور", resetUrl)}
    <p style="margin:24px 0 0;font-size:14px;color:${COLORS.mutedForeground};line-height:1.6;">
      إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان. ستبقى كلمة مرورك الحالية كما هي.
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:${COLORS.mutedForeground};line-height:1.6;">
      إذا لم يعمل الزر، انسخ الرابط التالي والصقه في متصفحك:
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:${COLORS.primary};word-break:break-all;direction:ltr;text-align:left;">
      ${resetUrl}
    </p>
  `;

  return baseTemplate({
    title: "استعادة كلمة المرور - سرب",
    preheader: "طلب إعادة تعيين كلمة المرور لحسابك في سرب",
    content,
  });
}
