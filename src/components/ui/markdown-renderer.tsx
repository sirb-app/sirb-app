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
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p dir="auto" className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul dir="auto" className="my-2 ms-4 list-disc">{children}</ul>,
          ol: ({ children }) => <ol dir="auto" className="my-2 ms-4 list-decimal">{children}</ol>,
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-muted rounded px-1 py-0.5 text-sm" {...props}>{children}</code>
            ) : (
              <code className={cn("block overflow-x-auto rounded bg-black p-3 text-white", className)} {...props}>{children}</code>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

