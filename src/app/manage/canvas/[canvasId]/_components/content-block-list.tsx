"use client";

import { reorderBlocks } from "@/actions/canvas-manage.action";
import { Button } from "@/components/ui/button";
import { Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddContentModal from "./add-content-modal";
import ContentBlockCard from "./content-block-card";

type ContentBlock = {
  id: number;
  sequence: number;
  contentType: "TEXT" | "VIDEO" | "FILE";
  data?: any;
};

type ContentBlockListProps = {
  initialBlocks: ContentBlock[];
  canvasId: number;
  isReadOnly?: boolean;
};

export default function ContentBlockList({
  initialBlocks,
  canvasId,
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
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 mb-6 flex items-center justify-between border-b py-4 backdrop-blur">
        <h2 className="text-lg font-bold">محتوى الدرس</h2>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {hasOrderChanges && (
              <Button
                onClick={handleSaveOrder}
                disabled={isReordering}
                variant="secondary"
                size="sm"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isReordering ? "جاري الحفظ..." : "حفظ الترتيب الجديد"}
              </Button>
            )}

            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة محتوى
            </Button>
          </div>
        )}
      </div>

      {/* Blocks List */}
      <div className="min-h-[200px] space-y-2">
        {blocks.length === 0 && (
          <div className="bg-muted/10 text-muted-foreground flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16">
            <p className="mb-4">لا يوجد محتوى مضاف حتى الآن</p>
            {!isReadOnly && (
              <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
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
