export interface Thread {
  id: string;
  title: string | null;
  subject_id: number;
  chapter_ids: number[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  chunk_ids: string[];
  created_at: string;
}

export interface ChunkInfo {
  chunk_id: string;
  content: string;
  score: number;
  resource_id: number;
  page_start: number;
  page_end: number;
}

export interface ThreadWithMessages {
  thread: Thread;
  messages: Message[];
}

export interface CreateThreadRequest {
  subject_id: number;
  chapter_ids?: number[];
  title?: string;
}

export interface UpdateThreadRequest {
  title?: string;
  is_archived?: boolean;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  user_message: Message;
  assistant_message: Message;
  chunks: ChunkInfo[];
}

export type StreamEvent =
  | { type: "chunks"; data: ChunkInfo[] }
  | { type: "delta"; data: { content: string } }
  | {
      type: "done";
      data: { user_message_id: string; assistant_message_id: string };
    };

const VALID_EVENT_TYPES = ["chunks", "delta", "done"] as const;
type ValidEventType = (typeof VALID_EVENT_TYPES)[number];

function isValidEventType(type: string): type is ValidEventType {
  return VALID_EVENT_TYPES.includes(type as ValidEventType);
}

export async function* parseSSEStream(
  response: Response
): AsyncGenerator<StreamEvent> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let eventType = "";
  let dataBuffer: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          const value = line.slice(6);
          eventType = value.startsWith(" ") ? value.slice(1) : value;
        } else if (line.startsWith("data:")) {
          const value = line.slice(5);
          dataBuffer.push(value.startsWith(" ") ? value.slice(1) : value);
        } else if (line === "") {
          if (
            dataBuffer.length > 0 &&
            eventType &&
            isValidEventType(eventType)
          ) {
            try {
              const data = dataBuffer.join("\n");
              const parsed = JSON.parse(data);
              yield { type: eventType, data: parsed } as StreamEvent;
            } catch {
              // Invalid JSON, skip event
            }
          }
          eventType = "";
          dataBuffer = [];
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
