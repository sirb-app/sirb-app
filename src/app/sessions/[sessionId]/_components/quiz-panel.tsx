"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Lightbulb,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SessionData } from "./session-client";

import { Thread } from "@/components/assistant-ui/thread";
import { EphemeralChatRuntimeProvider, type ChatMessage } from "@/components/chat/ephemeral-chat-runtime-provider";

type TopicInfo = {
  slug: string;
  name: string;
  correct_count: number;
  wrong_count: number;
  is_due: boolean; // FSRS says it's time to review
  is_weak: boolean; // Low proficiency score
};

type PracticeQuestion = {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string | null;
  justification: string | null;
  hint: string | null;
  type: "MCQ_SINGLE" | "TRUE_FALSE" | "SHORT_ANSWER";
  topic_slug: string;
  user_answer: string | null; // User's selected answer
  is_correct: boolean | null;
  answered: boolean;
  hint_used: boolean; // Whether hint was viewed (affects score weight)
  attempt_count: number; // Number of attempts (for diminishing returns)
  // Short-answer grading details (from API response)
  grading_score?: number | null; // 0.0-1.0 rubric score
  missed_points?: string[] | null; // Points student didn't cover
  grading_feedback?: string | null; // LLM-generated feedback
};

type PracticeState = {
  topics: TopicInfo[];
  questions: PracticeQuestion[];
};

type TopicFilter = "all" | "recommended" | "new" | "mastered" | "needs_work";

interface QuizPanelProps {
  session: SessionData;
}

