"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TipTapViewer } from "@/components/ui/tiptap-viewer";
import { Check, X } from "lucide-react";
import { useState } from "react";

type CanvasQuestionOption = {
  id: number;
  optionText: string;
  isCorrect: boolean;
  sequence: number;
};

type QuestionContentBlockProps = {
  readonly question: {
    id: number;
    questionType: "MCQ_SINGLE" | "MCQ_MULTI" | "TRUE_FALSE";
    questionText: string;
    justification: string | null;
    options: CanvasQuestionOption[];
  };
};

export default function QuestionContentBlock({
  question,
}: QuestionContentBlockProps) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // For TRUE_FALSE, only show first 2 options
  const displayOptions =
    question.questionType === "TRUE_FALSE"
      ? question.options.slice(0, 2)
      : question.options;

  const isSingleChoice =
    question.questionType === "MCQ_SINGLE" ||
    question.questionType === "TRUE_FALSE";

  const handleOptionSelect = (optionId: number) => {
    if (isSubmitted) return; // Lock after submission

    if (isSingleChoice) {
      // For single choice, replace selection and auto-submit
      setSelectedOptionIds([optionId]);
      setIsSubmitted(true);
    } else {
      // For multi-choice, toggle selection
      setSelectedOptionIds(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSubmit = () => {
    if (selectedOptionIds.length === 0) return;
    setIsSubmitted(true);
  };

  const getOptionStyling = (option: CanvasQuestionOption) => {
    const isSelected = selectedOptionIds.includes(option.id);

    if (!isSubmitted) {
      // Before submission
      if (isSelected) {
        return "border-primary bg-primary/5";
      } else {
        return "border-muted hover:border-primary/50";
      }
    }

    // After submission
    if (option.isCorrect) {
      return "border-success bg-success/15";
    }

    if (isSelected) {
      return "border-destructive bg-destructive/15";
    }

    return "border-muted opacity-60";
  };

  const getOptionIcon = (option: CanvasQuestionOption) => {
    if (!isSubmitted) return null;

    if (option.isCorrect) {
      return <Check className="text-success h-5 w-5" />;
    }

    if (selectedOptionIds.includes(option.id)) {
      return <X className="text-destructive h-5 w-5" />;
    }

    return null;
  };

  return (
    <div className="bg-card space-y-6 rounded-lg border p-6">
      {/* Question Text */}
      <div className="space-y-2">
        <div className="text-lg leading-relaxed font-semibold">
          <TipTapViewer content={question.questionText} />
        </div>
        <p className="text-muted-foreground text-sm">
          {question.questionType === "MCQ_MULTI"
            ? "(يمكنك اختيار أكثر من إجابة)"
            : "(اختر إجابة واحدة)"}
        </p>
      </div>

      {/* Options */}
      {isSingleChoice ? (
        <RadioGroup
          value={selectedOptionIds[0]?.toString() || ""}
          onValueChange={value => handleOptionSelect(Number(value))}
          disabled={isSubmitted}
          className="space-y-3"
        >
          {displayOptions.map(option => (
            <div
              key={option.id}
              onClick={() => !isSubmitted && handleOptionSelect(option.id)}
              className={`flex items-center space-x-3 space-x-reverse rounded-lg border-2 p-4 transition-all ${getOptionStyling(option)} ${!isSubmitted ? "cursor-pointer" : ""}`}
            >
              <RadioGroupItem
                value={option.id.toString()}
                id={`option-${option.id}`}
                disabled={isSubmitted}
                className="shrink-0"
              />
              <Label
                htmlFor={`option-${option.id}`}
                className="flex-1 cursor-pointer text-base leading-relaxed"
                dir="rtl"
              >
                {option.optionText}
              </Label>
              {getOptionIcon(option)}
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-3">
          {displayOptions.map(option => (
            <Label
              key={option.id}
              htmlFor={`option-${option.id}`}
              className={`flex items-center gap-4 rounded-lg border-2 p-4 transition-all ${getOptionStyling(option)} ${!isSubmitted ? "cursor-pointer" : "cursor-default"}`}
              dir="rtl"
              onClick={() => !isSubmitted && handleOptionSelect(option.id)}
            >
              <Checkbox
                id={`option-${option.id}`}
                checked={selectedOptionIds.includes(option.id)}
                onCheckedChange={() =>
                  !isSubmitted && handleOptionSelect(option.id)
                }
                disabled={isSubmitted}
                className="shrink-0"
              />
              <span className="flex-1 text-base leading-relaxed">
                {option.optionText}
              </span>
              {getOptionIcon(option)}
            </Label>
          ))}
        </div>
      )}

      {/* Submit Button for Multi-Choice */}
      {!isSingleChoice && !isSubmitted && (
        <Button
          onClick={handleSubmit}
          disabled={selectedOptionIds.length === 0}
          className="w-full"
        >
          تأكيد الإجابة
        </Button>
      )}

      {/* Justification (shown after submission) */}
      {isSubmitted && question.justification && (
        <div className="bg-accent/15 border-accent/30 animate-in fade-in slide-in-from-bottom-2 space-y-1 rounded-md border px-4 py-3 duration-300">
          <p className="text-sm font-semibold">التوضيح:</p>
          <div className="text-sm leading-relaxed">
            <TipTapViewer content={question.justification} />
          </div>
        </div>
      )}
    </div>
  );
}
