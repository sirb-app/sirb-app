import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma";
import { FileQuestion } from "lucide-react";

type Quiz = Prisma.QuizGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    instructions: true;
  };
}>;

type CanvasQuizViewerProps = {
  readonly quiz: Quiz;
};

export default function CanvasQuizViewer({ quiz }: CanvasQuizViewerProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileQuestion className="text-muted-foreground h-5 w-5" />
          <CardTitle className="text-lg">{quiz.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {quiz.description && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {quiz.description}
          </p>
        )}
        {quiz.instructions && (
          <div className="bg-muted rounded-md p-3">
            <p className="text-sm leading-relaxed">{quiz.instructions}</p>
          </div>
        )}
        <p className="text-muted-foreground text-sm">
          سيتم إضافة تفاصيل الاختبار قريباً
        </p>
      </CardContent>
    </Card>
  );
}
