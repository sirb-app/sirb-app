import { FileDownloadButton } from "@/components/canvas-file-download";
import { ExternalLink, File } from "lucide-react";

type FileContentBlockProps = {
  readonly file: {
    id: number;
    title: string;
    description: string | null;
    url: string;
    mimeType: string;
    fileSize: bigint;
    isOriginal: boolean;
  };
};

// Format file size helper
function formatFileSize(bytes: bigint): string {
  const size = Number(bytes);
  if (size < 1024) return `${size} بايت`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} كيلوبايت`;
  return `${(size / (1024 * 1024)).toFixed(2)} ميجابايت`;
}

// Get file type label helper
function getFileTypeLabel(mimeType: string): string {
  const typeMap: Record<string, string> = {
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "مستند Word",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "عرض تقديمي",
    "text/plain": "ملف نصي",
    "image/png": "صورة PNG",
    "image/jpeg": "صورة JPEG",
    "image/gif": "صورة GIF",
  };
  return typeMap[mimeType] || "ملف";
}

export default function FileContentBlock({ file }: FileContentBlockProps) {
  return (
    <div className="bg-card block rounded-lg border p-4 sm:p-6">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        {/* File Icon */}
        <div className="bg-primary/15 border-primary/30 flex-shrink-0 rounded-lg border p-2.5 sm:p-3">
          <File className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        {/* File Info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-base font-semibold break-words sm:text-lg">
            {file.title}
          </h3>
          {file.description && (
            <p className="text-muted-foreground mt-1 text-sm break-words">
              {file.description}
            </p>
          )}
          <p className="text-muted-foreground mt-2 text-xs">
            {formatFileSize(file.fileSize)} • {getFileTypeLabel(file.mimeType)}
          </p>
        </div>

        {/* Download Button */}
        <div className="flex-shrink-0">
          <FileDownloadButton
            fileId={file.id}
            fileName={file.title}
            variant="ghost"
            size="icon"
            iconOnly
            className="hover:bg-muted/50 h-9 w-9 sm:h-10 sm:w-10"
          />
        </div>
      </div>

      {/* Source Attribution - Subtle informational style */}
      {/* Show badge when isOriginal is false (meaning isExternal is true) */}
      {file.isOriginal === false && (
        <div className="text-muted-foreground mt-3 flex items-center gap-1.5 border-t pt-3 text-xs sm:mt-4 sm:pt-4 sm:text-sm">
          <ExternalLink className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span className="leading-relaxed">محتوى منقول من مصدر خارجي</span>
        </div>
      )}
    </div>
  );
}
