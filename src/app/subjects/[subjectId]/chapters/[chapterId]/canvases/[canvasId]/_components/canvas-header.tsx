"use client";

import { stripTitlePrefix } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

type CanvasHeaderProps = {
  readonly title: string;
  readonly description: string | null;
  readonly subjectId: number;
  readonly chapterId: number;
};

export default function CanvasHeader({
  title,
  description,
  subjectId,
  chapterId,
}: CanvasHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/subjects/${subjectId}/chapters/${chapterId}`);
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للفصل
      </button>

      {/* Title and description */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{stripTitlePrefix(title)}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
