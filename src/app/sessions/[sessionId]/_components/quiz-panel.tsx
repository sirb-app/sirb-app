"use client";

import { Play, TrendingUp, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SessionData } from "./session-client";

interface QuizPanelProps {
  session: SessionData;
}

export function QuizPanel({ session }: QuizPanelProps) {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="text-primary size-5" />
                <CardTitle>اختبار تحديد المستوى</CardTitle>
              </div>
              <CardDescription dir="rtl">
                10-8 أسئلة لتقييم مستواك الحالي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Play className="me-2 size-4" /> ابدأ الاختبار
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-primary size-5" />
                <CardTitle>تمرين مخصص</CardTitle>
              </div>
              <CardDescription dir="rtl">
                8-5 أسئلة حسب مواضيعك الحالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Play className="me-2 size-4" /> ابدأ التمرين
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الاختبارات السابقة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2].map(idx => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    اختبار تدريبي #{idx}
                  </p>
                  <p className="text-muted-foreground text-xs">منذ يومين</p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  80%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
