"use client";

import { reorderBlocks } from "@/actions/canvas-manage.action";
import { Button } from "@/components/ui/button";
import { Eye, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddContentModal from "./add-content-modal";
import ContentBlockCard from "./content-block-card";

type ContentBlock = {
  id: number;
  sequence: number;
  contentType: "TEXT" | "VIDEO" | "FILE" | "QUESTION";
  data?: any;
};

type ContentBlockListProps = {
  initialBlocks: ContentBlock[];
  canvasId: number;
  previewUrl: string;
  isReadOnly?: boolean;
};

export default function ContentBlockList({
  initialBlocks,
  canvasId,
  previewUrl,
  isReadOnly = false,
}: ContentBlockListProps) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(initialBlocks);
  const [isReordering, setIsReordering] = useState(false);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null);

  useEffect(() => {
    setBlocks(initialBlocks);
    setHasOrderChanges(false);
  }, [initialBlocks]);

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    [newBlocks[index], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[index],
    ];
    const resequenced = newBlocks.map((b, i) => ({ ...b, sequence: i + 1 }));

    setBlocks(resequenced);
    setHasOrderChanges(true);
  };

  const handleSaveOrder = async () => {
    try {
      setIsReordering(true);
      const updates = blocks.map(b => ({
        blockId: b.id,
        sequence: b.sequence,
      }));
      await reorderBlocks({ canvasId, updates });
      toast.success("تم حفظ الترتيب");
      setHasOrderChanges(false);
      router.refresh();
    } catch (error) {
      toast.error("فشل حفظ الترتيب");
    } finally {
      setIsReordering(false);
    }
  };

  const handleEdit = (block: ContentBlock) => {
    setSelectedBlock(block);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setSelectedBlock(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add & Save Buttons */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 mb-4 flex flex-row items-center justify-between gap-3 border-b py-3 backdrop-blur sm:mb-6 sm:py-4">
        <h2 className="text-base font-bold sm:text-lg">محتوى الدرس</h2>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
          >
            <Link href={previewUrl} target="_blank">
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">معاينة</span>
            </Link>
          </Button>

          {!isReadOnly && (
            <>
              {hasOrderChanges && (
                <Button
                  onClick={handleSaveOrder}
                  disabled={isReordering}
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {isReordering ? "جاري الحفظ..." : "حفظ الترتيب الجديد"}
                  </span>
                  <span className="sm:hidden">
                    {isReordering ? "جاري الحفظ..." : "حفظ"}
                  </span>
                </Button>
              )}

              <Button
                onClick={() => setIsAddModalOpen(true)}
                size="sm"
                className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">إضافة محتوى</span>
                <span className="sm:hidden">إضافة</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Blocks List */}
      <div className="min-h-[200px] space-y-2 sm:space-y-3">
        {blocks.length === 0 && (
          <div className="bg-muted/15 text-muted-foreground flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 sm:rounded-xl sm:py-16">
            <p className="mb-3 text-sm sm:mb-4 sm:text-base">
              لا يوجد محتوى مضاف حتى الآن
            </p>
            {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="sm:size-default"
              >
                ابدأ بإضافة أول محتوى
              </Button>
            )}
          </div>
        )}

        {blocks.map((block, index) => (
          <ContentBlockCard
            key={block.id}
            block={block}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
            onMoveUp={() => moveBlock(index, "up")}
            onMoveDown={() => moveBlock(index, "down")}
            onEdit={() => handleEdit(block)}
            canvasId={canvasId}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>

      {/* Add Content Modal */}
      <AddContentModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        canvasId={canvasId}
        initialData={selectedBlock}
      />
    </div>
  );
}
