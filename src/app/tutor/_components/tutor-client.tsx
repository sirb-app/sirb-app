"use client";

import {
  BookOpen,
  ExternalLink,
  GraduationCap,
  Menu,
  MessageSquare,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { ChatRuntimeProvider } from "@/components/chat/chat-runtime-provider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Subject = {
  id: number;
  name: string;
  code: string;
  chapters: {
    id: number;
    title: string;
    sequence: number;
  }[];
};

interface TutorClientProps {
  subjects: Subject[];
}

export function TutorClient({ subjects }: TutorClientProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    null
  );
  const [selectedChapterIds, setSelectedChapterIds] = useState<number[]>([]);
  // Start with sidebar hidden on mobile
  const [showSidebar, setShowSidebar] = useState(false);
  // Key to force remount of ChatRuntimeProvider when subject changes
  const [runtimeKey, setRuntimeKey] = useState(0);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // No subjects enrolled
  if (subjects.length === 0) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center"
        dir="rtl"
      >
        <GraduationCap className="text-muted-foreground size-16" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">لم تسجل في أي مادة بعد</h1>
          <p className="text-muted-foreground">
            سجّل في المواد الدراسية لتتمكن من استخدام المعلم الذكي
          </p>
        </div>
        <Button asChild>
          <Link href="/subjects">استعراض المواد</Link>
        </Button>
      </div>
    );
  }

  // No subject selected - show subject selector
  if (!selectedSubjectId) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-8 p-8"
        dir="rtl"
      >
        <div className="space-y-2 text-center">
          <MessageSquare className="text-primary mx-auto size-12" />
          <h1 className="text-3xl font-bold">المعلم الذكي</h1>
          <p className="text-muted-foreground">
            اختر المادة التي تريد المساعدة فيها
          </p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          {subjects.map(subject => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubjectId(subject.id)}
              className="group bg-card hover:border-primary hover:bg-accent flex flex-col gap-2 rounded-xl border p-6 text-start transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="text-primary size-5" />
                <span className="text-muted-foreground font-mono text-sm">
                  {subject.code}
                </span>
              </div>
              <h3 className="group-hover:text-primary text-lg font-semibold">
                {subject.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {subject.chapters.length} فصل
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Subject selected - show chat interface
  return (
    <ChatRuntimeProvider
      key={`${selectedSubjectId}-${runtimeKey}`}
      subjectId={selectedSubjectId}
      chapterIds={
        selectedChapterIds.length > 0 ? selectedChapterIds : undefined
      }
    >
      <div className="flex h-dvh overflow-hidden" dir="rtl">
        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div
            className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "bg-muted/30 fixed inset-y-0 right-0 z-50 flex h-full w-80 flex-col border-l transition-transform duration-300 md:static md:translate-x-0",
            showSidebar ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between border-b p-4">
            <Link href="/" className="text-foreground text-xl font-bold">
              سرب
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowSidebar(false)}
              aria-label="إغلاق القائمة الجانبية"
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Subject Selector */}
          <div className="space-y-4 border-b p-4">
            <Select
              value={String(selectedSubjectId)}
              onValueChange={v => {
                const newSubjectId = Number(v);
                setSelectedSubjectId(newSubjectId);
                setSelectedChapterIds([]);
                // Force remount of runtime to reset thread list
                setRuntimeKey(prev => prev + 1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المادة" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={String(subject.id)}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Link to subject page */}
            {selectedSubject && (
              <Link
                href={`/subjects/${selectedSubject.id}`}
                className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm transition-colors"
              >
                <ExternalLink className="size-4" />
                الذهاب إلى صفحة المادة
              </Link>
            )}

            {/* Chapter Filter */}
            {selectedSubject && selectedSubject.chapters.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">
                  تصفية حسب الفصل (اختياري)
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSubject.chapters.map(chapter => {
                    const isSelected = selectedChapterIds.includes(chapter.id);
                    return (
                      <button
                        key={chapter.id}
                        onClick={() => {
                          setSelectedChapterIds(prev =>
                            isSelected
                              ? prev.filter(id => id !== chapter.id)
                              : [...prev, chapter.id]
                          );
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:border-primary hover:text-primary"
                        )}
                      >
                        الفصل {chapter.sequence}
                      </button>
                    );
                  })}
                </div>
                {selectedChapterIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedChapterIds([])}
                    className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs"
                  >
                    مسح التصفية
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto p-4">
            <ThreadList />
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="flex shrink-0 items-center gap-4 border-b px-4 py-3">
            {/* Mobile menu button - only visible on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
              aria-label="فتح القائمة الجانبية"
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-semibold">
                {selectedSubject?.name}
              </h1>
              {selectedChapterIds.length > 0 && (
                <p className="text-muted-foreground truncate text-xs">
                  الفصول: {selectedChapterIds.length} محدد
                </p>
              )}
            </div>
          </header>

          {/* Chat Thread - Fixed height with overflow */}
          <div className="min-h-0 flex-1">
            <Thread />
          </div>
        </main>
      </div>
    </ChatRuntimeProvider>
  );
}
