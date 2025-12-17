import type { ContentDecisionData, ContentType } from "../email.types";
import { baseTemplate, COLORS, ctaButton, rejectionBox } from "./base-template";

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

export function contentRejectedTemplate(data: ContentDecisionData): string {
  const contentTypeArabic = getContentTypeArabic(data.contentType);
  const contentUrl = buildContentUrl(data);

  const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${COLORS.foreground};line-height:1.4;">
      ${contentTypeArabic} تحتاج إلى تعديلات
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      مرحباً ${data.recipientName}،
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      نشكرك على مساهمتك في مادة <strong>${data.subjectName}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      للأسف، ${contentTypeArabic} "<strong>${data.contentTitle}</strong>" تحتاج إلى بعض التعديلات قبل نشرها.
    </p>
    ${data.rejectionReason ? rejectionBox(data.rejectionReason) : ""}
    <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      يمكنك تعديل المحتوى بناءً على الملاحظات أعلاه وإعادة تقديمه للمراجعة. نحن نقدر جهودك!
    </p>
    ${ctaButton(`تعديل ${contentTypeArabic}`, contentUrl)}
  `;

  return baseTemplate({
    title: `مراجعة ${contentTypeArabic} - سرب`,
    preheader: `${contentTypeArabic} "${data.contentTitle}" تحتاج إلى تعديلات`,
    content,
  });
}
