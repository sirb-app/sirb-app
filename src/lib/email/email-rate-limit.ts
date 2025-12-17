import { prisma } from "@/lib/prisma";

// Cooldown periods in milliseconds
const COOLDOWN_PERIODS = {
  SUBMISSION_PENDING: 30 * 60 * 1000, // 30 minutes
  REPORT_SUBMITTED: 15 * 60 * 1000, // 15 minutes
} as const;

type NotificationType = keyof typeof COOLDOWN_PERIODS;

/**
 * Check if a notification should be sent based on the cooldown period.
 * Returns true if no recent notification was sent, false otherwise.
 */
export async function shouldSendNotification(
  type: NotificationType,
  contentType: string | null,
  contentId: number | null
): Promise<boolean> {
  const cooldownMs = COOLDOWN_PERIODS[type];
  const cooldownStart = new Date(Date.now() - cooldownMs);

  const recentNotification = await prisma.emailNotificationLog.findFirst({
    where: {
      type,
      contentType: contentType ?? "",
      contentId: contentId ?? 0,
      lastSentAt: { gte: cooldownStart },
    },
  });

  return !recentNotification;
}

/**
 * Record that a notification was sent for rate limiting purposes.
 */
export async function recordNotificationSent(
  type: string,
  contentType: string | null,
  contentId: number | null,
  subjectId: number | null
): Promise<void> {
  // Normalize null values to match the unique constraint lookup
  const normalizedContentType = contentType ?? "";
  const normalizedContentId = contentId ?? 0;

  await prisma.emailNotificationLog.upsert({
    where: {
      type_contentType_contentId: {
        type,
        contentType: normalizedContentType,
        contentId: normalizedContentId,
      },
    },
    create: {
      type,
      contentType: normalizedContentType,
      contentId: normalizedContentId,
      subjectId,
      lastSentAt: new Date(),
    },
    update: {
      lastSentAt: new Date(),
      subjectId,
    },
  });
}
