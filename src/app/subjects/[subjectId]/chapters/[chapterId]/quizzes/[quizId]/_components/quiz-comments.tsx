"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import QuizCommentForm from "./quiz-comment-form";
import QuizCommentItem from "./quiz-comment-item";

type QuizComment = {
  id: number;
  text: string;
  createdAt: Date;
  editedAt: Date | null;
  upvotesCount: number;
  downvotesCount: number;
  netScore: number;
  isDeleted: boolean;
  userId: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  replies?: QuizComment[];
};

type QuizCommentsProps = {
  readonly quizId: number;
  readonly contributorId: string;
  readonly initialComments: QuizComment[];
  readonly currentUser?: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  readonly currentUserId?: string;
  readonly isAuthenticated: boolean;
};

export default function QuizComments({
  quizId,
  contributorId,
  initialComments,
  currentUser,
  currentUserId,
  isAuthenticated,
}: QuizCommentsProps) {
  const [sortBy, setSortBy] = useState<"best" | "newest">("best");
  const [optimisticComments, setOptimisticComments] = useState<QuizComment[]>(
    []
  );

  const sortedComments = useMemo(() => {
    const comments = [...initialComments];
    if (sortBy === "newest") {
      return comments.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    // Default: best (by netScore)
    return comments.sort((a, b) => b.netScore - a.netScore);
  }, [initialComments, sortBy]);

  const handleAddOptimistic = (text: string) => {
    if (!currentUser) return;

    const tempId = -Date.now() - Math.random();

    const newComment: QuizComment = {
      id: tempId,
      text,
      createdAt: new Date(),
      editedAt: null,
      upvotesCount: 0,
      downvotesCount: 0,
      netScore: 0,
      isDeleted: false,
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
    ...sortedComments.map(c => ({ ...c, isOptimistic: false })),
  ];

  return (
    <div className="border-border border-t pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            التعليقات ({initialComments.length})
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
        <QuizCommentForm
          quizId={quizId}
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
        <div className="space-y-2">
          {displayComments.map(comment => (
            <QuizCommentItem
              key={
                comment.isOptimistic
                  ? `optimistic-${comment.id}`
                  : `real-${comment.id}`
              }
              comment={comment}
              currentUserId={currentUser?.id || currentUserId}
              quizId={quizId}
              contributorId={contributorId}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
