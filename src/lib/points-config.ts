/**
 * Contributor Points System Configuration
 *
 * All point values are configurable here for easy adjustment.
 * Points are awarded exclusively to contributors (not learners).
 */

export const POINT_VALUES = {
  // Content Creation Points (Primary)
  CANVAS_APPROVED: 100,
  QUIZ_APPROVED: 100,

  // Content Block Bonuses (awarded with canvas approval)
  CONTENT_BLOCKS: {
    TEXT: 5,
    VIDEO: 15,
    FILE: 10,
    QUESTION: 10,
  },

  // Quiz Question Bonuses (awarded with quiz approval)
  QUIZ_QUESTION: 10,

  // Engagement Points (Secondary - Quality Signals)
  CANVAS_UPVOTE: 5,
  QUIZ_UPVOTE: 5,
  COMMENT_UPVOTE: 2,
  CANVAS_VIEW: 1,
  QUIZ_ATTEMPT: 2,
  COMMENT_CREATED: 3,

  // Moderation Points (Tertiary - Community Health)
  MODERATOR_APPROVAL: 20,
  MODERATOR_REJECTION: 20, // Same as approval - reviewing takes similar effort
  REPORT_RESOLVED: 15,
  VALID_REPORT: 10,
} as const;

export const POINT_THRESHOLDS = {
  COMMENT_MIN_LENGTH: 20,
} as const;

/**
 * Point award reasons (for tracking in UserPoints.reason field)
 */
export const POINT_REASONS = {
  // Content creation
  CANVAS_APPROVED: "canvas_approved",
  QUIZ_APPROVED: "quiz_approved",
  CONTENT_BLOCK_ADDED: "content_block_added",
  QUIZ_QUESTION_ADDED: "quiz_question_added",

  // Engagement
  CANVAS_UPVOTE_RECEIVED: "canvas_upvote_received",
  QUIZ_UPVOTE_RECEIVED: "quiz_upvote_received",
  COMMENT_UPVOTE_RECEIVED: "comment_upvote_received",
  COMMENT_CREATED: "comment_created",
  CANVAS_VIEW_RECEIVED: "canvas_view_received",
  QUIZ_ATTEMPT_RECEIVED: "quiz_attempt_received",

  // Moderation
  CONTENT_APPROVED_BY_MODERATOR: "content_approved_by_moderator",
  CONTENT_REJECTED_BY_MODERATOR: "content_rejected_by_moderator",
  REPORT_RESOLVED: "report_resolved",
  VALID_REPORT: "valid_report",

  // Reversals (negative points)
  CANVAS_UPVOTE_REVOKED: "canvas_upvote_revoked",
  QUIZ_UPVOTE_REVOKED: "quiz_upvote_revoked",
  COMMENT_UPVOTE_REVOKED: "comment_upvote_revoked",
} as const;

export type PointReason = (typeof POINT_REASONS)[keyof typeof POINT_REASONS];
