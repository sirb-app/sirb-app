"use client";

import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  topic_slug: string;
  due_at: string | null;
  review_count: number;
}

interface DeckManagerProps {
  studyPlanId: string;
  allCards: Flashcard[];
  onCardsChange: () => void;
}

export function DeckManager({ studyPlanId, allCards, onCardsChange }: DeckManagerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Add new card inline
  const [showAdd, setShowAdd] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [creating, setCreating] = useState(false);

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
      const res = await fetch(`${FASTAPI_URL}/api/v1/flashcards/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: editFront.trim(), back: editBack.trim() }),
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
      const res = await fetch(`${FASTAPI_URL}/api/v1/flashcards/${id}`, {
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

  const createCard = async () => {
    if (!newFront.trim() || !newBack.trim()) return;
    
    try {
      setCreating(true);
      const res = await fetch(`${FASTAPI_URL}/api/v1/flashcards/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_plan_id: studyPlanId,
          front: newFront.trim(),
          back: newBack.trim(),
          topic_slug: "manual",
        }),
      });
      if (res.ok) {
        onCardsChange();
        setNewFront("");
        setNewBack("");
        setShowAdd(false);
      }
    } catch (error) {
      console.error("Failed to create card:", error);
    } finally {
      setCreating(false);
    }
  };

  if (allCards.length === 0 && !showAdd) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        لا توجد بطاقات بعد
      </div>
    );
  }

  return (
    <div className="space-y-2" dir="rtl">
      {/* Add new card button */}
      {!showAdd && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdd(true)}
          className="mb-3 w-full gap-2"
        >
          <Plus className="size-4" />
          إضافة بطاقة جديدة
        </Button>
      )}

      {/* New card form */}
      {showAdd && (
        <div className="bg-muted/30 mb-3 space-y-2 rounded-lg border p-3">
          <Textarea
            placeholder="السؤال..."
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
            dir="auto"
          />
          <Textarea
            placeholder="الإجابة..."
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
            dir="auto"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={createCard}
              disabled={!newFront.trim() || !newBack.trim() || creating}
              className="flex-1"
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : "إضافة"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowAdd(false); setNewFront(""); setNewBack(""); }}
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {/* Cards list */}
      {allCards.map((card) => (
        <div
          key={card.id}
          className={cn(
            "rounded-lg border p-3 transition-colors",
            editingId === card.id ? "bg-muted/50 border-primary" : "hover:bg-muted/30"
          )}
        >
          {editingId === card.id ? (
            // Edit mode
            <div className="space-y-2">
              <Textarea
                value={editFront}
                onChange={(e) => setEditFront(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
                dir="auto"
                placeholder="السؤال..."
              />
              <Textarea
                value={editBack}
                onChange={(e) => setEditBack(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
                dir="auto"
                placeholder="الإجابة..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={!editFront.trim() || !editBack.trim() || saving}
                  className="gap-1"
                >
                  {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
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
                <p className="text-sm font-medium" dir="auto">{card.front}</p>
                <p className="text-muted-foreground mt-1 text-xs" dir="auto">{card.back}</p>
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
