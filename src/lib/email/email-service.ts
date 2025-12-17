import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import resend from "@/lib/resend";
import {
  recordNotificationSent,
  shouldSendNotification,
} from "./email-rate-limit";
import type {
  ContentDecisionData,
  ModeratorNotificationData,
  ReportNotificationData,
  ReportResolvedData,
} from "./email.types";
import {
  contentApprovedTemplate,
  contentRejectedTemplate,
  reportResolvedTemplate,
  reportSubmittedTemplate,
  submissionPendingTemplate,
} from "./templates";

const FROM_ADDRESS = "Sirb <no-reply@sirb-app.com>";

/**
 * Low-level email sending function.
 * Returns true if email was sent successfully, false otherwise.
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const recipients = Array.isArray(to) ? to : [to];

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    return false;
  }
}

/**
 * Get all moderators for a subject (subject moderators + global admins).
 * Returns unique list of users with their email and name.
 */
async function getModeratorsForSubject(subjectId: number): Promise<
  Array<{
    id: string;
    email: string;
    name: string;
  }>
> {
  // Get subject-specific moderators
  const subjectModerators = await prisma.subjectModerator.findMany({
    where: { subjectId },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  // Get global admins
  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true, email: true, name: true },
  });

  // Combine and deduplicate by user ID
  const allModerators = [...subjectModerators.map(m => m.user), ...admins];

  const uniqueModerators = [
    ...new Map(allModerators.map(m => [m.id, m])).values(),
  ];

  return uniqueModerators;
}

/**
 * Notify all moderators of a new submission pending review.
 * Includes rate limiting to prevent spam from rapid submit/withdraw cycles.
 */
export async function notifyModeratorsOfSubmission(
  data: ModeratorNotificationData
): Promise<void> {
  // Check rate limit first
  const shouldSend = await shouldSendNotification(
    "SUBMISSION_PENDING",
    data.contentType,
    data.contentId
  );

  if (!shouldSend) {
    console.log(
      `[EmailService] Skipping duplicate submission notification for ${data.contentType} ${data.contentId} (cooldown active)`
    );
    return;
  }

  // Get all moderators for this subject
  const moderators = await getModeratorsForSubject(data.subjectId);

  if (moderators.length === 0) {
    console.log(
      `[EmailService] No moderators found for subject ${data.subjectId}`
    );
    return;
  }

  const html = submissionPendingTemplate(data);
  const subject = `محتوى جديد للمراجعة - ${data.subjectName}`;

  const emailAddresses = moderators.map(m => m.email);
  const success = await sendEmail(emailAddresses, subject, html);

  if (success) {
    // Record notification for rate limiting
    await recordNotificationSent(
      "SUBMISSION_PENDING",
      data.contentType,
      data.contentId,
      data.subjectId
    );
  }
}

/**
 * Notify a contributor that their content has been approved or rejected.
 */
export async function notifyContributorOfDecision(
  data: ContentDecisionData
): Promise<void> {
  const contentTypeArabic = data.contentType === "CANVAS" ? "لوحتك" : "اختبارك";

  const html =
    data.decision === "APPROVED"
      ? contentApprovedTemplate(data)
      : contentRejectedTemplate(data);

  const subject =
    data.decision === "APPROVED"
      ? `تم قبول ${contentTypeArabic} - ${data.subjectName}`
      : `مراجعة ${contentTypeArabic} - ${data.subjectName}`;

  await sendEmail(data.recipientEmail, subject, html);
}

/**
 * Notify all moderators of a new report.
 * Includes rate limiting to prevent spam.
 */
export async function notifyModeratorsOfReport(
  data: ReportNotificationData
): Promise<void> {
  // For reports, we use a composite key for rate limiting
  // We'll use the contentType and a hash of the report details
  const shouldSend = await shouldSendNotification(
    "REPORT_SUBMITTED",
    data.reportedContentType,
    null // Reports don't have a single contentId
  );

  if (!shouldSend) {
    console.log(
      `[EmailService] Skipping duplicate report notification (cooldown active)`
    );
    return;
  }

  // Get all moderators for this subject
  const moderators = await getModeratorsForSubject(data.subjectId);

  if (moderators.length === 0) {
    console.log(
      `[EmailService] No moderators found for subject ${data.subjectId}`
    );
    return;
  }

  const html = reportSubmittedTemplate(data);
  const subject = `بلاغ جديد - ${data.subjectName}`;

  const emailAddresses = moderators.map(m => m.email);
  const success = await sendEmail(emailAddresses, subject, html);

  if (success) {
    await recordNotificationSent(
      "REPORT_SUBMITTED",
      data.reportedContentType,
      null,
      data.subjectId
    );
  }
}

/**
 * Notify the reporter that their report has been resolved.
 */
export async function notifyReporterOfResolution(
  data: ReportResolvedData
): Promise<void> {
  const html = reportResolvedTemplate(data);
  const subject = "تم مراجعة بلاغك - سرب";

  await sendEmail(data.recipientEmail, subject, html);
}
