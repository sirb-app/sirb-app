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
  FileText,
  XCircle,
} from "lucide-react";
import Link from "next/link";

type CanvasContributionCardProps = {
  readonly canvas: {
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
      contentBlocks: number;
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
        <Badge className="border-yellow-200 bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 gap-1">
          <Clock className="h-3 w-3" />
          قيد المراجعة
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="border-green-200 bg-green-500/15 text-green-600 hover:bg-green-500/25 gap-1">
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

export default function CanvasContributionCard({
  canvas,
}: CanvasContributionCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header: Title + Badge */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 flex-1 font-semibold leading-tight">
              {canvas.title}
            </h4>
            {getStatusBadge(canvas.status)}
          </div>

          {/* Metadata */}
          <div className="text-muted-foreground space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">{canvas.chapter.subject.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0" />
              <span>{canvas._count.contentBlocks} محتوى</span>
            </div>
            <div className="text-xs" suppressHydrationWarning>
              آخر تحديث:{" "}
              {new Date(canvas.updatedAt).toLocaleDateString("ar-SA")}
            </div>
          </div>

          {/* Rejection Reason (if applicable) */}
          {canvas.status === "REJECTED" && canvas.rejectionReason && (
            <div className="bg-destructive/10 text-destructive rounded-md p-2.5 text-xs">
              <p className="mb-1 font-semibold">سبب الرفض:</p>
              <p className="line-clamp-2">{canvas.rejectionReason}</p>
            </div>
          )}

          {/* Action Button - Links to /manage/canvas/[id] */}
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/manage/canvas/${canvas.id}`}>
              <ExternalLink className="ml-2 h-4 w-4" />
              {canvas.status === "DRAFT" || canvas.status === "REJECTED"
                ? "تعديل"
                : "عرض التفاصيل"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
