import { cn } from "@/lib/utils";

type TipTapViewerProps = {
  readonly content: string;
  readonly className?: string;
  readonly direction?: "rtl" | "ltr" | "auto";
};

// Detect if content is primarily RTL (Arabic, Hebrew, etc.)
function detectDirection(text: string): "rtl" | "ltr" {
  // Remove HTML tags to get plain text
  const plainText = text.replace(/<[^>]*>/g, "");
  // RTL Unicode ranges: Arabic, Hebrew, Persian, etc.
  const rtlChars = plainText.match(/[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/g);
  const ltrChars = plainText.match(/[A-Za-z]/g);

  const rtlCount = rtlChars?.length || 0;
  const ltrCount = ltrChars?.length || 0;

  // If more RTL chars than LTR, use RTL
  return rtlCount >= ltrCount ? "rtl" : "ltr";
}

export function TipTapViewer({
  content,
  className,
  direction = "auto",
}: TipTapViewerProps) {
  // If content is empty or just whitespace/empty tags, show nothing
  const isEmpty =
    !content ||
    content === "<p></p>" ||
    content.replace(/<[^>]*>/g, "").trim() === "";

  if (isEmpty) {
    return null;
  }

  const resolvedDirection =
    direction === "auto" ? detectDirection(content) : direction;

  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        "[&>p]:my-2 [&>ul]:my-2 [&>ol]:my-2",
        "[&>ul]:list-disc [&>ol]:list-decimal",
        resolvedDirection === "rtl" && "[&>ul]:pr-6 [&>ol]:pr-6",
        resolvedDirection === "ltr" && "[&>ul]:pl-6 [&>ol]:pl-6",
        "[&_.tiptap-list]:list-inside",
        resolvedDirection === "rtl" && "[&_.tiptap-list]:pr-6",
        resolvedDirection === "ltr" && "[&_.tiptap-list]:pl-6",
        className
      )}
      dir={resolvedDirection}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
