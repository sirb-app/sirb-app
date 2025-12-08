"use client";

import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Question = {
  question: string;
  type: string;
  options: string[];
  correct_answer: string;
  justification?: string;
};

type ConfidenceLevel = "GUESS" | "UNSURE" | "CONFIDENT" | "CERTAIN";

interface AssessmentClientProps {
  studyPlanId: string;
  subject: {
    id: number;
    name: string;
    code: string;
  };
}

export function AssessmentClient({ studyPlanId, subject }: AssessmentClientProps) {
  const router = useRouter();
  
  const [status, setStatus] = useState<"loading" | "ready" | "question" | "complete" | "error">("loading");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentTopicSlug, setCurrentTopicSlug] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);

  // Start assessment
  const startAssessment = useCallback(async () => {
    try {
      const response = await fetch("/api/adaptive/assessment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_plan_id: studyPlanId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start assessment");
      }

      const data = await response.json();
      setQuizId(data.quiz_id);
      
      if (data.first_question) {
        setCurrentQuestion(data.first_question);
        setCurrentTopicSlug(data.first_topic_slug);
        setProgress({ current: 1, total: 15 });
        setQuestionStartTime(Date.now());
        setStatus("question");
      } else {
        setStatus("ready");
      }
    } catch (err) {
      setError("فشل في بدء الاختبار");
      setStatus("error");
    }
  }, [studyPlanId]);

  // Fetch next question
  const fetchNextQuestion = useCallback(async (retryCount = 0) => {
    if (!quizId) return;
    
    const MAX_RETRIES = 5;
    if (retryCount >= MAX_RETRIES) {
      setError("فشل في تحميل السؤال بعد عدة محاولات");
      setStatus("error");
      return;
    }
    
    setIsLoadingQuestion(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(
        `/api/adaptive/assessment/next?study_plan_id=${studyPlanId}&quiz_id=${quizId}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to fetch question");
      }

      const data = await response.json();

      if (data.complete) {
        setStatus("complete");
        return;
      }

      // If question is null, cache is being filled - retry after delay (with limit)
      if (!data.question) {
        setIsLoadingQuestion(false);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchNextQuestion(retryCount + 1);
      }

      setCurrentQuestion(data.question);
      setCurrentTopicSlug(data.topic_slug);
      setProgress(prev => ({
        current: data.progress?.current || prev.current + 1,
        total: data.progress?.estimated_total || 15,
      }));
      setSelectedAnswer(null);
      setConfidence(null);
      setQuestionStartTime(Date.now());
      setStatus("question");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("انتهت مهلة الطلب");
      } else {
        setError("فشل في تحميل السؤال");
      }
      setStatus("error");
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [quizId, studyPlanId]);

  // Submit answer
  const submitAnswer = async () => {
    if (!quizId || !currentQuestion || !selectedAnswer || !confidence || !currentTopicSlug) return;

    setIsSubmitting(true);
    const timeTaken = Date.now() - questionStartTime;

    try {
      const response = await fetch("/api/adaptive/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_plan_id: studyPlanId,
          quiz_id: quizId,
          topic_slug: currentTopicSlug,
          question_data: currentQuestion,
          user_answer: selectedAnswer,
          confidence,
          time_ms: timeTaken,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      // Always fetch next - backend will return complete:true and update DB if assessment is done
      await fetchNextQuestion();
    } catch (err) {
      setError("فشل في إرسال الإجابة");
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    startAssessment();
  }, [startAssessment]);

  // Ready screen (shown only if first_question wasn't included)
  if (status === "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">اختبار تحديد المستوى</CardTitle>
            <p className="text-muted-foreground">{subject.name}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">تعليمات:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• أجب على كل سؤال بأفضل ما لديك</li>
                <li>• حدد مستوى ثقتك في إجابتك</li>
                <li>• لا يوجد وقت محدد لكل سؤال</li>
              </ul>
            </div>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={() => fetchNextQuestion()}
              disabled={isLoadingQuestion}
            >
              {isLoadingQuestion ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  جاري تحميل الأسئلة...
                </>
              ) : (
                <>
                  ابدأ الاختبار
                  <ArrowRight className="me-2 size-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Question screen
  if (status === "question" && currentQuestion) {
    return (
      <div className="flex min-h-screen flex-col" dir="rtl">
        <header className="border-b p-4">
          <div className="container mx-auto max-w-3xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{subject.name}</span>
              <span className="text-muted-foreground text-sm">
                سؤال {progress.current} من ~{progress.total}
              </span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} />
          </div>
        </header>

        <main className="flex-1 p-4">
          <div className="container mx-auto max-w-3xl space-y-6">
            <Card>
              <CardContent className="p-6">
                <div dir="auto" className="text-lg font-medium mb-6">
                  <MarkdownRenderer content={currentQuestion.question} />
                </div>
                
                <RadioGroup value={selectedAnswer || ""} onValueChange={setSelectedAnswer}>
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent"
                      onClick={() => setSelectedAnswer(option)}
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer" dir="auto">
                        <MarkdownRenderer content={option} />
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {selectedAnswer && (
              <Card>
                <CardContent className="p-6">
                  <p className="font-medium mb-4">ما مدى ثقتك في إجابتك؟</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {([
                      { value: "GUESS", label: "تخمين", color: "border-red-200 hover:border-red-400" },
                      { value: "UNSURE", label: "غير متأكد", color: "border-orange-200 hover:border-orange-400" },
                      { value: "CONFIDENT", label: "واثق", color: "border-blue-200 hover:border-blue-400" },
                      { value: "CERTAIN", label: "متأكد تماماً", color: "border-green-200 hover:border-green-400" },
                    ] as const).map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setConfidence(level.value)}
                        className={`rounded-lg border-2 p-3 text-sm transition-colors ${level.color} ${
                          confidence === level.value ? "bg-accent border-primary" : ""
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedAnswer || !confidence || isSubmitting}
              onClick={submitAnswer}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                "التالي"
              )}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Complete screen
  if (status === "complete") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="p-8">
            <CheckCircle2 className="mx-auto size-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">أحسنت!</h2>
            <p className="text-muted-foreground mb-6">
              اكتمل اختبار تحديد المستوى. يمكنك الآن بدء التعلم.
            </p>
            <Button size="lg" onClick={() => router.push(`/sessions/${studyPlanId}`)}>
              ابدأ التعلم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error screen
  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="p-8">
            <AlertCircle className="mx-auto size-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">حدث خطأ</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              حاول مرة أخرى
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading screen
  return (
    <div className="flex min-h-screen items-center justify-center" dir="rtl">
      <div className="text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}
