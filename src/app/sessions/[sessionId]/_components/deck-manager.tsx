"use client";

import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Textarea } from "@/components/ui/textarea";
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

export function DeckManager({ allCards, onCardsChange }: DeckManagerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init: RequestInit,
    timeoutMs: number
  ) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const startEdit = (card: Flashcard) => {
    setErrorMessage(null);
    setEditingId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const cancelEdit = () => {
    setErrorMessage(null);
    setEditingId(null);
    setEditFront("");
    setEditBack("");
  };

  const saveEdit = async () => {
    if (!editingId || !editFront.trim() || !editBack.trim()) return;

    try {
      setErrorMessage(null);
      setSaving(true);
      const res = await fetchWithTimeout(
        `/api/flashcards/${editingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            front: editFront.trim(),
            back: editBack.trim(),
          }),
        },
        15000
      );
      if (res.ok) {
        onCardsChange();
        cancelEdit();
        return;
      }

      const error = await res.json().catch(() => ({ error: "" }));
      setErrorMessage(
        (error && typeof error.error === "string" && error.error) ||
          "تعذر حفظ التعديل. حاول مرة أخرى."
      );
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "انتهت مهلة الطلب. حاول مرة أخرى."
          : "حدث خطأ أثناء حفظ التعديل. حاول مرة أخرى.";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = async (id: number) => {
    if (!confirm("هل تريد حذف هذه البطاقة؟")) return;

    try {
      setErrorMessage(null);
      setDeleting(id);
      const res = await fetchWithTimeout(
        `/api/flashcards/${id}`,
        { method: "DELETE" },
        15000
      );
      if (res.ok) {
        onCardsChange();
        return;
      }

      const error = await res.json().catch(() => ({ error: "" }));
      setErrorMessage(
        (error && typeof error.error === "string" && error.error) ||
          "تعذر حذف البطاقة. حاول مرة أخرى."
      );
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "انتهت مهلة الطلب. حاول مرة أخرى."
          : "حدث خطأ أثناء حذف البطاقة. حاول مرة أخرى.";
      setErrorMessage(message);
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
      {errorMessage && (
        <div className="text-destructive border-destructive/30 bg-destructive/10 rounded-md border px-3 py-2 text-sm">
          {errorMessage}
        </div>
      )}
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
            // TODO: add tiptap with markdown support
            <div className="space-y-2">
              <Textarea
                value={editFront}
                onChange={e => setEditFront(e.target.value)}
                placeholder="السؤال..."
                dir="auto"
                className="min-h-[110px]"
              />
              <Textarea
                value={editBack}
                onChange={e => setEditBack(e.target.value)}
                placeholder="الإجابة..."
                dir="auto"
                className="min-h-[130px]"
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
                <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
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
