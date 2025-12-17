export type EmailType =
  | "AUTH_VERIFICATION"
  | "AUTH_PASSWORD_RESET"
  | "SUBMISSION_PENDING"
  | "CONTENT_APPROVED"
  | "CONTENT_REJECTED"
  | "REPORT_SUBMITTED"
  | "REPORT_RESOLVED";

export type ContentType = "CANVAS" | "QUIZ";

export type ReportedContentType =
  | "CANVAS"
  | "COMMENT"
  | "QUIZ"
  | "QUIZ_COMMENT";

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
};

export type ModeratorNotificationData = {
  subjectId: number;
  subjectName: string;
  contentType: ContentType;
  contentId: number;
  contentTitle: string;
  contributorName: string;
  chapterTitle: string;
};

export type ContentDecisionData = {
  recipientEmail: string;
  recipientName: string;
  contentType: ContentType;
  contentId: number;
  contentTitle: string;
  subjectId: number;
  subjectName: string;
  chapterTitle: string;
  chapterId: number;
  decision: "APPROVED" | "REJECTED";
  rejectionReason?: string;
};

export type ReportNotificationData = {
  subjectId: number;
  subjectName: string;
  reporterName: string;
  reportReason: string;
  reportDescription?: string;
  reportedContentType: ReportedContentType;
  reportedContentTitle?: string;
};

export type ReportResolvedData = {
  recipientEmail: string;
  recipientName: string;
  resolution: "RESOLVED" | "DISMISSED";
  reportedContentType: ReportedContentType;
  reportedContentTitle?: string;
};
