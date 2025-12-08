"use client";

import { addQuestion, updateQuestion } from "@/actions/quiz-question.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { QuestionType } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { CheckSquare, Circle, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type QuestionOption = {
  id?: number;
  optionText: string;
  isCorrect: boolean;
};

type Question = {
  id: number;
  questionType: "MCQ_SINGLE" | "MCQ_MULTI" | "TRUE_FALSE";
  questionText: string;
  justification: string | null;
  options: {
    id: number;
    optionText: string;
    isCorrect: boolean;
  }[];
};

type AddQuestionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  quizId: number;
  initialData?: Question | null;
};

export default function AddQuestionModal({
  isOpen,
  onClose,
  quizId,
  initialData,
}: AddQuestionModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    questionText?: string;
    options?: string;
    correctAnswer?: string;
  }>({});

  const [questionType, setQuestionType] = useState<QuestionType>(
    QuestionType.MCQ_SINGLE
  );
  const [questionText, setQuestionText] = useState("");
  const [justification, setJustification] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>([
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
  ]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setQuestionType(initialData.questionType as QuestionType);
        setQuestionText(initialData.questionText);
        setJustification(initialData.justification || "");

        // Set options based on type
        if (initialData.questionType === "TRUE_FALSE") {
          setOptions([
            {
              optionText: "صح",
              isCorrect: initialData.options[0]?.isCorrect || false,
            },
            {
              optionText: "خطأ",
              isCorrect: initialData.options[1]?.isCorrect || false,
            },
          ]);
        } else {
          setOptions(
            initialData.options.map(opt => ({
              id: opt.id,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            }))
          );
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setQuestionType(QuestionType.MCQ_SINGLE);
    setQuestionText("");
    setJustification("");
    setOptions([
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
    ]);
  };

  const handleQuestionTypeChange = (type: QuestionType) => {
    setQuestionType(type);

    if (type === QuestionType.TRUE_FALSE) {
      setOptions([
        { optionText: "صح", isCorrect: false },
        { optionText: "خطأ", isCorrect: false },
      ]);
    } else {
      setOptions([
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ]);
    }
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].optionText = text;
    setOptions(newOptions);
    setErrors(prev => ({ ...prev, options: undefined }));
  };

  const toggleCorrect = (index: number) => {
    const newOptions = [...options];

    if (
      questionType === QuestionType.MCQ_SINGLE ||
      questionType === QuestionType.TRUE_FALSE
    ) {
      // Single answer: uncheck all others
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      // Multi answer: toggle this one
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    }

    setOptions(newOptions);
    setErrors(prev => ({ ...prev, correctAnswer: undefined }));
  };

  const validateForm = () => {
    const newErrors: {
      questionText?: string;
      options?: string;
      correctAnswer?: string;
    } = {};

    // Validate question text
    if (questionText.trim().length < 5) {
      newErrors.questionText = "نص السؤال يجب أن يكون 5 أحرف على الأقل";
    }

    // Check all options have text
    if (options.some(opt => opt.optionText.trim().length === 0)) {
      newErrors.options = "جميع الخيارات يجب أن تحتوي على نص";
    }

    // Check at least one correct answer
    if (!options.some(opt => opt.isCorrect)) {
      newErrors.correctAnswer = "يجب اختيار إجابة صحيحة واحدة على الأقل";
    }

    // For single/true-false, exactly one correct
    if (
      (questionType === QuestionType.MCQ_SINGLE ||
        questionType === QuestionType.TRUE_FALSE) &&
      options.filter(opt => opt.isCorrect).length !== 1
    ) {
      newErrors.correctAnswer = "يجب اختيار إجابة صحيحة واحدة فقط";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsLoading(true);

      const data = {
        quizId,
        questionText: questionText.trim(),
        questionType: questionType as "MCQ_SINGLE" | "MCQ_MULTI" | "TRUE_FALSE",
        justification: justification.trim() || undefined,
        options: options.map(opt => ({
          optionText: opt.optionText.trim(),
          isCorrect: opt.isCorrect,
        })),
      };

      if (initialData) {
        await updateQuestion({
          questionId: initialData.id,
          ...data,
        });
        toast.success("تم تحديث السؤال بنجاح");
      } else {
        await addQuestion(data);
        toast.success("تم إضافة السؤال بنجاح");
      }

      router.refresh();
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  const TypeButton = ({
    type,
    icon: Icon,
    label,
  }: {
    type: QuestionType;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => !initialData && handleQuestionTypeChange(type)}
      disabled={!!initialData}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
        questionType === type
          ? "border-primary bg-primary/5 text-primary"
          : "bg-muted hover:bg-muted/80 text-muted-foreground border-transparent",
        initialData && questionType !== type && "cursor-not-allowed opacity-50"
      )}
    >
      <div
        className={cn(
          "rounded-full p-2",
          questionType === type ? "bg-primary/10" : "bg-background"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );

  const renderOptions = () => {
    if (questionType === QuestionType.TRUE_FALSE) {
      return (
        <div className="space-y-2">
          <Label>
            الخيارات <span className="text-destructive">*</span>
          </Label>
          <div className="space-y-2">
            {options.map((option, index) => {
              const isSelected = option.isCorrect;
              return (
                <label
                  key={index}
                  htmlFor={`tf-${index}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                  dir="rtl"
                >
                  <input
                    type="radio"
                    id={`tf-${index}`}
                    name="tf-option"
                    checked={isSelected}
                    onChange={() => toggleCorrect(index)}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="flex-1 text-sm">{option.optionText}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    const isSingle = questionType === QuestionType.MCQ_SINGLE;

    return (
      <div className="space-y-2">
        <Label>
          الخيارات (4 خيارات) <span className="text-destructive">*</span>
        </Label>
        <div className="space-y-2">
          {options.map((option, index) => {
            const isSelected = option.isCorrect;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 px-3 py-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
                dir="rtl"
              >
                {isSingle ? (
                  <input
                    type="radio"
                    id={`opt-${index}`}
                    name="mcq-option"
                    checked={isSelected}
                    onChange={() => toggleCorrect(index)}
                    className="h-4 w-4 shrink-0"
                  />
                ) : (
                  <input
                    type="checkbox"
                    id={`opt-${index}`}
                    checked={isSelected}
                    onChange={() => toggleCorrect(index)}
                    className="h-4 w-4 shrink-0"
                  />
                )}
                <Input
                  value={option.optionText}
                  onChange={e => updateOption(index, e.target.value)}
                  placeholder={`الخيار ${index + 1}`}
                  className="h-7 flex-1 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  dir="rtl"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] space-y-4 overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "تعديل السؤال" : "إضافة سؤال جديد"}
          </DialogTitle>
        </DialogHeader>

        {/* Question Type Selection */}
        <div className="grid gap-3 pt-2 sm:grid-cols-3">
          <TypeButton
            type={QuestionType.MCQ_SINGLE}
            icon={Circle}
            label="اختيار واحد"
          />
          <TypeButton
            type={QuestionType.MCQ_MULTI}
            icon={CheckSquare}
            label="خيارات متعددة"
          />
          <TypeButton
            type={QuestionType.TRUE_FALSE}
            icon={HelpCircle}
            label="صح أم خطأ"
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          {/* Question Text */}
          <div className="space-y-2">
            <Label>
              نص السؤال <span className="text-destructive">*</span>
            </Label>
            <TipTapEditor
              content={questionText}
              onChange={value => {
                setQuestionText(value);
                setErrors(prev => ({ ...prev, questionText: undefined }));
              }}
              placeholder="اكتب السؤال هنا..."
            />
            {errors.questionText && (
              <p className="text-destructive text-sm">{errors.questionText}</p>
            )}
          </div>

          {/* Options */}
          {renderOptions()}
          {errors.options && (
            <p className="text-destructive text-sm">{errors.options}</p>
          )}
          {errors.correctAnswer && (
            <p className="text-destructive text-sm">{errors.correctAnswer}</p>
          )}

          {/* Justification */}
          <div className="space-y-2">
            <Label>التوضيح (اختياري)</Label>
            <TipTapEditor
              content={justification}
              onChange={value => setJustification(value)}
              placeholder="اكتب توضيحاً للإجابة الصحيحة..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading
              ? "جاري الحفظ..."
              : initialData
                ? "حفظ التعديلات"
                : "إضافة السؤال"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
