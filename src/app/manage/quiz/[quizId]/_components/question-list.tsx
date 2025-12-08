"use client";

import { reorderQuestions } from "@/actions/quiz-question.action";
import { Button } from "@/components/ui/button";
import { Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddQuestionModal from "./add-question-modal";
import QuestionCard from "./question-card";

type QuestionOption = {
  id: number;
  sequence: number;
  optionText: string;
  isCorrect: boolean;
};

type Question = {
  id: number;
  sequence: number;
  questionType: "MCQ_SINGLE" | "MCQ_MULTI" | "TRUE_FALSE";
  questionText: string;
  justification: string | null;
  options: QuestionOption[];
};

type QuestionListProps = {
  initialQuestions: Question[];
  quizId: number;
  isReadOnly?: boolean;
};

export default function QuestionList({
  initialQuestions,
  quizId,
  isReadOnly = false,
}: QuestionListProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [isReordering, setIsReordering] = useState(false);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );

  useEffect(() => {
    setQuestions(initialQuestions);
    setHasOrderChanges(false);
  }, [initialQuestions]);

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;

    [newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ];
    const resequenced = newQuestions.map((q, i) => ({
      ...q,
      sequence: i + 1,
    }));

    setQuestions(resequenced);
    setHasOrderChanges(true);
  };

  const handleSaveOrder = async () => {
    try {
      setIsReordering(true);
      const updates = questions.map(q => ({
        questionId: q.id,
        sequence: q.sequence,
      }));
      await reorderQuestions({ quizId, updates });
      toast.success("تم حفظ الترتيب");
      setHasOrderChanges(false);
      router.refresh();
    } catch {
      toast.error("فشل حفظ الترتيب");
    } finally {
      setIsReordering(false);
    }
  };

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setSelectedQuestion(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add & Save Buttons */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 mb-6 flex items-center justify-between border-b py-4 backdrop-blur">
        <h2 className="text-lg font-bold">أسئلة الاختبار</h2>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {hasOrderChanges && (
              <Button
                onClick={handleSaveOrder}
                disabled={isReordering}
                variant="secondary"
                size="sm"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isReordering ? "جاري الحفظ..." : "حفظ الترتيب الجديد"}
              </Button>
            )}

            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة سؤال
            </Button>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="min-h-[200px] space-y-2">
        {questions.length === 0 && (
          <div className="bg-muted/15 text-muted-foreground flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16">
            <p className="mb-4">لا توجد أسئلة مضافة حتى الآن</p>
            {!isReadOnly && (
              <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
                ابدأ بإضافة أول سؤال
              </Button>
            )}
          </div>
        )}

        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            questionNumber={index + 1}
            isFirst={index === 0}
            isLast={index === questions.length - 1}
            onMoveUp={() => moveQuestion(index, "up")}
            onMoveDown={() => moveQuestion(index, "down")}
            onEdit={() => handleEdit(question)}
            quizId={quizId}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>

      {/* Add Question Modal */}
      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        quizId={quizId}
        initialData={selectedQuestion}
      />
    </div>
  );
}
