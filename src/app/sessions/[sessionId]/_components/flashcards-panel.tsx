"use client";

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SessionData } from "./session-client";

interface FlashcardsPanelProps {
  session: SessionData;
}

const mockCards = [
  {
    id: "c1",
    topic: "قوانين نيوتن",
    front: "ما هو قانون نيوتن الأول؟",
    back: "الجسم الساكن يبقى ساكناً والجسم المتحرك يبقى متحركاً بسرعة ثابتة في خط مستقيم ما لم تؤثر عليه قوة خارجية.",
  },
  {
    id: "c2",
    topic: "الطاقة الحركية",
    front: "كيف نحسب الطاقة الحركية؟",
    back: "الطاقة الحركية = ½ × الكتلة × مربع السرعة (KE = 1/2 m v^2).",
  },
];

export function FlashcardsPanel({ session }: FlashcardsPanelProps) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = mockCards[idx];
  const hasPrev = idx > 0;
  const hasNext = idx < mockCards.length - 1;

  const rate = () => {
    // TODO: connect to backend rating
    if (hasNext) {
      setIdx(prev => prev + 1);
      setFlipped(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="text-muted-foreground text-center text-sm">
          البطاقة {idx + 1} من {mockCards.length} ·{" "}
          {session.stats.flashcardsReviewed} تمت مراجعتها
        </div>

        <div
          className="group relative h-64 w-full cursor-pointer md:h-80"
          onClick={() => setFlipped(!flipped)}
        >
          <div
            className={cn(
              "bg-card relative h-full w-full rounded-xl border shadow-sm transition-transform duration-500",
              flipped && "rotate-y-180"
            )}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute inset-0 flex flex-col rounded-xl p-6 backface-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              <CardHeader className="p-0">
                <CardDescription className="text-center">
                  {card.topic}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center p-4 text-center text-lg">
                {card.front}
              </CardContent>
              <div className="text-muted-foreground text-center text-xs">
                اضغط لإظهار الإجابة
              </div>
            </div>

            <div
              className="bg-primary/5 absolute inset-0 flex rotate-y-180 flex-col rounded-xl border p-6 backface-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              <CardHeader className="p-0">
                <CardTitle className="text-center text-base">الإجابة</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center p-4 text-center text-base">
                {card.back}
              </CardContent>
              <div className="text-muted-foreground text-center text-xs">
                اضغط للعودة
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["مرة أخرى", "صعبة", "جيدة", "سهلة"].map(label => (
            <Button
              key={label}
              variant="outline"
              onClick={rate}
              className="text-sm"
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => hasPrev && setIdx(idx - 1)}
            disabled={!hasPrev}
            className="shrink-0"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setFlipped(false)}
            className="min-w-0"
          >
            <RefreshCw className="mr-2 size-4" />
            <span className="hidden sm:inline">إعادة البطاقة</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => hasNext && setIdx(idx + 1)}
            disabled={!hasNext}
            className="shrink-0"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
