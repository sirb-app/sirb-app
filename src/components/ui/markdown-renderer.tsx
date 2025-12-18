"use client";

import "katex/dist/katex.min.css";

import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none overflow-hidden break-words",
        // Bidi: isolate math/code runs and let paragraphs pick direction naturally.
        "[&_.katex]:[direction:ltr] [&_.katex]:[unicode-bidi:isolate]",
        className
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => (
            <p dir="auto" className="mb-2 last:mb-0 [unicode-bidi:plaintext]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul dir="auto" className="my-2 list-disc ps-5 [unicode-bidi:plaintext]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol dir="auto" className="my-2 list-decimal ps-5 [unicode-bidi:plaintext]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="ps-1 [unicode-bidi:plaintext]">{children}</li>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code
                dir="auto"
                className="bg-muted rounded px-1 py-0.5 text-sm [unicode-bidi:isolate]"
                {...props}
              >
                <bdi dir="auto">{children}</bdi>
              </code>
            ) : (
              <code
                dir="ltr"
                className={cn(
                  "block overflow-x-auto rounded bg-black p-3 text-white [unicode-bidi:isolate]",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

