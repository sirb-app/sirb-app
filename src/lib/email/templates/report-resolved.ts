import type { ReportedContentType, ReportResolvedData } from "../email.types";
import { baseTemplate, COLORS } from "./base-template";

function getReportedContentTypeArabic(type: ReportedContentType): string {
  switch (type) {
    case "CANVAS":
      return "اللوحة";
    case "QUIZ":
      return "الاختبار";
    case "COMMENT":
      return "التعليق";
    case "QUIZ_COMMENT":
      return "التعليق";
    default:
      return "المحتوى";
  }
}

export function reportResolvedTemplate(data: ReportResolvedData): string {
  const contentTypeArabic = getReportedContentTypeArabic(
    data.reportedContentType
  );
  const isResolved = data.resolution === "RESOLVED";

  const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${COLORS.foreground};line-height:1.4;">
      تم مراجعة بلاغك
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      مرحباً ${data.recipientName}،
    </p>
    ${
      isResolved
        ? `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
        شكراً لك على الإبلاغ عن ${contentTypeArabic}${data.reportedContentTitle ? ` "<strong>${data.reportedContentTitle}</strong>"` : ""}.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
        تم مراجعة بلاغك واتخاذ الإجراءات اللازمة. مساهمتك تساعدنا في الحفاظ على جودة المحتوى وسلامة المجتمع.
      </p>
      <div style="margin:24px 0;padding:20px;background-color:#dcfce7;border-radius:8px;text-align:center;">
        <p style="margin:0;font-size:16px;font-weight:600;color:${COLORS.success};">
          شكراً لمساعدتنا في تحسين المنصة!
        </p>
      </div>
    `
        : `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
        شكراً لك على الإبلاغ عن ${contentTypeArabic}${data.reportedContentTitle ? ` "<strong>${data.reportedContentTitle}</strong>"` : ""}.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
        بعد مراجعة بلاغك، تبين أن المحتوى لا ينتهك سياسات المنصة. نقدر اهتمامك بجودة المحتوى.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
        إذا كانت لديك أي استفسارات، لا تتردد في التواصل معنا.
      </p>
    `
    }
    <p style="margin:24px 0 0;font-size:14px;color:${COLORS.mutedForeground};line-height:1.6;">
      نشكرك على مساهمتك في الحفاظ على مجتمع سرب آمناً ومفيداً للجميع.
    </p>
  `;

  return baseTemplate({
    title: "تم مراجعة بلاغك - سرب",
    preheader: isResolved
      ? "شكراً لمساعدتنا في تحسين المنصة"
      : "تم مراجعة البلاغ الذي قدمته",
    content,
  });
}
