import type {
  ReportNotificationData,
  ReportedContentType,
} from "../email.types";
import { COLORS, baseTemplate, ctaButton, infoBox } from "./base-template";

function getReportedContentTypeArabic(type: ReportedContentType): string {
  switch (type) {
    case "CANVAS":
      return "لوحة";
    case "QUIZ":
      return "اختبار";
    case "COMMENT":
      return "تعليق";
    case "QUIZ_COMMENT":
      return "تعليق على اختبار";
    default:
      return "محتوى";
  }
}

function translateReportReason(reason: string): string {
  const translations: Record<string, string> = {
    SPAM: "محتوى مزعج",
    INAPPROPRIATE: "محتوى غير لائق",
    WRONG_INFO: "معلومات خاطئة",
    HARASSMENT: "تحرش أو إساءة",
    COPYRIGHT: "انتهاك حقوق النشر",
    OTHER: "أخرى",
  };
  return translations[reason] || reason;
}

export function reportSubmittedTemplate(data: ReportNotificationData): string {
  const contentTypeArabic = getReportedContentTypeArabic(
    data.reportedContentType
  );
  const reviewUrl = `${process.env.BETTER_AUTH_URL || ""}/subjects/${data.subjectId}/moderation`;

  const infoItems = [
    { label: "المادة", value: data.subjectName },
    { label: "نوع المحتوى", value: contentTypeArabic },
    { label: "سبب البلاغ", value: translateReportReason(data.reportReason) },
    { label: "مقدم البلاغ", value: data.reporterName },
  ];

  if (data.reportedContentTitle) {
    infoItems.splice(2, 0, {
      label: "العنوان",
      value: data.reportedContentTitle,
    });
  }

  const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${COLORS.foreground};line-height:1.4;">
      بلاغ جديد بانتظار المراجعة
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      تم تقديم بلاغ جديد على ${contentTypeArabic} في مادة <strong>${data.subjectName}</strong>.
    </p>
    ${infoBox(infoItems)}
    ${
      data.reportDescription
        ? `
      <div style="margin:16px 0;padding:16px;background-color:${COLORS.background};border-radius:8px;">
        <p style="margin:0 0 8px;font-size:13px;color:${COLORS.mutedForeground};">تفاصيل إضافية:</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.foreground};">${data.reportDescription}</p>
      </div>
    `
        : ""
    }
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      يرجى مراجعة البلاغ واتخاذ الإجراء المناسب.
    </p>
    ${ctaButton("مراجعة البلاغ", reviewUrl)}
  `;

  return baseTemplate({
    title: `بلاغ جديد - ${data.subjectName}`,
    preheader: `بلاغ جديد على ${contentTypeArabic} في ${data.subjectName}`,
    content,
  });
}
