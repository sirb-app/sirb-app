import type { ContentType, ModeratorNotificationData } from "../email.types";
import { baseTemplate, COLORS, ctaButton, infoBox } from "./base-template";

function getContentTypeArabic(contentType: ContentType): string {
  return contentType === "CANVAS" ? "لوحة" : "اختبار";
}

export function submissionPendingTemplate(
  data: ModeratorNotificationData
): string {
  const contentTypeArabic = getContentTypeArabic(data.contentType);
  const reviewUrl = `${process.env.BETTER_AUTH_URL || ""}/subjects/${data.subjectId}/moderation`;

  const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${COLORS.foreground};line-height:1.4;">
      محتوى جديد بانتظار المراجعة
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      قام <strong>${data.contributorName}</strong> بتقديم ${contentTypeArabic} جديدة للمراجعة في مادة <strong>${data.subjectName}</strong>.
    </p>
    ${infoBox([
      { label: "المادة", value: data.subjectName },
      { label: "الفصل", value: data.chapterTitle },
      { label: "العنوان", value: data.contentTitle },
      { label: "المساهم", value: data.contributorName },
    ])}
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${COLORS.foreground};">
      يرجى مراجعة المحتوى واتخاذ الإجراء المناسب.
    </p>
    ${ctaButton("مراجعة المحتوى", reviewUrl)}
  `;

  return baseTemplate({
    title: `محتوى جديد للمراجعة - ${data.subjectName}`,
    preheader: `${data.contributorName} قدّم ${contentTypeArabic} جديدة في ${data.subjectName}`,
    content,
  });
}
