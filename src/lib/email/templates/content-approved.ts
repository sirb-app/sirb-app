import type { ContentDecisionData, ContentType } from "../email.types";
import { baseTemplate, COLORS, ctaButton } from "./base-template";

function getContentTypeArabic(contentType: ContentType): string {
  return contentType === "CANVAS" ? "لوحتك" : "اختبارك";
}

function buildContentUrl(data: ContentDecisionData): string {
  const baseUrl = process.env.BETTER_AUTH_URL || "";
  if (data.contentType === "CANVAS") {
    return `${baseUrl}/subjects/${data.subjectId}/chapters/${data.chapterId}/canvases/${data.contentId}`;
  }
  return `${baseUrl}/subjects/${data.subjectId}/chapters/${data.chapterId}/quizzes/${data.contentId}`;
}

export function contentApprovedTemplate(data: ContentDecisionData): string {
  const contentTypeArabic = getContentTypeArabic(data.contentType);
  const contentUrl = buildContentUrl(data);

  const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${COLORS.foreground};line-height:1.4;">
      تهانينا! تم قبول ${contentTypeArabic}
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      مرحباً ${data.recipientName}،
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      يسعدنا إبلاغك بأن ${contentTypeArabic} "<strong>${data.contentTitle}</strong>" قد تم قبولها ونشرها بنجاح.
    </p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      شكراً لمساهمتك القيّمة في إثراء محتوى مادة <strong>${data.subjectName}</strong>! مساهمتك تساعد زملاءك الطلاب في التعلم.
    </p>
    ${ctaButton(`عرض ${contentTypeArabic}`, contentUrl)}
  `;

  return baseTemplate({
    title: `تم قبول ${contentTypeArabic} - سرب`,
    preheader: `تهانينا! ${contentTypeArabic} "${data.contentTitle}" متاحة الآن للجميع`,
    content,
  });
}
