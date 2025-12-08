import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma";
import { Download } from "lucide-react";

type File = Prisma.FileGetPayload<{
  select: {
    id: true;
    url: true;
    mimeType: true;
    fileSize: true;
    title: true;
    description: true;
  };
}>;

type CanvasFileViewerProps = {
  readonly file: File;
};

export default function CanvasFileViewer({ file }: CanvasFileViewerProps) {
  const formatFileSize = (bytes: bigint) => {
    const kb = Number(bytes) / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("word")) return "📝";
    return "📎";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
            <div>
              <CardTitle className="text-lg">{file.title}</CardTitle>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(file.fileSize)} • {file.mimeType}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              تحميل
            </a>
          </Button>
        </div>
      </CardHeader>
      {file.description && (
        <CardContent>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {file.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
