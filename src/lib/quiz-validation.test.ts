import { describe, expect, it } from "vitest";

import { checkAnswerCorrectness } from "./quiz-validation";

// Mock the QuestionType enum to avoid Prisma dependency in tests
const QuestionType = {
  MCQ_SINGLE: "MCQ_SINGLE",
  MCQ_MULTI: "MCQ_MULTI",
  TRUE_FALSE: "TRUE_FALSE",
} as const;

describe("checkAnswerCorrectness", () => {
  describe("MCQ_SINGLE questions", () => {
    it("returns true when correct single option is selected", () => {
      expect(checkAnswerCorrectness([1], [1], QuestionType.MCQ_SINGLE)).toBe(
        true
      );
    });

    it("returns false when wrong single option is selected", () => {
      expect(checkAnswerCorrectness([2], [1], QuestionType.MCQ_SINGLE)).toBe(
        false
      );
    });

    it("returns false when no option is selected", () => {
      expect(checkAnswerCorrectness([], [1], QuestionType.MCQ_SINGLE)).toBe(
        false
      );
    });

    it("returns false when multiple options are selected", () => {
      expect(checkAnswerCorrectness([1, 2], [1], QuestionType.MCQ_SINGLE)).toBe(
        false
      );
    });
  });

  describe("TRUE_FALSE questions", () => {
    it("returns true when correct answer is selected", () => {
      expect(checkAnswerCorrectness([1], [1], QuestionType.TRUE_FALSE)).toBe(
        true
      );
    });

    it("returns false when wrong answer is selected", () => {
      expect(checkAnswerCorrectness([2], [1], QuestionType.TRUE_FALSE)).toBe(
        false
      );
    });

    it("returns false when no option is selected", () => {
      expect(checkAnswerCorrectness([], [1], QuestionType.TRUE_FALSE)).toBe(
        false
      );
    });
  });

  describe("MCQ_MULTI questions", () => {
    it("returns true when all correct options are selected", () => {
      expect(
        checkAnswerCorrectness([1, 2, 3], [1, 2, 3], QuestionType.MCQ_MULTI)
      ).toBe(true);
    });

    it("returns true when correct options are selected in different order", () => {
      expect(
        checkAnswerCorrectness([3, 1, 2], [1, 2, 3], QuestionType.MCQ_MULTI)
      ).toBe(true);
    });

    it("returns false when not all correct options are selected", () => {
      expect(
        checkAnswerCorrectness([1, 2], [1, 2, 3], QuestionType.MCQ_MULTI)
      ).toBe(false);
    });

    it("returns false when extra options are selected", () => {
      expect(
        checkAnswerCorrectness([1, 2, 3, 4], [1, 2, 3], QuestionType.MCQ_MULTI)
      ).toBe(false);
    });

    it("returns false when wrong options are selected", () => {
      expect(
        checkAnswerCorrectness([4, 5], [1, 2], QuestionType.MCQ_MULTI)
      ).toBe(false);
    });

    it("returns false when no options are selected", () => {
      expect(checkAnswerCorrectness([], [1, 2], QuestionType.MCQ_MULTI)).toBe(
        false
      );
    });

    it("returns true for single correct option in multi-answer", () => {
      expect(checkAnswerCorrectness([5], [5], QuestionType.MCQ_MULTI)).toBe(
        true
      );
    });

    it("handles large option IDs correctly", () => {
      expect(
        checkAnswerCorrectness([100, 200], [200, 100], QuestionType.MCQ_MULTI)
      ).toBe(true);
    });
  });
});
