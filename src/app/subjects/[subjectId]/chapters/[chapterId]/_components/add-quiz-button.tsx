"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, PlusCircle } from "lucide-react";
import { useState } from "react";
import CreateQuizModal from "./create-quiz-modal";

type AddQuizButtonProps = {
  chapterId: number;
  hasQuizzes: boolean;
};

export default function AddQuizButton({
  chapterId,
  hasQuizzes,
}: AddQuizButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!hasQuizzes) {
    return (
      <>
        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="bg-muted mb-4 rounded-full p-3">
              <FileQuestion className="text-muted-foreground h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">لا توجد اختبارات حتى الآن</h3>
            <p className="text-muted-foreground mb-4 max-w-sm text-sm">
              كن أول من يساهم في هذا الفصل! أضف اختبار لمساعدة الطلاب في تقييم
              فهمهم للمادة.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>أضف أول اختبار</Button>
          </CardContent>
        </Card>
        <CreateQuizModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          chapterId={chapterId}
        />
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} className="gap-2">
        <PlusCircle className="h-4 w-4" />
        إضافة اختبار
      </Button>
      <CreateQuizModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chapterId={chapterId}
      />
    </>
  );
}
