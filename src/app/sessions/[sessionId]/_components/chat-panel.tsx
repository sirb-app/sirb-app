"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ChatRuntimeProvider } from "@/components/chat/chat-runtime-provider";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/use-media-query";
import { FileText, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { SessionData } from "./session-client";

const SlideViewer = dynamic(
  () => import("./slide-viewer").then((mod) => mod.SlideViewer),
  { ssr: false }
);

interface ChatPanelProps {
  session: SessionData;
  showSlides: boolean;
  setShowSlides: (show: boolean) => void;
}

export function ChatPanel({ session, showSlides, setShowSlides }: ChatPanelProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const chapterIds = useMemo(
    () => session.chapters.map((c) => c.id),
    [session.chapters]
  );

  return (
    <ChatRuntimeProvider
      subjectId={session.subject.id}
      chapterIds={chapterIds}
      studyPlanId={session.id}
    >
      <div className="relative flex h-full flex-col overflow-hidden text-right">
        <div className="flex items-center justify-end border-b px-4 py-2 shrink-0">
          <Button
            variant={showSlides ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowSlides(!showSlides)}
            className="gap-2"
            aria-label={showSlides ? "إخفاء الملفات" : "عرض الملفات"}
            aria-pressed={showSlides}
          >
            <FileText className="size-4" />
            الملفات
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {isDesktop ? (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel
                id="chat-panel"
                order={1}
                defaultSize={showSlides ? 50 : 100}
                minSize={30}
              >
                <Thread />
              </ResizablePanel>
              {showSlides && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel
                    id="slide-panel"
                    order={2}
                    defaultSize={50}
                    minSize={25}
                    maxSize={70}
                    className="bg-muted/30"
                  >
                    <SlideViewer studyPlanId={session.id} chapters={session.chapters} />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          ) : (
            <>
              <div className="h-full overflow-hidden">
                <Thread />
              </div>
              <div className={`bg-background absolute inset-0 z-50 flex flex-col ${showSlides ? "" : "hidden"}`}>
                <div className="flex items-center justify-between border-b px-3 py-2 shrink-0">
                  <span className="font-medium text-right w-full">الملفات</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSlides(false)}
                    aria-label="إغلاق عرض الملفات"
                  >
                    <X className="size-5" />
                  </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <SlideViewer studyPlanId={session.id} chapters={session.chapters} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ChatRuntimeProvider>
  );
}