export function QuizPanel({ session }: QuizPanelProps) {
  const placementCompleted = session.placementCompleted;
  const [practiceState, setPracticeState] = useState<PracticeState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const [justAnswered, setJustAnswered] = useState(false); // Track if user just answered this question
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null); // Track user's selected option
  const [questionType, setQuestionType] = useState<
    "all" | "MCQ_SINGLE" | "TRUE_FALSE" | "SHORT_ANSWER"
  >("all");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  // Map of question ID -> short-answer text (persists text per question)
  const [shortAnswerTextMap, setShortAnswerTextMap] = useState<Record<number, string>>({});

  const [questionChatOpen, setQuestionChatOpen] = useState(false);
  const [chatHistoryMap, setChatHistoryMap] = useState<Record<number, ChatMessage[]>>({});

  useEffect(() => {
    async function fetchState() {
      try {
        const response = await fetch(`/api/adaptive/practice/${session.id}`);
        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ detail: "فشل في تحميل البيانات" }));
          throw new Error(
            (err && typeof err.detail === "string" && err.detail) ||
              "فشل في تحميل البيانات"
          );
        }

        const data: PracticeState = await response.json();
        setPracticeState(data);
        setSelectedTopics(new Set(data.topics.map(t => t.slug)));
        if (data.questions.length > 0) {
          setCurrentIndex(data.questions.length - 1);
        }
      } catch {
        setError("فشل في تحميل البيانات");
      } finally {
        setIsLoading(false);
      }
    }
    fetchState();
  }, [session.id]);

  const generateQuestion = useCallback(async () => {
    if (selectedTopics.size === 0) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/adaptive/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_plan_id: session.id,
          topic_slugs: Array.from(selectedTopics),
          question_type: questionType === "all" ? null : questionType,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "فشل في توليد السؤال" }));
        throw new Error(err?.detail || "فشل في توليد السؤال");
      }

      const data = await response.json();
      setPracticeState(prev => {
        if (!prev) return prev;
        const nextQuestions = [...prev.questions, data.question];
        setCurrentIndex(nextQuestions.length - 1);
        return { ...prev, questions: nextQuestions };
      });
      setShowHint(false);
      setShowAnswer(false);
      setJustAnswered(false);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في توليد السؤال");
    } finally {
      setIsGenerating(false);
    }
  }, [session.id, selectedTopics, questionType]);

  const handleOptionClick = async (
    option: string,
    isRetry: boolean = false
  ) => {
    const currentQuestion = practiceState?.questions[currentIndex];
    if (!currentQuestion || isSubmitting) return;
    // Block if answered AND not doing a retry
    if (currentQuestion.answered && !isRetry) return;

    // We always have correct_answer from generate - validate instantly
    const isCorrectAnswer = option === currentQuestion.correct_answer;

    setSelectedAnswer(option);
    setPracticeState(prev => {
      if (!prev) return prev;
      const updatedQuestions = [...prev.questions];
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        is_correct: isCorrectAnswer,
        user_answer: option,
        answered: true,
        attempt_count: (currentQuestion.attempt_count || 1) + (isRetry ? 1 : 0),
        hint_used: showHint || currentQuestion.hint_used,
      };
      // Only update topic counts on first attempt
      const updatedTopics = isRetry
        ? prev.topics
        : prev.topics.map(t => {
            if (t.slug === currentQuestion.topic_slug) {
              return isCorrectAnswer
                ? { ...t, correct_count: t.correct_count + 1 }
                : { ...t, wrong_count: t.wrong_count + 1 };
            }
            return t;
          });
      return { topics: updatedTopics, questions: updatedQuestions };
    });
    setJustAnswered(true);
    setShowHint(false);

    // Fire API in background for mastery update
    const timeTaken = Date.now() - questionStartTime;
    try {
      const res = await fetch(
        `/api/adaptive/practice/${currentQuestion.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_answer: option,
            confidence: "CONFIDENT",
            time_ms: timeTaken,
            hint_used: showHint || currentQuestion.hint_used,
          }),
        }
      );
      if (!res.ok) {
        setError("تعذر حفظ إجابتك على الخادم. قد لا يتم احتساب التقدم.");
      }
    } catch {
      setError("تعذر حفظ إجابتك على الخادم. قد لا يتم احتساب التقدم.");
    }
  };

  // Handle short-answer question submission - calls API for LLM grading
  const handleShortAnswerSubmit = async (isRetry: boolean = false) => {
    const currentQuestion = practiceState?.questions[currentIndex];
    const currentText = currentQuestion ? (shortAnswerTextMap[currentQuestion.id] || "") : "";
    if (!currentQuestion || isSubmitting || !currentText.trim()) return;
    // Block if answered AND not doing a retry
    if (currentQuestion.answered && !isRetry) return;

    setIsSubmitting(true);
    const timeTaken = Date.now() - questionStartTime;

    try {
      const res = await fetch(
        `/api/adaptive/practice/${currentQuestion.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_answer: currentText.trim(),
            confidence: "CONFIDENT",
            time_ms: timeTaken,
            hint_used: showHint || currentQuestion.hint_used,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        // The API returns is_correct based on LLM grading
        const isCorrectAnswer = data.is_correct ?? false;
        
        setSelectedAnswer(currentText);
        setPracticeState(prev => {
          if (!prev) return prev;
          const updatedQuestions = [...prev.questions];
          updatedQuestions[currentIndex] = {
            ...updatedQuestions[currentIndex],
            is_correct: isCorrectAnswer,
            user_answer: currentText,
            answered: true,
            attempt_count: (currentQuestion.attempt_count || 1) + (isRetry ? 1 : 0),
            hint_used: showHint || currentQuestion.hint_used,
            // Store grading details for display
            grading_score: data.grading_score ?? null,
            missed_points: data.missed_points ?? null,
            grading_feedback: data.grading_feedback ?? null,
          };
          // Only update topic counts on first attempt
          const updatedTopics = isRetry
            ? prev.topics
            : prev.topics.map(t => {
                if (t.slug === currentQuestion.topic_slug) {
                  return isCorrectAnswer
                    ? { ...t, correct_count: t.correct_count + 1 }
                    : { ...t, wrong_count: t.wrong_count + 1 };
                }
                return t;
              });
          return { topics: updatedTopics, questions: updatedQuestions };
        });
        setJustAnswered(true);
        setShowHint(false);
      } else {
        setError("تعذر تقييم إجابتك. حاول مرة أخرى.");
      }
    } catch {
      setError("تعذر الاتصال بالخادم لتقييم الإجابة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToQuestion = (index: number) => {
    if (index < 0 || !practiceState || index >= practiceState.questions.length)
      return;
    setSelectedAnswer(null);
    setShowHint(false);
    setShowAnswer(false);
    setJustAnswered(false);
    setCurrentIndex(index);
    const q = practiceState.questions[index];
    if (!q.answered) setQuestionStartTime(Date.now());
  };

  const toggleTopic = (slug: string) => {
    setSelectedTopics(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const selectAll = () => {
    const visible = getFilteredTopics();
    setSelectedTopics(prev => {
      const next = new Set(prev);
      visible.forEach(t => next.add(t.slug));
      return next;
    });
  };

  const deselectAll = () => {
    const visible = getFilteredTopics();
    setSelectedTopics(prev => {
      const next = new Set(prev);
      visible.forEach(t => next.delete(t.slug));
      return next;
    });
  };

  const getFilteredTopics = useCallback(() => {
    if (!practiceState) return [];
    let topics = practiceState.topics;

    if (topicSearch) {
      topics = topics.filter(t =>
        t.name.toLowerCase().includes(topicSearch.toLowerCase())
      );
    }

    if (topicFilter === "recommended") {
      topics = topics.filter(t => t.is_due || t.is_weak);
    } else if (topicFilter === "new") {
      topics = topics.filter(t => t.correct_count === 0 && t.wrong_count === 0);
    } else if (topicFilter === "mastered") {
      topics = topics.filter(t => t.correct_count > t.wrong_count);
    } else if (topicFilter === "needs_work") {
      topics = topics.filter(
        t => t.wrong_count > 0 && t.wrong_count >= t.correct_count
      );
    }

    return topics;
  }, [practiceState, topicSearch, topicFilter]);

  const filteredTopics = getFilteredTopics();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!placementCompleted) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Sparkles className="text-primary mx-auto mb-2 size-12" />
            <CardTitle>اختبار تحديد المستوى</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              أكمل اختبار تحديد المستوى أولاً
            </p>
            <Button asChild>
              <Link href={`/sessions/${session.id}/assessment`}>
                ابدأ الاختبار
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = practiceState?.questions[currentIndex];
  const hasQuestions = (practiceState?.questions.length ?? 0) > 0;
  const totalQuestions = practiceState?.questions.length ?? 0;

  // Only show "previously answered" banner when navigating back, not when just answered
  const showPreviouslyWrongBanner =
    currentQuestion?.answered &&
    currentQuestion?.is_correct === false &&
    !justAnswered;
  const showPreviouslyCorrectBanner =
    currentQuestion?.answered &&
    currentQuestion?.is_correct === true &&
    !justAnswered;

  return (
    <div className="flex h-full min-h-0 flex-row-reverse overflow-hidden">
      {/* Main Quiz Area */}
      <div className="bg-muted/20 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden p-4 lg:p-6">
          <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Mobile Topics Trigger */}
                <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="md:hidden">
                      <Filter className="size-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <SheetHeader>
                      <SheetTitle>المواضيع</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-3">
                      {/* Mobile topic filters */}
                      <div className="flex flex-wrap gap-1">
                        {(
                          [
                            "all",
                            "recommended",
                            "new",
                            "mastered",
                            "needs_work",
                          ] as TopicFilter[]
                        ).map(f => (
                          <Button
                            key={f}
                            variant={topicFilter === f ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setTopicFilter(f)}
                            className="h-7 px-2 text-xs"
                          >
                            {f === "all"
                              ? "الكل"
                              : f === "recommended"
                                ? "موصى به"
                                : f === "new"
                                  ? "جديد"
                                  : f === "mastered"
                                    ? "متقن"
                                    : f === "needs_work"
                                      ? "يحتاج تحسين"
                                      : f}
                          </Button>
                        ))}
                      </div>
                      <Input
                        placeholder="بحث..."
                        value={topicSearch}
                        onChange={e => setTopicSearch(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-1">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={selectAll}
                          className="h-8 flex-1"
                        >
                          الكل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deselectAll}
                          className="h-8 flex-1"
                        >
                          لا شيء
                        </Button>
                      </div>
                      <ScrollArea className="h-64">
                        <div className="space-y-1.5 pe-2">
                          {filteredTopics.map(topic => {
                            const isSelected = selectedTopics.has(topic.slug);
                            const isRecommended = topic.is_due || topic.is_weak;
                            return (
                              <div
                                key={topic.slug}
                                onClick={() => toggleTopic(topic.slug)}
                                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm transition-all ${
                                  isSelected
                                    ? "bg-primary/10 border-primary/40"
                                    : "bg-muted border-muted"
                                }`}
                              >
                                <span
                                  className={`size-2 shrink-0 rounded-full ${
                                    isRecommended
                                      ? "bg-amber-500"
                                      : isSelected
                                        ? "bg-primary"
                                        : "bg-muted-foreground/40"
                                  }`}
                                />
                                <span className="flex-1 truncate" dir="auto">
                                  {topic.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button
                  onClick={generateQuestion}
                  disabled={selectedTopics.size === 0 || isGenerating}
                  size="sm"
                  className="shrink-0"
                >
                  <Plus className="me-2 size-4" />
                  <span className="hidden sm:inline">سؤال جديد</span>
                  {isGenerating && (
                    <Loader2 className="ms-2 size-4 animate-spin" />
                  )}
                </Button>

                {/* Question Type Filter */}
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs shrink-0">
                      {questionType === "all"
                        ? "كل الأنواع"
                        : questionType === "MCQ_SINGLE"
                          ? "اختيار"
                          : questionType === "TRUE_FALSE"
                            ? "صح/خطأ"
                            : "إجابة قصيرة"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setQuestionType("all")}>
                      كل الأنواع
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setQuestionType("MCQ_SINGLE")}
                    >
                      اختيار متعدد
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setQuestionType("TRUE_FALSE")}
                    >
                      صح / خطأ
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setQuestionType("SHORT_ANSWER")}
                    >
                      إجابة قصيرة
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 overflow-hidden">
                {hasQuestions ? (
                  <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded px-2 py-1 text-sm transition-colors shrink-0 whitespace-nowrap">
                        {currentIndex + 1} / {totalQuestions}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="max-h-60 overflow-y-auto"
                    >
                      {Array.from({ length: totalQuestions }, (_, i) => (
                        <DropdownMenuItem
                          key={i}
                          onClick={() => goToQuestion(i)}
                          className={
                            i === currentIndex ? "bg-primary/10 text-primary" : ""
                          }
                        >
                          {practiceState?.questions[i]?.answered && (
                            <span
                              className={`me-2 text-xs ${practiceState.questions[i].is_correct ? "text-success" : "text-destructive"}`}
                            >
                              {practiceState.questions[i].is_correct ? "✓" : "✗"}
                            </span>
                          )}
                          سؤال {i + 1}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}

                {currentQuestion && !isGenerating && (
                  <Badge variant="outline" className="text-xs">
                    <span dir="auto">
                      {
                        practiceState?.topics.find(
                          t => t.slug === currentQuestion.topic_slug
                        )?.name
                      }
                    </span>
                  </Badge>
                )}
              </div>
            </div>

            {error && (
              <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
                {error}
              </div>
            )}

            {/* Loading state - skeleton */}
            {isGenerating ? (
              <div className="bg-card overflow-hidden rounded-xl border">
                <div className="space-y-4 p-4 lg:p-5">
                  {/* Question skeleton */}
                  <div className="space-y-2">
                    <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                    <div className="bg-muted h-4 w-full animate-pulse rounded" />
                    <div className="bg-muted h-4 w-5/6 animate-pulse rounded" />
                  </div>
                  {/* Options skeleton */}
                  <div className="space-y-2 pt-2">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="border-border/40 flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="bg-muted h-4 flex-1 animate-pulse rounded" />
                        <div className="bg-muted size-6 animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                  {/* Hint skeleton */}
                  <div className="bg-muted/50 h-10 animate-pulse rounded-lg" />
                </div>
                {/* Nav skeleton */}
                <div className="bg-muted/30 flex items-center gap-2 border-t px-4 py-3">
                  <div className="bg-muted h-8 w-20 animate-pulse rounded" />
                  <div className="bg-muted h-8 flex-1 animate-pulse rounded" />
                  <div className="bg-muted h-8 w-20 animate-pulse rounded" />
                </div>
              </div>
            ) : !hasQuestions ? (
              <div className="bg-card space-y-4 rounded-xl border p-8 text-center">
                <p className="text-muted-foreground">
                  اضغط على &quot;سؤال جديد&quot; لبدء التدريب
                </p>
                <Button
                  onClick={generateQuestion}
                  disabled={selectedTopics.size === 0}
                >
                  <Plus className="me-2 size-4" />
                  ابدأ التدريب
                </Button>
              </div>
            ) : currentQuestion ? (
              /* Quiz Container - fills available space with scroll */
              <div className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
                <ScrollArea className="flex-1">
                  <div className="space-y-4 p-4 lg:p-5">
                    {/* Previously answered banners - only when navigating back */}
                    {showPreviouslyWrongBanner && (
                      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                        <AlertCircle className="size-4 shrink-0" />
                        <span className="text-sm">
                          أجبت على هذا السؤال بشكل خاطئ سابقاً
                        </span>
                      </div>
                    )}

                    {showPreviouslyCorrectBanner && (
                      <div className="bg-success/10 border-success/30 flex items-center justify-between gap-2 rounded-lg border p-3">
                        <div className="text-success flex items-center gap-2">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="text-sm">
                            أجبت على هذا السؤال بشكل صحيح سابقاً
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAnswer(!showAnswer)}
                          className="h-7 shrink-0"
                        >
                          <Eye className="me-1 size-3" />
                          {showAnswer ? "إخفاء" : "عرض الإجابة"}
                        </Button>
                      </div>
                    )}

                    {/* Question */}
                    <div dir="auto">
                      <MarkdownRenderer
                        content={currentQuestion.question_text}
                      />
                    </div>

                    {/* Options - for MCQ and T/F */}
                    {currentQuestion.type !== "SHORT_ANSWER" ? (
                      <div className="space-y-2">
                        {currentQuestion.options.map((option, index) => {
                          const num = index + 1;
                          const isCorrect =
                            option === currentQuestion.correct_answer;
                          // Check both: selectedAnswer (just answered) OR stored user_answer (previous answer)
                          const isSelected =
                            option === selectedAnswer ||
                            option === currentQuestion.user_answer;
                          const hasAnswered = currentQuestion.answered;
                          const canRetry = hasAnswered;

                          // Determine option styling based on state
                          let optionClasses =
                            "border-muted hover:border-primary/50";
                          let badgeClasses = "bg-muted text-muted-foreground";
                          let badgeContent: React.ReactNode = num;

                          // Only show answer feedback immediately after answering (justAnswered)
                          // When returning to a question that can be retried, don't show the answer
                          if (justAnswered) {
                            // Just answered: show feedback
                            if (isCorrect) {
                              optionClasses = "border-success bg-success/15";
                              badgeClasses = "bg-success text-success-foreground";
                              badgeContent = <Check className="size-4" />;
                            } else if (isSelected && !isCorrect) {
                              optionClasses =
                                "border-destructive bg-destructive/15";
                              badgeClasses =
                                "bg-destructive text-destructive-foreground";
                              badgeContent = <X className="size-4" />;
                            }
                          } else if (hasAnswered && !canRetry) {
                            // Can't retry (maxed out) - show the final state
                            if (isCorrect) {
                              optionClasses = "border-success bg-success/15";
                              badgeClasses = "bg-success text-success-foreground";
                              badgeContent = <Check className="size-4" />;
                            } else if (isSelected && !isCorrect) {
                              optionClasses =
                                "border-destructive bg-destructive/15";
                              badgeClasses =
                                "bg-destructive text-destructive-foreground";
                              badgeContent = <X className="size-4" />;
                            }
                          } else if (showAnswer && isCorrect) {
                            // User clicked "Show Answer" button - highlight correct answer
                            optionClasses = "border-success bg-success/15";
                            badgeClasses = "bg-success text-success-foreground";
                            badgeContent = <Check className="size-4" />;
                          }
                          // If canRetry && !justAnswered && !showAnswer: show normal options (no feedback)

                          // Clickable if:
                          // 1. Not answered yet, OR
                          // 2. Answered wrong and can retry (attempts < 4)
                          // AND not currently submitting AND not just answered this moment
                          const isClickable =
                            (!hasAnswered || canRetry) &&
                            !isSubmitting &&
                            !justAnswered;

                          return (
                            <div
                              key={index}
                              onClick={() =>
                                isClickable && handleOptionClick(option, canRetry)
                              }
                              className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${isClickable ? "cursor-pointer" : ""} ${optionClasses}`}
                            >
                              <div
                                className="flex-1 text-base leading-relaxed"
                                dir="auto"
                              >
                                <MarkdownRenderer content={option} />
                              </div>

                              <span
                                className={`flex size-6 shrink-0 items-center justify-center rounded text-xs font-medium ${badgeClasses}`}
                              >
                                {badgeContent}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="اكتب إجابتك هنا"
                          value={shortAnswerTextMap[currentQuestion.id] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setShortAnswerTextMap(prev => ({ ...prev, [currentQuestion.id]: val }));
                          }}
                          className="min-h-[120px] resize-none text-base placeholder:text-right"
                          dir="auto"
                          disabled={isSubmitting || justAnswered}
                        />
                        {!justAnswered && (
                          <Button
                            onClick={() => handleShortAnswerSubmit(currentQuestion.answered)}
                            disabled={!(shortAnswerTextMap[currentQuestion.id] || "").trim() || isSubmitting}
                            className="w-full"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="me-2 size-4 animate-spin" />
                                جاري التقييم...
                              </>
                            ) : (
                              "إرسال الإجابة"
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    {(justAnswered || showAnswer) &&
                      currentQuestion.answered &&
                      (currentQuestion.justification || currentQuestion.grading_feedback) && (
                        <div className="bg-accent/15 border-accent/30 space-y-3 rounded-lg border p-4">
                          {currentQuestion.type === "SHORT_ANSWER" && currentQuestion.user_answer && (
                            <div className="space-y-2">
                              <span className="text-sm font-medium text-muted-foreground">إجابتك السابقة:</span>
                              <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap" dir="auto">
                                {currentQuestion.user_answer}
                              </div>
                            </div>
                          )}

                          {currentQuestion.type === "SHORT_ANSWER" && currentQuestion.grading_score !== null && currentQuestion.grading_score !== undefined && (
                            <div className="flex items-center gap-3">
                              <div className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                currentQuestion.grading_score >= 0.75 
                                  ? "bg-success/20 text-success" 
                                  : currentQuestion.grading_score >= 0.5 
                                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                    : "bg-destructive/20 text-destructive"
                              }`}>
                                {Math.round(currentQuestion.grading_score * 100)}%
                              </div>
                              <span className="text-muted-foreground text-sm">
                                {currentQuestion.grading_score >= 0.75 
                                  ? "إجابة ممتازة!" 
                                  : currentQuestion.grading_score >= 0.5 
                                    ? "إجابة جيدة، يمكن تحسينها"
                                    : "تحتاج لمزيد من التفاصيل"}
                              </span>
                            </div>
                          )}

                          {/* Missed points for short-answer */}
                          {currentQuestion.type === "SHORT_ANSWER" && currentQuestion.missed_points && currentQuestion.missed_points.length > 0 && (
                            <div className="space-y-2 px-2">
                              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                نقاط مفقودة:
                              </span>
                              <ul className="ms-5 list-disc space-y-2 text-sm" dir="auto">
                                {currentQuestion.missed_points.map((point, i) => (
                                  <li key={i} className="text-muted-foreground">
                                    <MarkdownRenderer content={point} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* LLM feedback for short-answer OR justification for MCQ/T-F */}
                          <div className="border-t border-accent/30 pt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="text-muted-foreground size-4 shrink-0" />
                              <span className="text-sm font-semibold">
                                {currentQuestion.type === "SHORT_ANSWER" ? "ملاحظات:" : "التوضيح:"}
                              </span>
                            </div>
                            <div className="text-sm leading-relaxed" dir="auto">
                              <MarkdownRenderer
                                content={currentQuestion.grading_feedback || currentQuestion.justification || ""}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Hint Box - shown before answering OR when returning to wrong answer */}
                    {(!currentQuestion.answered || showPreviouslyWrongBanner) &&
                      !justAnswered && (
                        <>
                          {!showHint ? (
                            <button
                              onClick={() => setShowHint(true)}
                              className="border-secondary/30 hover:bg-muted/30 flex w-full items-center justify-center gap-2 rounded-lg border p-3 text-sm transition-colors"
                            >
                              <Lightbulb className="text-secondary size-4" />
                              <span>عرض التلميح</span>
                            </button>
                          ) : (
                            <div className="bg-muted/50 border-secondary/30 space-y-2 rounded-lg border p-4">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="text-secondary size-4 shrink-0" />
                                <span className="text-sm font-medium">
                                  تلميح
                                </span>
                              </div>
                              <div
                                className="text-sm leading-relaxed"
                                dir="auto"
                              >
                                {currentQuestion.hint ? (
                                  <MarkdownRenderer
                                    content={currentQuestion.hint}
                                  />
                                ) : (
                                  <span>راجع المفاهيم الأساسية للموضوع.</span>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                  </div>
                </ScrollArea>

                {/* Navigation - inside the card at bottom */}
                <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-t px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToQuestion(currentIndex - 1)}
                    disabled={currentIndex <= 0}
                    className="h-8"
                  >
                    <ChevronRight className="me-1 size-4" />
                    السابق
                  </Button>

                  <Dialog
                    open={questionChatOpen}
                    onOpenChange={setQuestionChatOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 flex-1 justify-start gap-2"
                        disabled={!currentQuestion}
                      >
                        <MessageSquare className="text-muted-foreground size-4" />
                        اسأل عن هذا السؤال
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      forceMount
                      className="flex h-[85dvh] max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
                    >
                      <DialogHeader className="border-b p-4">
                        <DialogTitle>اسأل عن هذا السؤال</DialogTitle>
                      </DialogHeader>
                      <div className="min-h-0 flex-1 p-2">
                        {currentQuestion && (
                          <EphemeralChatRuntimeProvider
                            key={`question-chat-${currentQuestion.id}`}
                            endpoint={`/api/adaptive/questions/${currentQuestion.id}/chat`}
                            initialMessages={chatHistoryMap[currentQuestion.id]}
                            onMessagesChange={(msgs) =>
                              setChatHistoryMap((prev) => ({ ...prev, [currentQuestion.id]: msgs }))
                            }
                          >
                            <Thread hideSuggestions />
                          </EphemeralChatRuntimeProvider>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={() => {
                      // If there are more questions ahead, go to next; otherwise generate new
                      if (currentIndex < totalQuestions - 1) {
                        goToQuestion(currentIndex + 1);
                      } else {
                        generateQuestion();
                      }
                    }}
                    disabled={selectedTopics.size === 0 || isGenerating}
                    size="sm"
                    className="h-8"
                  >
                    {currentIndex < totalQuestions - 1 ? "التالي" : "سؤال جديد"}
                    <ChevronLeft className="ms-1 size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Topics Sidebar */}
      <div className="bg-card hidden min-h-0 w-72 shrink-0 flex-col overflow-hidden border-e md:flex lg:w-80">
        <div className="space-y-2 border-b px-3 py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">المواضيع</h3>
            <span className="text-muted-foreground text-xs">
              {selectedTopics.size} من {practiceState?.topics.length ?? 0}
            </span>
          </div>

          <div className="flex gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={selectAll}
              className="h-8 flex-1"
            >
              الكل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
              className="h-8 flex-1"
            >
              لا شيء
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            {(
              [
                "all",
                "recommended",
                "new",
                "mastered",
                "needs_work",
              ] as TopicFilter[]
            ).map(f => (
              <Button
                key={f}
                variant={topicFilter === f ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTopicFilter(f)}
                className="h-7 px-2 text-xs"
              >
                {f === "all"
                  ? "الكل"
                  : f === "recommended"
                    ? "موصى به"
                    : f === "new"
                      ? "جديد"
                      : f === "mastered"
                        ? "متقن"
                        : "يحتاج تحسين"}
              </Button>
            ))}
          </div>

          <Input
            placeholder="بحث..."
            value={topicSearch}
            onChange={e => setTopicSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
          {filteredTopics.map(topic => {
            const isSelected = selectedTopics.has(topic.slug);
            const hasStats = topic.correct_count > 0 || topic.wrong_count > 0;
            const isRecommended = topic.is_due || topic.is_weak;

            return (
              <div
                key={topic.slug}
                onClick={() => toggleTopic(topic.slug)}
                className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary/40"
                    : "bg-muted border-muted hover:bg-muted/80"
                } `}
              >
                {/* Selection dot - orange if recommended */}
                <span
                  className={`size-2.5 shrink-0 rounded-full ${
                    isRecommended
                      ? "bg-amber-500"
                      : isSelected
                        ? "bg-primary"
                        : "bg-muted-foreground/40"
                  }`}
                />

                <span className="flex-1 text-sm leading-relaxed" dir="auto">
                  {topic.name}
                </span>

                {hasStats && (
                  <div className="flex shrink-0 flex-col gap-0.5">
                    {topic.correct_count > 0 && (
                      <span className="bg-success/20 text-success rounded px-1.5 py-0.5 text-[10px] font-medium">
                        ✓{topic.correct_count}
                      </span>
                    )}
                    {topic.wrong_count > 0 && (
                      <span className="bg-destructive/20 text-destructive rounded px-1.5 py-0.5 text-[10px] font-medium">
                        ✗{topic.wrong_count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
