import { QuestionType } from "@/generated/prisma";

/**
 * Checks if the selected options are correct for a given question type
 * Used for scoring quiz answers at runtime
 * @param selectedIds - Array of selected option IDs
 * @param correctIds - Array of correct option IDs
 * @param questionType - Type of the question
 * @returns true if answer is correct, false otherwise
 */
export function checkAnswerCorrectness(
  selectedIds: number[],
  correctIds: number[],
  questionType: QuestionType
): boolean {
  if (questionType === QuestionType.MCQ_MULTI) {
    // For multi-answer: must select ALL correct options and ONLY correct options
    if (selectedIds.length !== correctIds.length) return false;

    const sortedSelected = [...selectedIds].sort((a, b) => a - b);
    const sortedCorrect = [...correctIds].sort((a, b) => a - b);

    return sortedSelected.every((id, i) => id === sortedCorrect[i]);
  }

  // For MCQ_SINGLE and TRUE_FALSE: must select exactly ONE option and it must be correct
  return selectedIds.length === 1 && selectedIds[0] === correctIds[0];
}
