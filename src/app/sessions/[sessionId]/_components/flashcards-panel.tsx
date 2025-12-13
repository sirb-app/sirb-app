"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Info,
  List,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DeckManager } from "./deck-manager";
import { SessionData } from "./session-client";

import { Thread } from "@/components/assistant-ui/thread";
import { EphemeralChatRuntimeProvider } from "@/components/chat/ephemeral-chat-runtime-provider";

function TopicCombobox({
  topics,
  value,
  onValueChange,
  placeholder,
  includeNone,
}: {
  topics: Topic[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  includeNone?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    value === "none" ? "بدون موضوع" : topics.find(t => t.slug === value)?.name;

  const items: Array<{ slug: string; name: string }> = includeNone
    ? [{ slug: "none", name: "بدون موضوع" }, ...topics]
    : topics;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate" dir="auto">
            {selectedLabel ?? placeholder}
          </span>
          <ChevronsUpDown className="text-muted-foreground ml-2 size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command dir="rtl" className="max-h-72">
          <CommandInput placeholder="بحث في المواضيع..." />
          <CommandList
            className="max-h-60 overflow-y-auto overscroll-contain"
            onWheel={e => {
              // Keep wheel scrolling inside the dropdown.
              e.stopPropagation();
            }}
          >
            <CommandEmpty>لا توجد نتائج</CommandEmpty>
            <CommandGroup>
              {items.map(item => {
                const active = value === item.slug;
                return (
                  <CommandItem
                    key={item.slug}
                    value={`${item.slug} ${item.name}`}
                    onSelect={() => {
                      onValueChange(item.slug);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate" dir="auto">
                      {item.name}
                    </span>
                    {active && <Check className="size-4" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface Flashcard {
  id: number;
  front: string;
  back: string;
  topic_slug: string;
  due_at: string | null;
  review_count: number;
}

interface Topic {
  slug: string;
  name: string;
}

interface FlashcardsPanelProps {
  session: SessionData;
}

interface FlashcardStats {
  total_cards: number;
  due_now: number;
  due_today: number;
  reviewed_today: number;
  next_due_at: string | null;
}

// Rating labels in Arabic with their numeric values
const RATINGS = [
  {
    label: "مرة أخرى",
    value: 1,
    color: "bg-red-500/10 hover:bg-red-500/20 border-red-500/30",
  },
  {
    label: "صعبة",
    value: 2,
    color: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30",
  },
  {
    label: "جيدة",
    value: 3,
    color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/30",
  },
  {
    label: "سهلة",
    value: 4,
    color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30",
  },
];

export function FlashcardsPanel({ session }: FlashcardsPanelProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualFront, setManualFront] = useState("");
  const [manualBack, setManualBack] = useState("");
  const [manualTopic, setManualTopic] = useState("none");
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [showDeckManager, setShowDeckManager] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);

  const [cardChatOpen, setCardChatOpen] = useState(false);

  // Inline editing state
  const [editingCard, setEditingCard] = useState(false);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const card = cards[idx];

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
  };

  // Fetch due flashcards
  const fetchDueCards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/flashcards/due/${session.id}?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setCards(data.flashcards || []);
        setIdx(0);
        setFlipped(false);
      }
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats for completion screen
  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/flashcards/stats/${session.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // Fetch topics for this study plan
  const fetchTopics = async () => {
    try {
      const res = await fetch(`/api/flashcards/topics/${session.id}`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
      }
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    }
  };

  // Fetch all cards for deck manager
  const fetchAllCards = async () => {
    try {
      const res = await fetch(`/api/flashcards/${session.id}`);
      if (res.ok) {
        const data = await res.json();
        setAllCards(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch all cards:", error);
    }
  };

  // Start a practice session (does not update scheduling)
  const startPracticeSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/flashcards/${session.id}`);
      if (res.ok) {
        const data = (await res.json()) as Flashcard[];
        const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setIdx(0);
        setFlipped(false);
      }
    } catch (error) {
      console.error("Failed to start practice session:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueCards();
    fetchTopics();
    fetchStats();
    fetchAllCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  // Generate flashcards for a topic
  const generateCards = async (topicSlug?: string) => {
    const topic = topicSlug ?? selectedTopic;
    if (!topic) return;

    try {
      setGenerating(true);
      const res = await fetch(`/api/flashcards/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_plan_id: session.id,
          topic_slug: topic,
          count: 1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Add new cards to the deck
        setCards(prev => [...prev, ...(data.flashcards || [])]);
        setDialogOpen(false);
        setSelectedTopic("");
        fetchAllCards();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
    } finally {
      setGenerating(false);
    }
  };

  // Create a single manual flashcard
  const createManualCard = async () => {
    if (!manualFront.trim() || !manualBack.trim() || creating) return;

    try {
      setCreating(true);
      const res = await fetch(`/api/flashcards/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_plan_id: session.id,
          front: manualFront.trim(),
          back: manualBack.trim(),
          topic_slug:
            manualTopic && manualTopic !== "none" ? manualTopic : "general",
        }),
      });

      if (res.ok) {
        const card = await res.json();
        setCards(prev => [...prev, card]);
        setManualFront("");
        setManualBack("");
        setManualTopic("none");
        setDialogOpen(false);
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to create flashcard:", error);
    } finally {
      setCreating(false);
    }
  };

  // Submit rating for current card (skip FSRS in practice mode)
  const rate = async (rating: number) => {
    const card = cards[idx];
    if (!card || reviewing) return;

    // In practice mode, just move to next card without updating FSRS
    if (practiceMode) {
      setCards(prev => prev.filter((_, i) => i !== idx));
      if (idx >= cards.length - 1 && idx > 0) {
        setIdx(idx - 1);
      }
      setFlipped(false);
      return;
    }

    // Study mode: update FSRS scheduling
    try {
      setReviewing(true);
      const res = await fetch(`/api/flashcards/${card.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (res.status === 409) {
        // Server-side guard: don't allow scheduled reviews when not due.
        // Refresh the due list to keep the UI in sync.
        await fetchDueCards();
        await fetchStats();
        alert("هذه البطاقة ليست مستحقة للمراجعة الآن");
        return;
      }

      if (res.ok) {
        // Remove card from due list (it's now scheduled for later)
        setCards(prev => prev.filter((_, i) => i !== idx));

        // Adjust index if needed
        if (idx >= cards.length - 1 && idx > 0) {
          setIdx(idx - 1);
        }
        setFlipped(false);

        // Refresh stats to get updated next_due_at
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to rate flashcard:", error);
    } finally {
      setReviewing(false);
    }
  };

  // Delete a flashcard
  const deleteCard = async () => {
    if (!card || deleting) return;

    if (!confirm("هل تريد حذف هذه البطاقة؟")) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/flashcards/${card.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCards(prev => prev.filter((_, i) => i !== idx));
        if (idx >= cards.length - 1 && idx > 0) {
          setIdx(idx - 1);
        }
        setFlipped(false);
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error("Failed to delete flashcard:", error);
    } finally {
      setDeleting(false);
    }
  };

  // Start editing current card
  const startEdit = () => {
    if (!card) return;
    setEditFront(card.front);
    setEditBack(card.back);
    setEditingCard(true);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingCard(false);
    setEditFront("");
    setEditBack("");
  };

  // Save card edit
  const saveEdit = async () => {
    if (!card || !editFront.trim() || !editBack.trim()) return;

    try {
      setSavingEdit(true);
      const res = await fetch(`/api/flashcards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: editFront.trim(),
          back: editBack.trim(),
        }),
      });

      if (res.ok) {
        // Update the card in local state
        setCards(prev =>
          prev.map((c, i) =>
            i === idx
              ? { ...c, front: editFront.trim(), back: editBack.trim() }
              : c
          )
        );
        cancelEdit();
      }
    } catch (error) {
      console.error("Failed to save edit:", error);
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    setCardChatOpen(false);
  }, [card?.id]);

  const hasPrev = idx > 0;
  const hasNext = idx < cards.length - 1;

  // Helper to format relative time (dates are stored in UTC)
  const formatNextDue = (isoDate: string | null) => {
    if (!isoDate) return null;
    // Ensure date is interpreted as UTC (append Z if not present)
    const utcDate = isoDate.endsWith("Z") ? isoDate : isoDate + "Z";
    const due = new Date(utcDate);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `خلال ${diffMins} دقيقة`;
    if (diffHrs < 24) return `خلال ${diffHrs} ساعة`;
    return `خلال ${Math.round(diffHrs / 24)} يوم`;
  };

  // Empty state with stats - but allow deck manager to be shown
  if (!loading && cards.length === 0 && !showDeckManager) {
    const hasCards = stats && stats.total_cards > 0;

    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
        {hasCards ? (
          <>
            {/* Completion message */}
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-green-500/10">
                <Sparkles className="size-8 text-green-500" />
              </div>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                🎉 أحسنت!
              </p>
              <p className="text-muted-foreground text-sm">
                راجعت جميع البطاقات المستحقة
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid w-full max-w-xs grid-cols-2 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold">{stats.reviewed_today}</p>
                <p className="text-muted-foreground text-xs">
                  تمت مراجعتها اليوم
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold">{stats.total_cards}</p>
                <p className="text-muted-foreground text-xs">إجمالي البطاقات</p>
              </div>
            </div>

            {/* Next due indicator */}
            {stats.next_due_at && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <RefreshCw className="size-4" />
                <span>البطاقات القادمة {formatNextDue(stats.next_due_at)}</span>
              </div>
            )}

            {/* Quick action - just manage */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  setPracticeMode(true);
                  await startPracticeSession();
                }}
                className="gap-1"
              >
                <RefreshCw className="size-4" />
                تدريب الآن
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeckManager(true);
                  fetchAllCards();
                }}
                className="gap-1"
              >
                <Pencil className="size-4" />
                إدارة البطاقات
              </Button>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground text-center">
            <Sparkles className="mx-auto mb-2 size-12 opacity-50" />
            <p className="text-lg font-medium">لا توجد بطاقات للمراجعة</p>
            <p className="text-sm">أنشئ بطاقات جديدة من المواضيع</p>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              variant={hasCards ? "outline" : "default"}
            >
              <Plus className="size-4" />
              إنشاء بطاقات
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء بطاقات تعليمية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2" dir="rtl">
                <TopicCombobox
                  topics={topics}
                  value={selectedTopic}
                  onValueChange={setSelectedTopic}
                  placeholder="اختر موضوعًا..."
                />
              </div>
              <Button
                onClick={() => generateCards(selectedTopic)}
                disabled={!selectedTopic || generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    جارٍ الإنشاء...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-4" />
                    إنشاء بطاقة
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Header with toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={showDeckManager ? "outline" : "default"}
              size="sm"
              onClick={() => setShowDeckManager(false)}
            >
              مراجعة
            </Button>
            <Button
              variant={showDeckManager ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowDeckManager(true);
                fetchAllCards();
              }}
              className="gap-1"
            >
              <List className="size-4" />
              إدارة ({allCards.length})
            </Button>
          </div>

          {/* Practice mode toggle - only show in review mode */}
          {!showDeckManager && (
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-1.5" type="button">
                      <span className="text-muted-foreground text-xs">
                        {practiceMode ? "تدريب" : "مذاكرة"}
                      </span>
                      <Info className="text-muted-foreground size-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-[200px] text-center"
                    dir="rtl"
                  >
                    {practiceMode
                      ? "تدريب فقط - التقييم لا يغيّر مواعيد المراجعة"
                      : "مراجعة مجدولة - التقييم يحدد موعد المراجعة القادم"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Switch
                id="practice-mode"
                checked={practiceMode}
                onCheckedChange={async checked => {
                  setPracticeMode(checked);
                  if (checked) {
                    await startPracticeSession();
                  } else {
                    await fetchDueCards();
                  }
                }}
              />
            </div>
          )}
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="size-4" />
                إضافة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>إضافة بطاقة</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[75vh] pr-1" dir="rtl">
                <div className="space-y-4 pt-2">
                  {/* Topic selector - optional */}
                  <div>
                    <label className="text-muted-foreground mb-1.5 block text-xs">
                      الموضوع (اختياري)
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <TopicCombobox
                          topics={topics}
                          value={manualTopic}
                          onValueChange={setManualTopic}
                          placeholder="بدون موضوع"
                          includeNone
                        />
                      </div>
                      {/* AI Generate button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (manualTopic && manualTopic !== "none") {
                            generateCards(manualTopic);
                            setDialogOpen(false);
                          }
                        }}
                        disabled={
                          !manualTopic || manualTopic === "none" || generating
                        }
                        className="shrink-0 gap-1"
                      >
                        {generating ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                        توليد
                      </Button>
                    </div>
                  </div>

                  {/* Front/Back fields */}
                  <div>
                    <label className="text-muted-foreground mb-1.5 block text-xs">
                      السؤال
                    </label>
                    <Textarea
                      value={manualFront}
                      onChange={e => setManualFront(e.target.value)}
                      placeholder="اكتب السؤال هنا..."
                      dir="auto"
                      className="min-h-[120px]"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground mb-1.5 block text-xs">
                      الإجابة
                    </label>
                    <Textarea
                      value={manualBack}
                      onChange={e => setManualBack(e.target.value)}
                      placeholder="اكتب الإجابة هنا..."
                      dir="auto"
                      className="min-h-[140px]"
                    />
                  </div>

                  <Button
                    onClick={createManualCard}
                    disabled={
                      !manualFront.trim() || !manualBack.trim() || creating
                    }
                    className="w-full"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="ml-2 size-4 animate-spin" />
                        جارٍ الإضافة...
                      </>
                    ) : (
                      <>
                        <Plus className="ml-2 size-4" />
                        إضافة بطاقة
                      </>
                    )}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        {/* Deck Manager View */}
        {showDeckManager ? (
          <DeckManager
            allCards={allCards}
            onCardsChange={() => {
              fetchAllCards();
              fetchDueCards();
              fetchStats();
            }}
          />
        ) : (
          <>
            {/* Stats bar */}
            <div
              className="bg-muted/30 flex items-center justify-between rounded-lg border px-4 py-2 text-sm"
              dir="rtl"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">متبقي: {cards.length}</span>
                {stats && (
                  <span className="text-muted-foreground">
                    أنجزت: {stats.reviewed_today}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground text-xs">
                {idx + 1} / {cards.length}
              </span>
            </div>

            {/* Edit mode */}
            {editingCard ? (
              <div className="bg-card space-y-4 rounded-xl border p-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-muted-foreground mb-1.5 block text-sm">
                      السؤال
                    </label>
                    <Textarea
                      value={editFront}
                      onChange={e => setEditFront(e.target.value)}
                      placeholder="السؤال"
                      dir="auto"
                      className="min-h-[120px]"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground mb-1.5 block text-sm">
                      الإجابة
                    </label>
                    <Textarea
                      value={editBack}
                      onChange={e => setEditBack(e.target.value)}
                      placeholder="الإجابة"
                      dir="auto"
                      className="min-h-[160px]"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveEdit}
                    disabled={
                      !editFront.trim() || !editBack.trim() || savingEdit
                    }
                    className="flex-1 gap-1"
                  >
                    {savingEdit ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    حفظ
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={cancelEdit}
                    className="gap-1"
                  >
                    <X className="size-4" />
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : (
              /* Flashcard with flip animation */
              <div
                className="group relative h-64 w-full cursor-pointer md:h-80"
                onClick={() => setFlipped(!flipped)}
              >
                <div
                  className={cn(
                    "bg-card relative h-full w-full rounded-xl border shadow-sm transition-transform duration-500",
                    flipped && "rotate-y-180"
                  )}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 flex flex-col rounded-xl p-6 backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <CardHeader className="relative p-0">
                      {/* Delete button - left */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive absolute top-0 left-0 size-8"
                        onClick={e => {
                          e.stopPropagation();
                          deleteCard();
                        }}
                        disabled={deleting}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                      {/* Edit button - right */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary absolute top-0 right-0 size-8"
                        onClick={e => {
                          e.stopPropagation();
                          startEdit();
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <CardDescription className="text-center">
                        السؤال
                      </CardDescription>
                    </CardHeader>
                    <CardContent
                      className="flex flex-1 items-center justify-center overflow-auto p-4 text-center"
                      dir="auto"
                    >
                      {card?.front && (
                        <MarkdownRenderer
                          content={card.front}
                          className="text-lg"
                        />
                      )}
                    </CardContent>
                    <div className="text-muted-foreground text-center text-xs">
                      اضغط لإظهار الإجابة
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="bg-primary/5 absolute inset-0 flex rotate-y-180 flex-col rounded-xl border p-6 backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <CardHeader className="p-0">
                      <CardTitle className="text-center text-base">
                        الإجابة
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className="flex flex-1 items-center justify-center overflow-auto p-4 text-center"
                      dir="auto"
                    >
                      {card?.back && (
                        <MarkdownRenderer
                          content={card.back}
                          className="text-base"
                        />
                      )}
                    </CardContent>
                    <div className="text-muted-foreground text-center text-xs">
                      اضغط للعودة
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rating buttons (practice ratings do not affect scheduling) */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RATINGS.map(({ label, value, color }) => (
                <Button
                  key={value}
                  variant="outline"
                  onClick={() => rate(value)}
                  disabled={reviewing}
                  className={cn("text-sm", color)}
                >
                  {reviewing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    label
                  )}
                </Button>
              ))}
            </div>

            {/* Navigation with chat */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => hasPrev && setIdx(idx - 1)}
                disabled={!hasPrev}
                className="shrink-0"
              >
                <ChevronRight className="size-4" />
              </Button>

              <Dialog open={cardChatOpen} onOpenChange={setCardChatOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start gap-2"
                    disabled={!card}
                  >
                    <MessageSquare className="text-muted-foreground size-4" />
                    اسأل عن هذه البطاقة
                  </Button>
                </DialogTrigger>
                <DialogContent
                  forceMount
                  className="flex h-[85dvh] max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
                >
                  <DialogHeader className="border-b p-4">
                    <DialogTitle>اسأل عن هذه البطاقة</DialogTitle>
                  </DialogHeader>
                  <div className="min-h-0 flex-1 p-2">
                    {card && (
                      <EphemeralChatRuntimeProvider
                        key={`flashcard-chat-${card.id}`}
                        endpoint={`/api/flashcards/${card.id}/chat`}
                      >
                        <Thread />
                      </EphemeralChatRuntimeProvider>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="icon"
                onClick={() => hasNext && setIdx(idx + 1)}
                disabled={!hasNext}
                className="shrink-0"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
