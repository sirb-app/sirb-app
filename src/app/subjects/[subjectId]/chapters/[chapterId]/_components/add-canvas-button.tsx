"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PenTool, PlusCircle } from "lucide-react";
import { useState } from "react";
import CreateCanvasModal from "./create-canvas-modal";

type AddCanvasButtonProps = {
  chapterId: number;
  hasCanvases: boolean;
};

export default function AddCanvasButton({
  chapterId,
  hasCanvases,
}: AddCanvasButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!hasCanvases) {
    return (
      <>
        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="bg-muted mb-4 rounded-full p-3">
              <PenTool className="text-muted-foreground h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">لا يوجد محتوى حتى الآن</h3>
            <p className="text-muted-foreground mb-4 max-w-sm text-sm">
              كن أول من يساهم في هذا الفصل! شارك معرفتك وساعد الطلاب الآخرين في
              فهم المادة.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>أضف أول شرح</Button>
          </CardContent>
        </Card>
        <CreateCanvasModal
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
        إضافة شرح
      </Button>
      <CreateCanvasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chapterId={chapterId}
      />
    </>
  );
}
