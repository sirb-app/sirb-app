import { Download, FileText } from "lucide-react";
import Link from "next/link";

type FileContentBlockProps = {
  readonly file: {
    title: string;
    description: string | null;
    url: string;
    mimeType: string;
    fileSize: bigint;
  };
};

export default function FileContentBlock({ file }: FileContentBlockProps) {
  const formatFileSize = (bytes: bigint) => {
    const kb = Number(bytes) / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Link
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-card hover:border-primary/50 block rounded-lg border p-6 transition-all hover:shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 rounded-lg p-3 transition-colors">
          <FileText className="text-primary h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
            {file.title}
          </h3>
          {file.description && (
            <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
              {file.description}
            </p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">
            {file.mimeType} • {formatFileSize(file.fileSize)}
          </p>
        </div>
        <Download className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
      </div>
    </Link>
  );
}
