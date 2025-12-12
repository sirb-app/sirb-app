"use client";

import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  topic_slug: string;
  due_at: string | null;
  review_count: number;
}

interface DeckManagerProps {
  allCards: Flashcard[];
  onCardsChange: () => void;
}

export function DeckManager({
  allCards,
  onCardsChange,
}: DeckManagerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const startEdit = (card: Flashcard) => {
    setEditingId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFront("");
    setEditBack("");
  };

  const saveEdit = async () => {
    if (!editingId || !editFront.trim() || !editBack.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/flashcards/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: editFront.trim(),
          back: editBack.trim(),
        }),
      });
      if (res.ok) {
        onCardsChange();
        cancelEdit();
      }
    } catch (error) {
      console.error("Failed to update card:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = async (id: number) => {
    if (!confirm("هل تريد حذف هذه البطاقة؟")) return;

    try {
      setDeleting(id);
      const res = await fetch(`/api/flashcards/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onCardsChange();
      }
    } catch (error) {
      console.error("Failed to delete card:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (allCards.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        لا توجد بطاقات بعد
      </div>
    );
  }

  return (
    <div className="space-y-2" dir="rtl">
      {/* Cards list */}
      {allCards.map(card => (
        <div
          key={card.id}
          className={cn(
            "rounded-lg border p-3 transition-colors",
            editingId === card.id
              ? "bg-muted/50 border-primary"
              : "hover:bg-muted/30"
          )}
        >
          {editingId === card.id ? (
            // Edit mode
            <div className="space-y-2">
              <TipTapEditor
                content={editFront}
                onChange={setEditFront}
                placeholder="السؤال..."
                defaultDirection="rtl"
              />
              <TipTapEditor
                content={editBack}
                onChange={setEditBack}
                placeholder="الإجابة..."
                defaultDirection="rtl"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={!editFront.trim() || !editBack.trim() || saving}
                  className="gap-1"
                >
                  {saving ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Check className="size-3" />
                  )}
                  حفظ
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  <X className="size-3" />
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            // View mode
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium" dir="auto">
                  <MarkdownRenderer content={card.front} />
                </div>
                <div className="text-muted-foreground mt-1 text-xs" dir="auto">
                  <MarkdownRenderer content={card.back} />
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => startEdit(card)}
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 size-7"
                  onClick={() => deleteCard(card.id)}
                  disabled={deleting === card.id}
                >
                  {deleting === card.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
