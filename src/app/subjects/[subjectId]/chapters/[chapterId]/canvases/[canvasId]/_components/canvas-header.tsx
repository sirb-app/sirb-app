"use client";

import { Button } from "@/components/ui/button";
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
      <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
        <ArrowRight className="h-4 w-4" />
        العودة للفصل
      </Button>

      {/* Title and description */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
