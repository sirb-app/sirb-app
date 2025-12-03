"use client";

import {
  AssistantRuntimeProvider,
  RuntimeAdapterProvider,
  useAssistantApi,
  useAssistantState,
  useLocalRuntime,
  unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
  type ChatModelAdapter,
  type ChatModelRunResult,
  type ExportedMessageRepository,
  type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
} from "@assistant-ui/react";
import { createAssistantStream } from "assistant-stream";
import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

import type { Message, Thread } from "@/lib/chat-api";
import { parseSSEStream } from "@/lib/chat-api";

interface ChatContextValue {
  subjectId: number;
  chapterIds?: number[];
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within ChatRuntimeProvider");
  }
  return ctx;
}

function createChatModelAdapter(
  getThreadId: () => Promise<string>
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }): AsyncGenerator<ChatModelRunResult> {
      const threadId = await getThreadId();

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "user") {
        throw new Error("Expected user message");
      }

      const content = lastMessage.content
        .filter(c => c.type === "text")
        .map(c => c.text)
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

function convertMessagesToRepository(
  messages: Message[]
): ExportedMessageRepository {
  if (messages.length === 0) {
    return { messages: [] };
  }

  let parentId: string | null = null;
  const repoMessages = messages.map(m => {
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

function createThreadListAdapter(
  subjectId: number,
  chapterIds?: number[]
): RemoteThreadListAdapter {
  return {
    async list() {
      const params = new URLSearchParams();
      params.set("subject_id", String(subjectId));
      params.set("include_archived", "false");

      const response = await fetch(`/api/chat/threads?${params}`);
      if (!response.ok) {
        throw new Error("Failed to list threads");
      }

      const threads: Thread[] = await response.json();

      return {
        threads: threads.map(t => ({
          status: t.is_archived ? ("archived" as const) : ("regular" as const),
          remoteId: t.id,
          title: t.title || undefined,
        })),
      };
    },

    async initialize(_threadId: string) {
      const response = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: subjectId,
          chapter_ids: chapterIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create thread");
      }

      const thread: Thread = await response.json();
      return {
        remoteId: thread.id,
        externalId: thread.id,
      };
    },

    async fetch(threadId: string) {
      const response = await fetch(`/api/chat/threads/${threadId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch thread");
      }

      const data: { thread: Thread } = await response.json();
      return {
        status: data.thread.is_archived
          ? ("archived" as const)
          : ("regular" as const),
        remoteId: data.thread.id,
        externalId: data.thread.id,
        title: data.thread.title || undefined,
      };
    },

    async rename(remoteId: string, newTitle: string) {
      const response = await fetch(`/api/chat/threads/${remoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename thread");
      }
    },

    async archive(remoteId: string) {
      const response = await fetch(`/api/chat/threads/${remoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive thread");
      }
    },

    async unarchive(remoteId: string) {
      const response = await fetch(`/api/chat/threads/${remoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: false }),
      });

      if (!response.ok) {
        throw new Error("Failed to unarchive thread");
      }
    },

    async delete(remoteId: string) {
      const response = await fetch(`/api/chat/threads/${remoteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete thread");
      }
    },

    async generateTitle(remoteId: string, messages) {
      const firstUserMessage = messages.find(m => m.role === "user");
      const title = firstUserMessage
        ? firstUserMessage.content
            .filter(c => c.type === "text")
            .map(c => c.text)
            .join(" ")
            .slice(0, 50)
        : "محادثة جديدة";

      const response = await fetch(`/api/chat/threads/${remoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error("Failed to update thread title");
      }

      return createAssistantStream(controller => {
        controller.appendText(title);
        controller.close();
      });
    },

    unstable_Provider: ({ children }) => {
      const remoteId = useAssistantState(
        ({ threadListItem }) => threadListItem?.remoteId ?? null
      );

      const history = useMemo<ThreadHistoryAdapter>(
        () => ({
          async load(): Promise<ExportedMessageRepository> {
            if (!remoteId) return { messages: [] };

            const response = await fetch(`/api/chat/threads/${remoteId}`);
            if (!response.ok) {
              return { messages: [] };
            }

            const data: { thread: Thread; messages: Message[] } =
              await response.json();
            return convertMessagesToRepository(data.messages);
          },

          async append() {},
        }),
        [remoteId]
      );

      const adapters = useMemo(() => ({ history }), [history]);

      return (
        <RuntimeAdapterProvider adapters={adapters}>
          {children}
        </RuntimeAdapterProvider>
      );
    },
  };
}

interface ChatRuntimeProviderProps {
  children: ReactNode;
  subjectId: number;
  chapterIds?: number[];
}

export function ChatRuntimeProvider({
  children,
  subjectId,
  chapterIds,
}: ChatRuntimeProviderProps) {
  const contextValue = useMemo(
    () => ({ subjectId, chapterIds }),
    [subjectId, chapterIds]
  );

  const threadListAdapter = useMemo(
    () => createThreadListAdapter(subjectId, chapterIds),
    [subjectId, chapterIds]
  );

  const runtime = useRemoteThreadListRuntime({
    runtimeHook: () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const api = useAssistantApi();

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [adapter] = useState(() =>
        createChatModelAdapter(async () => {
          const { remoteId } = await api.threadListItem().initialize();
          return remoteId;
        })
      );

      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useLocalRuntime(adapter);
    },
    adapter: threadListAdapter,
  });

  return (
    <ChatContext.Provider value={contextValue}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatContext.Provider>
  );
}
