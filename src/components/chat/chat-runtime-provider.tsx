"use client";

import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ChatModelRunResult,
  type ExportedMessageRepository,
  type ThreadHistoryAdapter,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { Message, Thread } from "@/lib/chat-api";
import { parseSSEStream } from "@/lib/chat-api";

interface ChatContextValue {
  subjectId: number;
  chapterIds?: number[];
  studyPlanId?: string;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within ChatRuntimeProvider");
  }
  return ctx;
}

function convertMessagesToRepository(
  messages: Message[]
): ExportedMessageRepository {
  if (messages.length === 0) {
    return { messages: [] };
  }

  let parentId: string | null = null;
  const repoMessages = messages.map((m) => {
    const baseContent = [{ type: "text" as const, text: m.content }];

    let message;
    if (m.role === "user") {
      message = {
        id: m.id,
        createdAt: new Date(m.created_at),
        role: "user" as const,
        content: baseContent,
        metadata: { custom: {} },
        attachments: [],
      };
    } else {
      message = {
        id: m.id,
        createdAt: new Date(m.created_at),
        role: "assistant" as const,
        content: baseContent,
        status: { type: "complete" as const, reason: "stop" as const },
        metadata: {
          unstable_state: undefined,
          unstable_annotations: [],
          unstable_data: [],
          steps: [],
          custom: {},
        },
      };
    }

    const item = {
      message,
      parentId,
    };
    parentId = m.id;
    return item;
  });

  return {
    headId: messages.length > 0 ? messages[messages.length - 1].id : null,
    messages: repoMessages as ExportedMessageRepository["messages"],
  };
}

async function getOrCreateThread(
  subjectId: number,
  chapterIds?: number[],
  studyPlanId?: string
): Promise<Thread> {
  // Try to get existing thread for this study plan
  if (studyPlanId) {
    const listRes = await fetch(
      `/api/chat/threads?subject_id=${subjectId}&study_plan_id=${studyPlanId}&include_archived=false`
    );
    if (listRes.ok) {
      const threads: Thread[] = await listRes.json();
      if (threads.length > 0) {
        return threads[0];
      }
    }
  }

  // Create new thread
  const response = await fetch("/api/chat/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject_id: subjectId,
      chapter_ids: chapterIds,
      study_plan_id: studyPlanId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create thread");
  }

  return await response.json();
}

function createChatModelAdapter(
  getThreadId: () => string | null
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }): AsyncGenerator<ChatModelRunResult> {
      const threadId = getThreadId();
      if (!threadId) {
        throw new Error("Thread not initialized");
      }

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "user") {
        throw new Error("Expected user message");
      }

      const content = lastMessage.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n");

      const response = await fetch(
        `/api/chat/threads/${threadId}/messages/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
          signal: abortSignal,
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      let fullText = "";

      for await (const event of parseSSEStream(response)) {
        if (event.type === "delta") {
          const delta = (event.data as { content: string }).content;
          fullText += delta;
          yield { content: [{ type: "text", text: fullText }] };
        } else if (event.type === "done") {
          yield { content: [{ type: "text", text: fullText }] };
        }
      }
    },
  };
}

interface ChatRuntimeProviderProps {
  children: ReactNode;
  subjectId: number;
  chapterIds?: number[];
  studyPlanId?: string;
}

export function ChatRuntimeProvider({
  children,
  subjectId,
  chapterIds,
  studyPlanId,
}: ChatRuntimeProviderProps) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<
    ExportedMessageRepository | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contextValue = useMemo(
    () => ({ subjectId, chapterIds, studyPlanId }),
    [subjectId, chapterIds, studyPlanId]
  );

  const chapterIdsKey = chapterIds ? JSON.stringify(chapterIds) : undefined;

  // Initialize thread on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setIsLoading(true);
        setError(null);

        const thread = await getOrCreateThread(subjectId, chapterIds, studyPlanId);
        if (cancelled) return;
        setThreadId(thread.id);

        // Load existing messages
        const res = await fetch(`/api/chat/threads/${thread.id}`);
        if (res.ok) {
          const data: { thread: Thread; messages: Message[] } = await res.json();
          if (!cancelled) {
            setInitialMessages(convertMessagesToRepository(data.messages));
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to initialize chat");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, chapterIdsKey, studyPlanId]);

  const adapter = useMemo(
    () => createChatModelAdapter(() => threadId),
    [threadId]
  );

  const history = useMemo<ThreadHistoryAdapter>(
    () => ({
      async load(): Promise<ExportedMessageRepository> {
        return initialMessages ?? { messages: [] };
      },
      async append() {},
    }),
    [initialMessages]
  );

  const runtime = useLocalRuntime(adapter, { adapters: { history } });

  if (isLoading) {
    return (
      <ChatContext.Provider value={contextValue}>
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground text-sm">جاري التحميل...</div>
        </div>
      </ChatContext.Provider>
    );
  }

  if (error) {
    return (
      <ChatContext.Provider value={contextValue}>
        <div className="flex h-full items-center justify-center">
          <div className="text-destructive text-sm">{error}</div>
        </div>
      </ChatContext.Provider>
    );
  }

  return (
    <ChatContext.Provider value={contextValue}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatContext.Provider>
  );
}
