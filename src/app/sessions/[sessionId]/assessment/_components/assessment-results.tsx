"use client";

import { Award, ChevronLeft, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AssessmentResultsProps {
  studyPlanId: string;
  subject: {
    id: number;
    name: string;
    code: string;
  };
  results: {
    topicsMastered: number;
    topicsInProgress: number;
    totalTopics: number;
    averageProficiency: number;
  };
}

export function AssessmentResults({
  studyPlanId,
  subject,
  results,
}: AssessmentResultsProps) {
  const router = useRouter();

  const masteryPercentage = results.totalTopics > 0
    ? Math.round((results.topicsMastered / results.totalTopics) * 100)
    : 0;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8" dir="rtl">
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <Award className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">اكتمل اختبار تحديد المستوى!</CardTitle>
          <p className="text-muted-foreground mt-2">
            {subject.name}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>نسبة الإتقان الإجمالية</span>
              <span className="font-bold text-lg">
                {Math.round(results.averageProficiency)}%
              </span>
            </div>
            <Progress value={results.averageProficiency} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-center mb-1">
                <Target className="size-4 text-green-500 me-1" />
              </div>
              <p className="text-2xl font-bold">{results.topicsMastered}</p>
              <p className="text-xs text-muted-foreground">موضوع متقن</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="size-4 text-amber-500 me-1" />
              </div>
              <p className="text-2xl font-bold">{results.topicsInProgress}</p>
              <p className="text-xs text-muted-foreground">قيد التحسين</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-center mb-1">
                <Award className="size-4 text-blue-500 me-1" />
              </div>
              <p className="text-2xl font-bold">{masteryPercentage}%</p>
              <p className="text-xs text-muted-foreground">نسبة الإتقان</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button size="lg" onClick={() => router.push(`/sessions/${studyPlanId}`)}>
              ابدأ التعلم
              <ChevronLeft className="ms-2 size-4" />
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/subjects/${subject.id}`}>
                العودة للمقرر
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
