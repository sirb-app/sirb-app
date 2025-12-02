"use client";

import {
  completeQuizAttempt,
  startQuizAttempt,
  submitQuestionAnswer,
} from "@/actions/quiz-attempt.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { QuestionType } from "@/generated/prisma";
import { checkAnswerCorrectness } from "@/lib/quiz-validation";
import { ArrowLeft, ArrowRight, Check, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import QuestionDisplay from "./question-display";

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

type Quiz = {
  id: number;
  title: string;
  description: string | null;
  chapter: {
    id: number;
    title: string;
    subjectId: number;
  };
  contributor: {
    id: string;
    name: string | null;
  };
  questions: Question[];
};

type Attempt = {
  id: number;
  answers: {
    questionId: number;
    selectedOptionIds: number[];
    isCorrect: boolean;
    question: Question;
  }[];
} | null;

type QuizInterfaceProps = {
  quiz: Quiz;
  attempt: Attempt;
  bestAttempt: { score: number; totalQuestions: number } | null;
  userId: string;
  subjectId: number;
  chapterId: number;
};

export default function QuizInterface({
  quiz,
  attempt: initialAttempt,
  bestAttempt,
  subjectId,
  chapterId,
}: QuizInterfaceProps) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<number | null>(
    initialAttempt?.id || null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Map<number, { selectedOptionIds: number[]; isCorrect: boolean }>
  >(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(!!initialAttempt);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Initialize answers from existing attempt
  useEffect(() => {
    if (initialAttempt) {
      const answerMap = new Map();
      initialAttempt.answers.forEach(answer => {
        answerMap.set(answer.questionId, {
          selectedOptionIds: answer.selectedOptionIds,
          isCorrect: answer.isCorrect,
        });
      });
      setAnswers(answerMap);
    }
  }, [initialAttempt]);

  // Scroll carousel when current question changes
  useEffect(() => {
    if (carouselApi) {
      carouselApi.scrollTo(currentQuestionIndex);
    }
  }, [currentQuestionIndex, carouselApi]);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = answers.size;

  const handleStartQuiz = async () => {
    try {
      const result = await startQuizAttempt(quiz.id);
      setAttemptId(result.attemptId);
      setHasStarted(true);
      toast.success("بدأ الاختبار");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل بدء الاختبار";
      toast.error(errorMessage);
    }
  };

  const handleAnswerSubmit = async (selectedOptionIds: number[]) => {
    if (!attemptId) return;

    // Calculate correctness client-side for immediate feedback
    const correctOptionIds = currentQuestion.options
      .filter(opt => opt.isCorrect)
      .map(opt => opt.id);

    const isCorrect = checkAnswerCorrectness(
      selectedOptionIds,
      correctOptionIds,
      currentQuestion.questionType
    );

    // Update UI immediately for instant feedback
    setAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(currentQuestion.id, {
        selectedOptionIds,
        isCorrect,
      });
      return newMap;
    });

    // Save to server in background (don't wait)
    submitQuestionAnswer({
      attemptId,
      questionId: currentQuestion.id,
      selectedOptionIds,
    }).catch(error => {
      const errorMessage = error instanceof Error ? error.message : "فشل حفظ الإجابة";
      toast.error(errorMessage);
    });
  };

  const handleCompleteQuiz = async () => {
    if (!attemptId) return;

    // Check if all questions are answered
    if (answeredCount < totalQuestions) {
      toast.error(`يرجى الإجابة على جميع الأسئلة (${answeredCount}/${totalQuestions})`);
      return;
    }

    try {
      setIsSubmitting(true);
      await completeQuizAttempt(attemptId);
      toast.success("تم إنهاء الاختبار");
      router.push(
        `/subjects/${subjectId}/chapters/${chapterId}/quizzes/${quiz.id}/summary?attemptId=${attemptId}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل إنهاء الاختبار";
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  if (!hasStarted) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-muted-foreground mt-2">{quiz.description}</p>
              )}
            </div>

            <div className="bg-muted/50 space-y-3 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">عدد الأسئلة:</span>
                <span className="font-bold">{totalQuestions}</span>
              </div>
              {bestAttempt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">أفضل نتيجة:</span>
                  <span className="flex items-center gap-2 font-bold text-success">
                    <Trophy className="h-4 w-4" />
                    {bestAttempt.score}/{bestAttempt.totalQuestions} (
                    {Math.round((bestAttempt.score / bestAttempt.totalQuestions) * 100)}%)
                  </span>
                </div>
              )}
            </div>

            <div className="bg-accent/15 border-accent/30 rounded-lg border p-4">
              <ul className="space-y-2 text-sm">
                <li>• يمكنك التنقل بين الأسئلة بحرية</li>
                <li>• لا يمكن تغيير الإجابة بعد اختيارها</li>
                <li>• سيتم عرض النتيجة والتوضيح فوراً بعد الإجابة</li>
                <li>• استخدم زر &quot;التالي&quot; للانتقال إلى السؤال التالي</li>
                <li>• يمكنك إعادة المحاولة بدون حد</li>
              </ul>
            </div>

            <Button onClick={handleStartQuiz} size="lg" className="w-full">
              بدء الاختبار
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question Navigation Carousel */}
      <div className="flex items-center justify-center">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: "center",
            loop: false,
            direction: "rtl",
          }}
          className="w-full max-w-3xl"
        >
          <div className="flex items-center justify-center gap-3">
            {/* Right button: Previous (points right, goes to lower index) */}
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={currentQuestionIndex === 0}
              className="shrink-0"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">السابق</span>
            </Button>

            <CarouselContent className="py-2 px-4">
              {quiz.questions.map((q, index) => {
                const answer = answers.get(q.id);
                const isAnswered = !!answer;
                const isCurrent = index === currentQuestionIndex;
                const isCorrect = answer?.isCorrect;

                return (
                  <CarouselItem key={q.id} className="basis-auto px-1">
                    <button
                      onClick={() => goToQuestion(index)}
                      className={`h-10 w-10 rounded-md border-2 text-sm font-medium transition-all ${
                        isCurrent
                          ? "border-primary bg-primary text-primary-foreground"
                          : isAnswered
                            ? isCorrect
                              ? "border-success bg-success/15 text-success hover:bg-success/25"
                              : "border-destructive bg-destructive/15 text-destructive hover:bg-destructive/25"
                            : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:bg-muted"
                      }`}
                    >
                      {index + 1}
                    </button>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            {/* Left button: Next (points left, goes to higher index) */}
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentQuestionIndex === totalQuestions - 1}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">التالي</span>
            </Button>
          </div>
        </Carousel>
      </div>

      {/* Question Display */}
      <QuestionDisplay
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        existingAnswer={answers.get(currentQuestion.id)}
        onSubmit={handleAnswerSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Finish Quiz Button - Always visible */}
      <div className="flex justify-center">
        <Button
          variant="destructive"
          onClick={handleCompleteQuiz}
          disabled={answeredCount < totalQuestions}
          size="lg"
          className="w-full sm:w-auto"
        >
          <Check className="ml-2 h-5 w-5" />
          إنهاء الاختبار وعرض الملخص
          {answeredCount < totalQuestions && (
            <span className="mr-2">({answeredCount}/{totalQuestions})</span>
          )}
        </Button>
      </div>
    </div>
  );
}
