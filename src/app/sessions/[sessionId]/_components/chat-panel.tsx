"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { ChatRuntimeProvider } from "@/components/chat/chat-runtime-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { SessionData } from "./session-client";

interface ChatPanelProps {
  session: SessionData;
}

export function ChatPanel({ session }: ChatPanelProps) {
  return (
    <ChatRuntimeProvider
      subjectId={session.subject.id}
      chapterIds={session.chapters.map(c => c.id)}
      studyPlanId={session.id}
    >
      <div className="flex h-full">
        <div className="bg-muted/30 hidden w-80 border-l md:block">
          <ScrollArea className="h-full">
            <div className="border-b p-3">
              <p className="text-sm font-medium">المحادثات</p>
            </div>
            <ThreadList />
          </ScrollArea>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="border-b p-2 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="ml-2 size-4" />
                  المحادثات
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>المحادثات</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <ThreadList />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="h-full flex-1 overflow-hidden">
            <Thread />
          </div>
        </div>
      </div>
    </ChatRuntimeProvider>
  );
}
