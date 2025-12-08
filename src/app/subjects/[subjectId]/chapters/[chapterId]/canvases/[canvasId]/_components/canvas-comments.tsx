"use client";

import { getComments } from "@/actions/get-comments.action";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import CommentForm from "./comment-form";
import CommentItem from "./comment-item";

type Comment = {
  id: number;
  text: string;
  createdAt: Date;
  editedAt: Date | null;
  upvotesCount: number;
  downvotesCount: number;
  netScore: number;
  isDeleted: boolean;
  isPinned: boolean;
  isAnnouncement: boolean;
  userId: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  replies?: Comment[];
};

type CanvasCommentsProps = {
  readonly canvasId: number;
  readonly contributorId: string;
  readonly initialComments: Comment[];
  readonly initialNextCursor: number | null;
  readonly initialHasMore: boolean;
  readonly currentUser?: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  readonly currentUserId?: string;
  readonly isAuthenticated: boolean;
};

export default function CanvasComments({
  canvasId,
  contributorId,
  initialComments,
  initialNextCursor,
  initialHasMore,
  currentUser,
  currentUserId,
  isAuthenticated,
}: CanvasCommentsProps) {
  const [sortBy, setSortBy] = useState<"best" | "newest">("best");
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>(initialComments);
  const [nextCursor, setNextCursor] = useState<number | null>(
    initialNextCursor
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isResettingRef = useRef(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isResettingRef.current = true;
    setAllComments(initialComments);
    setNextCursor(initialNextCursor);
    setHasMore(initialHasMore);
    setOptimisticComments([]);
    setTimeout(() => {
      isResettingRef.current = false;
    }, 100);
  }, [initialComments, initialNextCursor, initialHasMore]);

  useEffect(() => {
    const resetPagination = async () => {
      isResettingRef.current = true;
      setIsLoadingMore(true);
      try {
        const data = await getComments(canvasId, undefined, sortBy);
        setAllComments(data.comments);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoadingMore(false);
        setTimeout(() => {
          isResettingRef.current = false;
        }, 100);
      }
    };

    const isInitialMount = sortBy === "best";
    if (!isInitialMount) {
      resetPagination();
    }
  }, [sortBy, canvasId]);

  const loadMore = useCallback(async () => {
    if (isResettingRef.current || !hasMore || isLoadingMore || !nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const data = await getComments(canvasId, nextCursor, sortBy);

      setAllComments(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newComments = data.comments.filter(c => !existingIds.has(c.id));
        return [...prev, ...newComments];
      });

      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error loading more comments:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [canvasId, nextCursor, hasMore, isLoadingMore, sortBy]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  const handleAddOptimistic = (text: string) => {
    if (!currentUser) return;

    const tempId = -Date.now() - Math.random();

    const newComment: Comment = {
      id: tempId,
      text,
      createdAt: new Date(),
      editedAt: null,
      upvotesCount: 0,
      downvotesCount: 0,
      netScore: 0,
      isDeleted: false,
      isPinned: false,
      isAnnouncement: false,
      userId: currentUser.id,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        image: currentUser.image,
      },
      replies: [],
    };

    setOptimisticComments(prev => [newComment, ...prev]);
  };

  const displayComments = [
    ...optimisticComments.map(c => ({ ...c, isOptimistic: true })),
    ...allComments.map(c => ({ ...c, isOptimistic: false })),
  ];

  return (
    <div className="border-border border-t pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            التعليقات ({allComments.length})
          </h2>
        </div>

        <Select
          value={sortBy}
          onValueChange={v => setSortBy(v as "best" | "newest")}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="best">الأفضل</SelectItem>
            <SelectItem value="newest">الأحدث</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-8">
        <CommentForm
          canvasId={canvasId}
          isAuthenticated={isAuthenticated}
          placeholder="أضف تعليقاً..."
          onAddComment={handleAddOptimistic}
        />
      </div>

      {displayComments.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">
          لا توجد تعليقات بعد. كن أول من يعلق!
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displayComments.map(comment => (
              <CommentItem
                key={
                  comment.isOptimistic
                    ? `optimistic-${comment.id}`
                    : `real-${comment.id}`
                }
                comment={comment}
                currentUserId={currentUser?.id || currentUserId}
                canvasId={canvasId}
                contributorId={contributorId}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>

          <div ref={observerTarget} className="h-4" />

          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          )}

          {hasMore && !isLoadingMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                تحميل المزيد
              </Button>
            </div>
          )}

          {!hasMore && allComments.length > 0 && (
            <div className="text-muted-foreground mt-4 py-4 text-center text-sm">
              لا يوجد المزيد من التعليقات
            </div>
          )}
        </>
      )}
    </div>
  );
}
