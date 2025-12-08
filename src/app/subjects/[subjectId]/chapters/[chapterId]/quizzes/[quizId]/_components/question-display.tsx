"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TipTapViewer } from "@/components/ui/tiptap-viewer";
import { QuestionType } from "@/generated/prisma";
import { useEffect, useState } from "react";

type QuestionOption = {
  id: number;
  sequence: number;
  optionText: string;
  isCorrect: boolean;
};

type Question = {
  id: number;
  sequence: number;
  questionType: QuestionType;
  questionText: string;
  justification: string | null;
  options: QuestionOption[];
};

type QuestionDisplayProps = {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  existingAnswer?: {
    selectedOptionIds: number[];
    isCorrect: boolean;
  };
  onSubmit: (selectedOptionIds: number[]) => void;
  isSubmitting: boolean;
};

export default function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  existingAnswer,
  onSubmit,
  isSubmitting,
}: QuestionDisplayProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    existingAnswer?.selectedOptionIds || []
  );

  // Reset selected options when question changes
  useEffect(() => {
    setSelectedOptions(existingAnswer?.selectedOptionIds || []);
  }, [question.id, existingAnswer]);

  const isAnswered = !!existingAnswer;
  const isSingleChoice =
    question.questionType === QuestionType.MCQ_SINGLE ||
    question.questionType === QuestionType.TRUE_FALSE;

  const handleOptionSelect = (optionId: number) => {
    if (isAnswered || isSubmitting) return;

    let newSelection: number[];

    if (isSingleChoice) {
      newSelection = [optionId];
      setSelectedOptions(newSelection);
      // Auto-submit for single choice - submit happens immediately
      onSubmit([optionId]);
    } else {
      // Multi-choice: toggle
      if (selectedOptions.includes(optionId)) {
        newSelection = selectedOptions.filter(id => id !== optionId);
      } else {
        newSelection = [...selectedOptions, optionId];
      }
      setSelectedOptions(newSelection);
    }
  };

  const handleMultiSubmit = () => {
    if (selectedOptions.length === 0 || isAnswered || isSubmitting) return;
    onSubmit(selectedOptions);
  };

  const getQuestionTypeBadge = () => {
    switch (question.questionType) {
      case QuestionType.MCQ_SINGLE:
        return <Badge variant="outline">اختيار واحد</Badge>;
      case QuestionType.MCQ_MULTI:
        return <Badge variant="outline">اختيار متعدد</Badge>;
      case QuestionType.TRUE_FALSE:
        return <Badge variant="outline">صح/خطأ</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        {/* Question Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">
              السؤال {questionNumber} من {totalQuestions}
            </span>
            {getQuestionTypeBadge()}
          </div>

          <div className="text-xl leading-relaxed font-bold">
            <TipTapViewer content={question.questionText} />
          </div>

          {question.questionType === QuestionType.MCQ_MULTI && !isAnswered && (
            <p className="text-muted-foreground text-sm">
              اختر جميع الإجابات الصحيحة
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {isSingleChoice ? (
            <RadioGroup
              value={selectedOptions[0]?.toString() || ""}
              onValueChange={value => handleOptionSelect(parseInt(value))}
              disabled={isAnswered || isSubmitting}
            >
              {question.options.map(option => {
                const isSelected = selectedOptions.includes(option.id);
                const isCorrectAnswer = option.isCorrect;

                // Determine styling based on state
                let styling = "";
                if (isAnswered) {
                  // After answering: show correct answers in success color, wrong selections in red
                  if (isCorrectAnswer) {
                    styling = "border-success bg-success/15";
                  } else if (isSelected) {
                    styling = "border-destructive bg-destructive/15";
                  } else {
                    styling = "border-muted opacity-60";
                  }
                } else {
                  // Before answering: show selection state
                  if (isSelected) {
                    styling = "border-primary bg-primary/5";
                  } else {
                    styling =
                      "border-muted hover:border-primary/50 cursor-pointer";
                  }
                }

                return (
                  <div
                    key={option.id}
                    onClick={() =>
                      !isAnswered &&
                      !isSubmitting &&
                      handleOptionSelect(option.id)
                    }
                    className={`flex items-center space-x-3 space-x-reverse rounded-lg border-2 p-4 transition-all ${styling} ${!isAnswered && !isSubmitting ? "cursor-pointer" : ""}`}
                  >
                    <RadioGroupItem
                      value={option.id.toString()}
                      id={`option-${option.id}`}
                      disabled={isAnswered || isSubmitting}
                    />
                    <Label
                      htmlFor={`option-${option.id}`}
                      className="flex-1 cursor-pointer text-base leading-relaxed"
                      dir="rtl"
                    >
                      {option.optionText}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          ) : (
            <div className="space-y-3">
              {question.options.map(option => {
                const isSelected = selectedOptions.includes(option.id);
                const isCorrectAnswer = option.isCorrect;

                // Determine styling based on state
                let styling = "";
                if (isAnswered) {
                  // After answering: show correct answers in success color, wrong selections in red
                  if (isCorrectAnswer) {
                    styling = "border-success bg-success/15";
                  } else if (isSelected) {
                    styling = "border-destructive bg-destructive/15";
                  } else {
                    styling = "border-muted opacity-60";
                  }
                } else {
                  // Before answering: show selection state
                  if (isSelected) {
                    styling = "border-primary bg-primary/5";
                  } else {
                    styling =
                      "border-muted hover:border-primary/50 cursor-pointer";
                  }
                }

                return (
                  <Label
                    key={option.id}
                    htmlFor={`option-${option.id}`}
                    className={`flex items-center gap-4 rounded-lg border-2 p-4 transition-all ${styling} ${!isAnswered && !isSubmitting ? "cursor-pointer" : "cursor-default"}`}
                    dir="rtl"
                  >
                    <Checkbox
                      id={`option-${option.id}`}
                      checked={isSelected}
                      onCheckedChange={() =>
                        !isAnswered &&
                        !isSubmitting &&
                        handleOptionSelect(option.id)
                      }
                      disabled={isAnswered || isSubmitting}
                      className="shrink-0"
                    />
                    <span className="flex-1 text-base leading-relaxed">
                      {option.optionText}
                    </span>
                  </Label>
                );
              })}

              {!isAnswered && (
                <button
                  onClick={handleMultiSubmit}
                  disabled={selectedOptions.length === 0 || isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 w-full rounded-md px-4 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الحفظ..." : "تأكيد الإجابة"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Justification */}
        {isAnswered && question.justification && (
          <div className="bg-accent/15 border-accent/30 rounded-md border px-4 py-3 text-sm">
            <p className="mb-1 font-semibold">التوضيح:</p>
            <div className="leading-relaxed">
              <TipTapViewer content={question.justification} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
