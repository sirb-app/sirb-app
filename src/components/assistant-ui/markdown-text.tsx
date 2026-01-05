"use client";

import "katex/dist/katex.min.css";

import {
  type CodeHeaderProps,
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import { useAssistantState } from "@assistant-ui/react";
import { CheckIcon, CopyIcon, FileText } from "lucide-react";
import { type FC, memo, useCallback, useEffect, useRef, useState } from "react";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[
        remarkGfm, 
        [remarkMath, { singleDollarTextMath: true }]
      ]}
      rehypePlugins={[
        [rehypeKatex, { 
          strict: 'ignore', // Don't throw or warn on parse errors
          errorColor: 'currentColor' // Use text color instead of red for errors
        }]
      ]}
      className="aui-md"
      components={defaultComponents}
      urlTransform={(url) => url}
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="aui-code-header-root bg-muted-foreground/15 text-foreground dark:bg-muted-foreground/20 mt-4 flex items-center justify-between gap-4 rounded-t-lg px-4 py-2 text-sm font-semibold">
      <span className="aui-code-header-language lowercase [&>span]:text-xs">
        {language}
      </span>
      <TooltipIconButton tooltip="Copy" onClick={onCopy}>
        {!isCopied && <CopyIcon />}
        {isCopied && <CheckIcon />}
      </TooltipIconButton>
    </div>
  );
};

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = useCallback(
    async (value: string) => {
      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);
        setIsCopied(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setIsCopied(false);
        }, copiedDuration);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    },
    [copiedDuration]
  );

  return { isCopied, copyToClipboard };
};

const defaultComponents = memoizeMarkdownComponents({
  h1: ({ className, ...props }) => (
    <h1
      dir="auto"
      className={cn(
        "aui-md-h1 mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight [unicode-bidi:plaintext] last:mb-0",
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      dir="auto"
      className={cn(
        "aui-md-h2 mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight [unicode-bidi:plaintext] first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      dir="auto"
      className={cn(
        "aui-md-h3 mt-6 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight [unicode-bidi:plaintext] first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      dir="auto"
      className={cn(
        "aui-md-h4 mt-6 mb-4 scroll-m-20 text-xl font-semibold tracking-tight [unicode-bidi:plaintext] first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      dir="auto"
      className={cn(
        "aui-md-h5 my-4 text-lg font-semibold [unicode-bidi:plaintext] first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      dir="auto"
      className={cn(
        "aui-md-h6 my-4 font-semibold [unicode-bidi:plaintext] first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      dir="auto"
      className={cn(
        "aui-md-p mt-5 mb-5 leading-7 [unicode-bidi:plaintext] first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  a: ({ className, children, ...props }) => {
    const message = useAssistantState(({ message }) => message);
    const href = props.href;
    
    // Handle source citations
    if (href?.startsWith("source:")) {
      const index = parseInt(href.split(":")[1] || "0", 10) - 1;
      const sources = (message.metadata?.custom as { sources?: { resource_id: number; page_start: number }[] })?.sources;
      const source = sources?.[index];

      if (source) {
        return (
          <sup
            className="aui-source-citation cursor-pointer text-primary hover:text-primary/70 mx-0.5 select-none inline-flex items-center"
            title={`ص. ${source.page_start}`}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("navigate-to-source", {
                  detail: { resourceId: source.resource_id, page: source.page_start },
                })
              );
            }}
          >
            <FileText className="size-3" />
          </sup>
        );
      }
      
      // Source not found - render as plain text to avoid broken link
      return <span className="text-muted-foreground">{children}</span>;
    }

    return (
      <a
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "aui-md-a text-primary font-medium underline underline-offset-4",
          className
        )}
        {...props}
      />
    );
  },
  blockquote: ({ className, ...props }) => (
    <blockquote
      dir="auto"
      className={cn(
        "aui-md-blockquote border-l-2 pl-6 italic [unicode-bidi:plaintext]",
        className
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      dir="auto"
      className={cn(
        "aui-md-ul my-5 ms-6 list-disc [unicode-bidi:plaintext] [&>li]:mt-2",
        className
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      dir="auto"
      className={cn(
        "aui-md-ol my-5 ms-6 list-decimal [unicode-bidi:plaintext] [&>li]:mt-2",
        className
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("aui-md-hr my-5 border-b", className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <table
      className={cn(
        "aui-md-table my-5 w-full border-separate border-spacing-0 overflow-y-auto",
        className
      )}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "aui-md-th bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg [[align=center]]:text-center [[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "aui-md-td border-b border-l px-4 py-2 text-left last:border-r [[align=center]]:text-center [[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }) => (
    <tr
      className={cn(
        "aui-md-tr m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg",
        className
      )}
      {...props}
    />
  ),
  sup: ({ className, ...props }) => (
    <sup
      className={cn("aui-md-sup [&>a]:text-xs [&>a]:no-underline", className)}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      dir="ltr"
      className={cn(
        "aui-md-pre overflow-x-auto rounded-t-none! rounded-b-lg bg-black p-4 text-white [unicode-bidi:isolate]",
        className
      )}
      {...props}
    />
  ),
  code: function Code({ className, ...props }) {
    const isCodeBlock = useIsMarkdownCodeBlock();
    return (
      <code
        dir={isCodeBlock ? "ltr" : "auto"}
        className={cn(
          !isCodeBlock &&
            "aui-md-inline-code bg-muted rounded border font-semibold [unicode-bidi:isolate]",
          isCodeBlock && "[unicode-bidi:isolate]",
          className
        )}
        {...props}
      >
        <bdi dir="auto">{props.children}</bdi>
      </code>
    );
  },
  CodeHeader,
});
