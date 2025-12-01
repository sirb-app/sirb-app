"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type SubjectEnrollmentCardProps = {
  readonly enrollment: {
    id: number;
    subject: {
      id: number;
      name: string;
      code: string;
      imageUrl: string | null;
      college: {
        name: string;
      };
    };
    progress: {
      total: number;
      completed: number;
      percentage: number;
    };
  };
};

export default function SubjectEnrollmentCard({
  enrollment,
}: SubjectEnrollmentCardProps) {
  const { subject, progress } = enrollment;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header: Subject Info */}
          <div className="flex items-start gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
              {subject.imageUrl ? (
                <Image
                  src={subject.imageUrl}
                  alt={subject.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="bg-muted flex h-full w-full items-center justify-center">
                  <BookOpen className="text-muted-foreground h-8 w-8" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="truncate font-semibold leading-tight">
                {subject.name}
              </h4>
              <p className="text-muted-foreground text-xs">{subject.code}</p>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                {subject.college.name}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">التقدم</span>
              <span className="font-medium">{progress.percentage}%</span>
            </div>
            <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {progress.completed} من {progress.total} شرح
            </p>
          </div>

          {/* Action Button */}
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/subjects/${subject.id}`}>
              <ArrowLeft className="ml-2 h-4 w-4" />
              متابعة التعلم
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
