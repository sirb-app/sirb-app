"use client";

import {
  ArrowRight,
  BookOpenText,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "./chat-panel";
import { FlashcardsPanel } from "./flashcards-panel";
import { QuizPanel } from "./quiz-panel";

export type SessionData = {
  id: string;
  title: string;
  placementCompleted: boolean;
  subject: {
    id: number;
    name: string;
    code: string;
  };
  chapters: {
    id: number;
    title: string;
    sequence: number;
  }[];
  stats: {
    topicsMastered: number;
    topicsInProgress: number;
    totalTopics: number;
    quizzesCompleted: number;
    flashcardsReviewed: number;
  };
};

interface SessionClientProps {
  session: SessionData;
}

export function SessionClient({ session }: SessionClientProps) {
  const [view, setView] = useState<"chat" | "quiz" | "flashcards">("chat");
  const [showSlides, setShowSlides] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden" dir="rtl">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link
                href={`/subjects/${session.subject.id}`}
                aria-label="العودة إلى المادة"
              >
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold">{session.title}</h1>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {session.subject.code}
                </Badge>
              </div>
              <p className="text-muted-foreground truncate text-xs">
                {session.subject.name}
              </p>
              {session.chapters.length > 0 && (
                <div className="mt-1 hidden flex-wrap gap-1 sm:flex">
                  {session.chapters.map(ch => (
                    <Badge key={ch.id} variant="outline" className="text-xs">
                      {ch.sequence}. {ch.title}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <nav className="flex shrink-0 gap-1" role="tablist" aria-label="أقسام الجلسة">
            <Button
              variant={view === "chat" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("chat")}
              className="gap-2"
              role="tab"
              id="tab-chat"
              aria-selected={view === "chat"}
              aria-controls="panel-chat"
            >
              <MessageSquare className="size-4" />
              <span className="hidden sm:inline">المحادثة</span>
            </Button>
            <Button
              variant={view === "quiz" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("quiz")}
              className="gap-2"
              role="tab"
              id="tab-quiz"
              aria-selected={view === "quiz"}
              aria-controls="panel-quiz"
            >
              <BookOpenText className="size-4" />
              <span className="hidden sm:inline">الاختبارات</span>
            </Button>
            <Button
              variant={view === "flashcards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("flashcards")}
              className="gap-2"
              role="tab"
              id="tab-flashcards"
              aria-selected={view === "flashcards"}
              aria-controls="panel-flashcards"
            >
              <CreditCard className="size-4" />
              <span className="hidden sm:inline">البطاقات</span>
            </Button>
          </nav>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "chat" && (
          <div
            role="tabpanel"
            id="panel-chat"
            aria-labelledby="tab-chat"
            className="h-full"
          >
            <ChatPanel session={session} showSlides={showSlides} setShowSlides={setShowSlides} />
          </div>
        )}
        {view === "quiz" && (
          <div
            role="tabpanel"
            id="panel-quiz"
            aria-labelledby="tab-quiz"
            className="h-full"
          >
            <QuizPanel session={session} />
          </div>
        )}
        {view === "flashcards" && (
          <div
            role="tabpanel"
            id="panel-flashcards"
            aria-labelledby="tab-flashcards"
            className="h-full"
          >
            <FlashcardsPanel session={session} />
          </div>
        )}
      </div>
    </div>
  );
}
