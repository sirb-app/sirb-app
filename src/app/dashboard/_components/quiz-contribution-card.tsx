"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ContentStatus } from "@/generated/prisma";
import {
  BookOpen,
  Check,
  Clock,
  ExternalLink,
  FileEdit,
  HelpCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

type QuizContributionCardProps = {
  readonly quiz: {
    id: number;
    title: string;
    status: ContentStatus;
    rejectionReason: string | null;
    updatedAt: Date;
    chapter: {
      title: string;
      subject: {
        name: string;
        code: string;
      };
    };
    _count: {
      questions: number;
    };
  };
};

function getStatusBadge(status: ContentStatus) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge variant="secondary" className="gap-1">
          <FileEdit className="h-3 w-3" />
          مسودة
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="border-accent/30 bg-accent/20 hover:bg-accent/30 text-foreground gap-1">
          <Clock className="h-3 w-3" />
          قيد المراجعة
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="border-success/30 bg-success/20 hover:bg-success/30 text-success gap-1">
          <Check className="h-3 w-3" />
          منشور
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          مرفوض
        </Badge>
      );
  }
}

export default function QuizContributionCard({
  quiz,
}: QuizContributionCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header: Title + Badge */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 flex-1 leading-tight font-semibold">
              {quiz.title}
            </h4>
            {getStatusBadge(quiz.status)}
          </div>

          {/* Metadata */}
          <div className="text-muted-foreground space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">{quiz.chapter.subject.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>{quiz._count.questions} سؤال</span>
            </div>
            <div className="text-xs" suppressHydrationWarning>
              آخر تحديث: {new Date(quiz.updatedAt).toLocaleDateString("ar-SA")}
            </div>
          </div>

          {/* Rejection Reason (if applicable) */}
          {quiz.status === "REJECTED" && quiz.rejectionReason && (
            <div className="bg-destructive/15 border-destructive/30 text-destructive rounded-md border p-2.5 text-xs">
              <p className="mb-1 font-semibold">سبب الرفض:</p>
              <p className="line-clamp-2">{quiz.rejectionReason}</p>
            </div>
          )}

          {/* Action Button - Links to /manage/quiz/[id] */}
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/manage/quiz/${quiz.id}`}>
              <ExternalLink className="ml-2 h-4 w-4" />
              {quiz.status === "DRAFT" || quiz.status === "REJECTED"
                ? "تعديل"
                : "عرض التفاصيل"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
