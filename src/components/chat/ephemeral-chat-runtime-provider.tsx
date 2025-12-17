"use client";

import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ChatModelRunResult,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";

import { parseSSEStream } from "@/lib/chat-api";

type EphemeralChatTurn = { role: "user" | "assistant"; content: string };

type TextPartLike = { type: string; text?: string };

function messageText(message: {
  content: ReadonlyArray<TextPartLike>;
}): string {
  return message.content
    .filter(c => c.type === "text" && typeof c.text === "string")
    .map(c => c.text)
    .join("\n")
    .trim();
}

function buildHistory(
  messages: ReadonlyArray<{
    role: string;
    content: ReadonlyArray<TextPartLike>;
  }>,
  limit: number
): EphemeralChatTurn[] {
  const turns: EphemeralChatTurn[] = [];

  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const content = messageText(m);
    if (!content) continue;
    turns.push({ role: m.role, content });
  }

  return turns.slice(Math.max(0, turns.length - limit));
}

function createEphemeralChatModelAdapter(
  endpoint: string,
  historyLimit: number
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }): AsyncGenerator<ChatModelRunResult> {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "user") {
        throw new Error("Expected user message");
      }

      const content = messageText(lastMessage);
      if (!content) {
        yield { content: [{ type: "text", text: "" }] };
        return;
      }

      const history = buildHistory(messages.slice(0, -1), historyLimit);

      const streamResponse = await fetch(`${endpoint}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
        signal: abortSignal,
      });

      if (!streamResponse.ok) {
        const fallback = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history }),
          signal: abortSignal,
        });

        if (!fallback.ok) {
          throw new Error("حدث خطأ أثناء الاتصال بالخادم");
        }

        const data = (await fallback.json().catch(() => null)) as {
          content?: unknown;
        } | null;
        const text =
          data && typeof data.content === "string" ? data.content : "";
        yield { content: [{ type: "text", text }] };
        return;
      }

      let fullText = "";

      for await (const event of parseSSEStream(streamResponse)) {
        if (event.type === "delta") {
          const data = event.data as unknown;
          const delta =
            data &&
            typeof data === "object" &&
            "content" in data &&
            typeof (data as { content?: unknown }).content === "string"
              ? (data as { content: string }).content
              : "";
          if (!delta) continue;
          fullText += delta;
          yield { content: [{ type: "text", text: fullText }] };
        } else if (event.type === "done") {
          yield { content: [{ type: "text", text: fullText }] };
        }
      }
    },
  };
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function EphemeralChatRuntimeProvider({
  children,
  endpoint,
  historyLimit = 20,
  initialMessages,
  onMessagesChange,
}: {
  children: ReactNode;
  endpoint: string;
  historyLimit?: number;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}) {
  const adapter = useMemo(
    () => createEphemeralChatModelAdapter(endpoint, historyLimit),
    [endpoint, historyLimit]
  );

  const runtime = useLocalRuntime(adapter, {
    initialMessages: initialMessages?.map(m => ({
      role: m.role,
      content: [{ type: "text" as const, text: m.content }],
    })),
  });

  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;

  useEffect(() => {
    if (!onMessagesChangeRef.current) return;
    return runtime.thread.subscribe(() => {
      const msgs = runtime.thread.getState().messages;
      const simplified: ChatMessage[] = msgs
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content
            .filter((c): c is { type: "text"; text: string } => c.type === "text" && "text" in c)
            .map(c => c.text)
            .join("\n"),
        }))
        .filter(m => m.content.trim());
      onMessagesChangeRef.current?.(simplified);
    });
  }, [runtime.thread]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
