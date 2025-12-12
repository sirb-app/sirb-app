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

  return (
    <div className="flex h-screen flex-col" dir="rtl">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link
                href={`/subjects/${session.subject.id}`}
                aria-label="العودة إلى المادة"
              >
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold">{session.title}</h1>
                <Badge variant="secondary" className="text-xs">
                  {session.subject.code}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {session.subject.name}
              </p>
              {session.chapters.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {session.chapters.map(ch => (
                    <Badge key={ch.id} variant="outline" className="text-xs">
                      {ch.sequence}. {ch.title}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <nav className="flex gap-1">
            <Button
              variant={view === "chat" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("chat")}
              className="gap-2"
            >
              <MessageSquare className="size-4" />
              <span className="hidden sm:inline">المحادثة</span>
            </Button>
            <Button
              variant={view === "quiz" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("quiz")}
              className="gap-2"
            >
              <BookOpenText className="size-4" />
              <span className="hidden sm:inline">الاختبارات</span>
            </Button>
            <Button
              variant={view === "flashcards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("flashcards")}
              className="gap-2"
            >
              <CreditCard className="size-4" />
              <span className="hidden sm:inline">البطاقات</span>
            </Button>
          </nav>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "chat" && <ChatPanel session={session} />}
        {view === "quiz" && (
          <QuizPanel
            session={session}
            placementCompleted={session.placementCompleted}
          />
        )}
        {view === "flashcards" && <FlashcardsPanel session={session} />}
      </div>
    </div>
  );
}
