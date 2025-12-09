"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Lightbulb,
  Loader2,
  Menu,
  MessageSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

type TopicInfo = {
  slug: string;
  name: string;
  correct_count: number;
  wrong_count: number;
  is_due: boolean;  // FSRS says it's time to review
  is_weak: boolean; // Low proficiency score
};

type PracticeQuestion = {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string | null;
  justification: string | null;
  hint: string | null;
  type: "MCQ_SINGLE" | "TRUE_FALSE";
  topic_slug: string;
  user_answer: string | null; // User's selected answer
  is_correct: boolean | null;
  answered: boolean;
  hint_used: boolean; // Whether hint was viewed (affects score weight)
  attempt_count: number; // Number of attempts (for diminishing returns)
};

type PracticeState = {
  topics: TopicInfo[];
  questions: PracticeQuestion[];
};

type TopicFilter = "all" | "recommended" | "new" | "mastered" | "needs_work";

interface QuizPanelProps {
  session: SessionData;
  placementCompleted?: boolean;
}

export function QuizPanel({ session, placementCompleted = true }: QuizPanelProps) {
  const [practiceState, setPracticeState] = useState<PracticeState | null>(null);
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
  const [questionType, setQuestionType] = useState<"all" | "MCQ_SINGLE" | "TRUE_FALSE">("all");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => {
    async function fetchState() {
      try {
        const response = await fetch(`/api/adaptive/practice/${session.id}`);
        if (response.ok) {
          const data: PracticeState = await response.json();
          setPracticeState(data);
          setSelectedTopics(new Set(data.topics.map(t => t.slug)));
          if (data.questions.length > 0) {
            setCurrentIndex(data.questions.length - 1);
          }
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
        const err = await response.json();
        throw new Error(err.detail || "فشل في توليد السؤال");
      }

      const data = await response.json();
      setPracticeState(prev => {
        if (!prev) return prev;
        return { ...prev, questions: [...prev.questions, data.question] };
      });
      setCurrentIndex(practiceState?.questions.length ?? 0);
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
  }, [session.id, selectedTopics, practiceState?.questions.length]);

  const handleOptionClick = async (option: string, isRetry: boolean = false) => {
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
      const updatedTopics = isRetry ? prev.topics : prev.topics.map(t => {
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
    fetch(`/api/adaptive/practice/${currentQuestion.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_answer: option,
        confidence: "CONFIDENT",
        time_ms: timeTaken,
        hint_used: showHint || currentQuestion.hint_used,
      }),
    }).catch(() => console.error("Failed to update mastery"));
  };

  const goToQuestion = (index: number) => {
    if (index < 0 || !practiceState || index >= practiceState.questions.length) return;
    setCurrentIndex(index);
    setShowHint(false);
    setShowAnswer(false);
    setJustAnswered(false); // Coming back to a question, not just answered
    setSelectedAnswer(null); // Reset selected answer when navigating
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
      topics = topics.filter(t => t.name.toLowerCase().includes(topicSearch.toLowerCase()));
    }
    
    if (topicFilter === "recommended") {
      topics = topics.filter(t => t.is_due || t.is_weak);
    } else if (topicFilter === "new") {
      topics = topics.filter(t => t.correct_count === 0 && t.wrong_count === 0);
    } else if (topicFilter === "mastered") {
      topics = topics.filter(t => t.correct_count > t.wrong_count);
    } else if (topicFilter === "needs_work") {
      topics = topics.filter(t => t.wrong_count > 0 && t.wrong_count >= t.correct_count);
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
            <Sparkles className="mx-auto size-12 text-primary mb-2" />
            <CardTitle>اختبار تحديد المستوى</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">أكمل اختبار تحديد المستوى أولاً</p>
            <Button asChild>
              <Link href={`/sessions/${session.id}/assessment`}>ابدأ الاختبار</Link>
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
  const showPreviouslyWrongBanner = currentQuestion?.answered && currentQuestion?.is_correct === false && !justAnswered;
  const showPreviouslyCorrectBanner = currentQuestion?.answered && currentQuestion?.is_correct === true && !justAnswered;

  return (
    <div className="flex h-full min-h-0 overflow-hidden flex-row-reverse">
      {/* Main Quiz Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-hidden p-4 lg:p-6 flex flex-col">
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col min-h-0 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
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
                        {(["all", "recommended", "new", "mastered", "needs_work"] as TopicFilter[]).map(f => (
                          <Button 
                            key={f}
                            variant={topicFilter === f ? "secondary" : "ghost"} 
                            size="sm" 
                            onClick={() => setTopicFilter(f)}
                            className="h-7 text-xs px-2"
                          >
                            {f === "all" ? "الكل" : f === "recommended" ? "موصى به" : f === "new" ? "جديد" : f === "mastered" ? "متقن" : "يحتاج تحسين"}
                          </Button>
                        ))}
                      </div>
                      <Input
                        placeholder="بحث..."
                        value={topicSearch}
                        onChange={(e) => setTopicSearch(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-1">
                        <Button variant="default" size="sm" onClick={selectAll} className="flex-1 h-8">الكل</Button>
                        <Button variant="outline" size="sm" onClick={deselectAll} className="flex-1 h-8">لا شيء</Button>
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
                                className={`flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-all border text-sm ${
                                  isSelected ? "bg-primary/10 border-primary/40" : "bg-muted border-muted"
                                }`}
                              >
                                <span className={`size-2 rounded-full shrink-0 ${
                                  isRecommended ? "bg-amber-500" : isSelected ? "bg-primary" : "bg-muted-foreground/40"
                                }`} />
                                <span className="flex-1 truncate" dir="auto">{topic.name}</span>
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
                >
                  <Plus className="me-2 size-4" />
                  سؤال جديد
                  {isGenerating && <Loader2 className="ms-2 size-4 animate-spin" />}
                </Button>

                {/* Question Type Filter */}
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      {questionType === "all" ? "كل الأنواع" : questionType === "MCQ_SINGLE" ? "اختيار متعدد" : "صح/خطأ"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setQuestionType("all")}>كل الأنواع</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setQuestionType("MCQ_SINGLE")}>اختيار متعدد</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setQuestionType("TRUE_FALSE")}>صح / خطأ</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {hasQuestions ? (
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 rounded hover:bg-muted">
                      {currentIndex + 1} / {totalQuestions}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="max-h-60 overflow-y-auto">
                    {Array.from({ length: totalQuestions }, (_, i) => (
                      <DropdownMenuItem
                        key={i}
                        onClick={() => goToQuestion(i)}
                        className={i === currentIndex ? "bg-primary/10 text-primary" : ""}
                      >
                        {practiceState?.questions[i]?.answered && (
                          <span className={`me-2 text-xs ${practiceState.questions[i].is_correct ? "text-success" : "text-destructive"}`}>
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
                    {practiceState?.topics.find(t => t.slug === currentQuestion.topic_slug)?.name}
                  </span>
                </Badge>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Loading state - skeleton */}
            {isGenerating ? (
              <div className="rounded-xl bg-card border overflow-hidden">
                <div className="p-4 lg:p-5 space-y-4">
                  {/* Question skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded animate-pulse w-full" />
                    <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                  </div>
                  {/* Options skeleton */}
                  <div className="space-y-2 pt-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                        <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
                        <div className="size-6 bg-muted rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                  {/* Hint skeleton */}
                  <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                </div>
                {/* Nav skeleton */}
                <div className="border-t px-4 py-3 flex items-center gap-2 bg-muted/30">
                  <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                  <div className="flex-1 h-8 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ) : !hasQuestions ? (
              <div className="rounded-xl bg-card border p-8 text-center space-y-4">
                <p className="text-muted-foreground">
                  اضغط على &quot;سؤال جديد&quot; لبدء التدريب
                </p>
                <Button onClick={generateQuestion} disabled={selectedTopics.size === 0}>
                  <Plus className="me-2 size-4" />
                  ابدأ التدريب
                </Button>
              </div>
            ) : currentQuestion ? (
              /* Quiz Container - fills available space with scroll */
              <div className="rounded-xl bg-card border overflow-hidden flex flex-col flex-1 min-h-0">
                <ScrollArea className="flex-1">
                  <div className="p-4 lg:p-5 space-y-4">
                  {/* Previously answered banners - only when navigating back */}
                  {showPreviouslyWrongBanner && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="size-4 shrink-0" />
                      <span className="text-sm">أجبت على هذا السؤال بشكل خاطئ سابقاً</span>
                    </div>
                  )}
                  
                  {showPreviouslyCorrectBanner && (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-success/10 border border-success/30 p-3">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span className="text-sm">أجبت على هذا السؤال بشكل صحيح سابقاً</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="shrink-0 h-7"
                      >
                        <Eye className="size-3 me-1" />
                        {showAnswer ? "إخفاء" : "عرض الإجابة"}
                      </Button>
                    </div>
                  )}

                  {/* Question */}
                  <div dir="auto">
                    <MarkdownRenderer content={currentQuestion.question_text} />
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, index) => {
                      const num = index + 1;
                      const isCorrect = option === currentQuestion.correct_answer;
                      // Check both: selectedAnswer (just answered) OR stored user_answer (previous answer)
                      const isSelected = option === selectedAnswer || option === currentQuestion.user_answer;
                      const hasAnswered = currentQuestion.answered;
                      // Can retry if already answered and attempts < 4 (both correct and wrong can retry)
                      const canRetry = hasAnswered && (currentQuestion.attempt_count || 1) < 4;
                      
                      // Determine option styling based on state
                      let optionClasses = "border-border/40 hover:border-border hover:bg-muted/50";
                      let badgeClasses = "bg-muted text-muted-foreground";
                      let badgeContent: React.ReactNode = num;
                      
                      // Only show answer feedback immediately after answering (justAnswered)
                      // When returning to a question that can be retried, don't show the answer
                      if (justAnswered) {
                        // Just answered: show feedback
                        if (isCorrect) {
                          optionClasses = "border-success bg-success/10";
                          badgeClasses = "bg-success text-success-foreground";
                          badgeContent = "✓";
                        } else if (isSelected && !isCorrect) {
                          optionClasses = "border-destructive bg-destructive/10";
                          badgeClasses = "bg-destructive text-destructive-foreground";
                          badgeContent = "✗";
                        }
                      } else if (hasAnswered && !canRetry) {
                        // Can't retry (maxed out) - show the final state
                        if (isCorrect) {
                          optionClasses = "border-success bg-success/10";
                          badgeClasses = "bg-success text-success-foreground";
                          badgeContent = "✓";
                        } else if (isSelected && !isCorrect) {
                          optionClasses = "border-destructive bg-destructive/10";
                          badgeClasses = "bg-destructive text-destructive-foreground";
                          badgeContent = "✗";
                        }
                      } else if (showAnswer && isCorrect) {
                        // User clicked "Show Answer" button - highlight correct answer
                        optionClasses = "border-success bg-success/10";
                        badgeClasses = "bg-success text-success-foreground";
                        badgeContent = "✓";
                      }
                      // If canRetry && !justAnswered && !showAnswer: show normal options (no feedback)

                      // Clickable if:
                      // 1. Not answered yet, OR
                      // 2. Answered wrong and can retry (attempts < 4)
                      // AND not currently submitting AND not just answered this moment
                      const isClickable = (!hasAnswered || canRetry) && !isSubmitting && !justAnswered;

                      return (
                        <div
                          key={index}
                          onClick={() => isClickable && handleOptionClick(option, canRetry)}
                          className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${isClickable ? "cursor-pointer" : ""} ${optionClasses}`}
                        >
                          <div className="flex-1 text-sm" dir="auto">
                            <MarkdownRenderer content={option} />
                          </div>
                          
                          <span className={`flex items-center justify-center size-6 rounded text-xs font-medium shrink-0 ${badgeClasses}`}>
                            {badgeContent}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {isSubmitting && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-sm">جاري التحقق...</span>
                    </div>
                  )}

                  {/* Justification - shown immediately after answering (justAnswered) */}
                  {justAnswered && currentQuestion.answered && currentQuestion.justification && (
                    <div className="rounded-lg bg-muted/50 border p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">الشرح</span>
                      </div>
                      <div className="text-sm leading-relaxed" dir="auto">
                        <MarkdownRenderer content={currentQuestion.justification} />
                      </div>
                    </div>
                  )}



                  {/* Hint Box - only shown BEFORE answering */}
                  {!currentQuestion.answered && !justAnswered && (
                    <>
                      {!showHint ? (
                        <button
                          onClick={() => setShowHint(true)}
                          className="w-full rounded-lg border border-secondary/30 p-3 text-sm hover:bg-muted/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <Lightbulb className="size-4 text-secondary" />
                          <span>عرض التلميح</span>
                        </button>
                      ) : (
                        <div className="rounded-lg bg-muted/50 border border-secondary/30 p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="size-4 text-secondary shrink-0" />
                            <span className="text-sm font-medium">تلميح</span>
                          </div>
                          <div className="text-sm leading-relaxed" dir="auto">
                            {currentQuestion.hint ? (
                              <MarkdownRenderer content={currentQuestion.hint} />
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
                <div className="border-t px-4 py-3 flex items-center gap-2 bg-muted/30">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToQuestion(currentIndex - 1)}
                    disabled={currentIndex <= 0}
                    className="h-8"
                  >
                    <ChevronRight className="size-4 me-1" />
                    السابق
                  </Button>

                  <div className="flex-1 relative">
                    <MessageSquare className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="اسأل المساعد الذكي..." className="ps-10 h-8 text-sm" disabled />
                  </div>

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
                    <ChevronLeft className="size-4 ms-1" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Topics Sidebar */}
      <div className="w-72 lg:w-80 shrink-0 border-e flex flex-col min-h-0 overflow-hidden hidden md:flex bg-card">
        <div className="px-3 py-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">المواضيع</h3>
            <span className="text-xs text-muted-foreground">{selectedTopics.size} من {practiceState?.topics.length ?? 0}</span>
          </div>
          
          <div className="flex gap-1">
            <Button variant="default" size="sm" onClick={selectAll} className="flex-1 h-8">الكل</Button>
            <Button variant="outline" size="sm" onClick={deselectAll} className="flex-1 h-8">لا شيء</Button>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {(["all", "recommended", "new", "mastered", "needs_work"] as TopicFilter[]).map(f => (
              <Button 
                key={f}
                variant={topicFilter === f ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setTopicFilter(f)}
                className="h-7 text-xs px-2"
              >
                {f === "all" ? "الكل" : f === "recommended" ? "موصى به" : f === "new" ? "جديد" : f === "mastered" ? "متقن" : "يحتاج تحسين"}
              </Button>
            ))}
          </div>
          
          <Input
            placeholder="بحث..."
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredTopics.map(topic => {
            const isSelected = selectedTopics.has(topic.slug);
            const hasStats = topic.correct_count > 0 || topic.wrong_count > 0;
            const isRecommended = topic.is_due || topic.is_weak;
            
            return (
              <div
                key={topic.slug}
                onClick={() => toggleTopic(topic.slug)}
                className={`
                  flex items-center gap-2 rounded-lg p-2.5 min-h-12 cursor-pointer transition-all border
                  ${isSelected 
                    ? "bg-primary/10 border-primary/40" 
                    : "bg-muted border-muted hover:bg-muted/80"
                  }
                `}
              >
                {/* Selection dot - orange if recommended */}
                <span className={`size-2.5 rounded-full shrink-0 ${
                  isRecommended ? "bg-amber-500" : isSelected ? "bg-primary" : "bg-muted-foreground/40"
                }`} />
                
                <span className="flex-1 text-sm leading-relaxed" dir="auto">
                  {topic.name}
                </span>
                
                {hasStats && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    {topic.correct_count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success font-medium">
                        ✓{topic.correct_count}
                      </span>
                    )}
                    {topic.wrong_count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium">
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
