import { describe, expect, it } from "vitest";

import { POINT_REASONS, POINT_THRESHOLDS, POINT_VALUES } from "./points-config";

describe("POINT_VALUES", () => {
  describe("content creation points", () => {
    it("has positive values for canvas approval", () => {
      expect(POINT_VALUES.CANVAS_APPROVED).toBeGreaterThan(0);
    });

    it("has positive values for quiz approval", () => {
      expect(POINT_VALUES.QUIZ_APPROVED).toBeGreaterThan(0);
    });
  });

  describe("content block bonuses", () => {
    it("has positive values for all content block types", () => {
      expect(POINT_VALUES.CONTENT_BLOCKS.TEXT).toBeGreaterThan(0);
      expect(POINT_VALUES.CONTENT_BLOCKS.VIDEO).toBeGreaterThan(0);
      expect(POINT_VALUES.CONTENT_BLOCKS.FILE).toBeGreaterThan(0);
      expect(POINT_VALUES.CONTENT_BLOCKS.QUESTION).toBeGreaterThan(0);
    });

    it("video bonus is higher than text bonus", () => {
      expect(POINT_VALUES.CONTENT_BLOCKS.VIDEO).toBeGreaterThan(
        POINT_VALUES.CONTENT_BLOCKS.TEXT
      );
    });
  });

  describe("engagement points", () => {
    it("has positive values for upvotes", () => {
      expect(POINT_VALUES.CANVAS_UPVOTE).toBeGreaterThan(0);
      expect(POINT_VALUES.QUIZ_UPVOTE).toBeGreaterThan(0);
      expect(POINT_VALUES.COMMENT_UPVOTE).toBeGreaterThan(0);
    });

    it("has positive values for views and attempts", () => {
      expect(POINT_VALUES.CANVAS_VIEW).toBeGreaterThan(0);
      expect(POINT_VALUES.QUIZ_ATTEMPT).toBeGreaterThan(0);
    });

    it("canvas upvote is worth more than canvas view", () => {
      expect(POINT_VALUES.CANVAS_UPVOTE).toBeGreaterThan(
        POINT_VALUES.CANVAS_VIEW
      );
    });
  });

  describe("moderation points", () => {
    it("has positive values for moderation actions", () => {
      expect(POINT_VALUES.MODERATOR_APPROVAL).toBeGreaterThan(0);
      expect(POINT_VALUES.MODERATOR_REJECTION).toBeGreaterThan(0);
      expect(POINT_VALUES.REPORT_RESOLVED).toBeGreaterThan(0);
      expect(POINT_VALUES.VALID_REPORT).toBeGreaterThan(0);
    });

    it("approval and rejection give equal points", () => {
      expect(POINT_VALUES.MODERATOR_APPROVAL).toBe(
        POINT_VALUES.MODERATOR_REJECTION
      );
    });
  });
});

describe("POINT_THRESHOLDS", () => {
  it("has minimum comment length threshold", () => {
    expect(POINT_THRESHOLDS.COMMENT_MIN_LENGTH).toBeGreaterThan(0);
  });

  it("comment min length is reasonable", () => {
    expect(POINT_THRESHOLDS.COMMENT_MIN_LENGTH).toBeLessThanOrEqual(100);
  });
});

describe("POINT_REASONS", () => {
  describe("content creation reasons", () => {
    it("has canvas approved reason", () => {
      expect(POINT_REASONS.CANVAS_APPROVED).toBe("canvas_approved");
    });

    it("has quiz approved reason", () => {
      expect(POINT_REASONS.QUIZ_APPROVED).toBe("quiz_approved");
    });

    it("has content block added reason", () => {
      expect(POINT_REASONS.CONTENT_BLOCK_ADDED).toBe("content_block_added");
    });
  });

  describe("engagement reasons", () => {
    it("has upvote reasons", () => {
      expect(POINT_REASONS.CANVAS_UPVOTE_RECEIVED).toBe(
        "canvas_upvote_received"
      );
      expect(POINT_REASONS.QUIZ_UPVOTE_RECEIVED).toBe("quiz_upvote_received");
      expect(POINT_REASONS.COMMENT_UPVOTE_RECEIVED).toBe(
        "comment_upvote_received"
      );
    });

    it("has view and attempt reasons", () => {
      expect(POINT_REASONS.CANVAS_VIEW_RECEIVED).toBe("canvas_view_received");
      expect(POINT_REASONS.QUIZ_ATTEMPT_RECEIVED).toBe("quiz_attempt_received");
    });
  });

  describe("reversal reasons", () => {
    it("has upvote revoked reasons", () => {
      expect(POINT_REASONS.CANVAS_UPVOTE_REVOKED).toBe("canvas_upvote_revoked");
      expect(POINT_REASONS.QUIZ_UPVOTE_REVOKED).toBe("quiz_upvote_revoked");
      expect(POINT_REASONS.COMMENT_UPVOTE_REVOKED).toBe(
        "comment_upvote_revoked"
      );
    });
  });

  it("all reasons are non-empty strings", () => {
    Object.values(POINT_REASONS).forEach(reason => {
      expect(typeof reason).toBe("string");
      expect(reason.length).toBeGreaterThan(0);
    });
  });

  it("all reasons are unique", () => {
    const reasons = Object.values(POINT_REASONS);
    const uniqueReasons = new Set(reasons);
    expect(uniqueReasons.size).toBe(reasons.length);
  });
});
