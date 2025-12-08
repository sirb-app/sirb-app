"use client";

import {
  deleteQuizComment,
  toggleQuizCommentVote,
  updateQuizComment,
} from "@/actions/quiz-comment.action";
import ReportDialog from "@/components/report-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowBigDown,
  ArrowBigUp,
  ChevronDown,
  Flag,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import DeleteQuizCommentDialog from "./delete-quiz-comment-dialog";
import QuizCommentForm from "./quiz-comment-form";

type QuizCommentItemProps = {
  readonly comment: {
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
    replies?: QuizCommentItemProps["comment"][];
  };
  readonly userVote?: "LIKE" | "DISLIKE" | null;
  readonly currentUserId?: string;
  readonly quizId: number;
  readonly contributorId: string;
  readonly level?: number;
  readonly isAuthenticated: boolean;
};

export default function QuizCommentItem({
  comment,
  userVote = null,
  currentUserId,
  quizId,
  contributorId,
  level = 0,
  isAuthenticated,
}: QuizCommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticVote, setOptimisticVote] = useState<
    "LIKE" | "DISLIKE" | null
  >(userVote);
  const [optimisticScore, setOptimisticScore] = useState(comment.netScore);
  const [optimisticIsDeleted, setOptimisticIsDeleted] = useState(
    comment.isDeleted
  );
  const router = useRouter();

  const isOwner = currentUserId === comment.userId;
  const isContributor = comment.userId === contributorId;

  const handleVote = async (voteType: "LIKE" | "DISLIKE") => {
    if (!isAuthenticated) {
      toast.info("يجب تسجيل الدخول للتصويت");
      return;
    }

    // Prevent self-voting
    if (isOwner) {
      toast.info("لا يمكنك التصويت على تعليقك");
      return;
    }

    const previousVote = optimisticVote;
    const previousScore = optimisticScore;

    // Optimistic update (instant)
    let newScore = optimisticScore;
    if (previousVote === voteType) {
      setOptimisticVote(null);
      newScore += voteType === "LIKE" ? -1 : 1;
    } else if (previousVote) {
      setOptimisticVote(voteType);
      newScore += voteType === "LIKE" ? 2 : -2;
    } else {
      setOptimisticVote(voteType);
      newScore += voteType === "LIKE" ? 1 : -1;
    }
    setOptimisticScore(newScore);

    // Fire and forget - don't wait for server response
    toggleQuizCommentVote({ commentId: comment.id, voteType })
      .then(() => {
        router.refresh();
      })
      .catch(() => {
        // Revert optimistic update
        setOptimisticVote(previousVote);
        setOptimisticScore(previousScore);
        toast.error("فشل التصويت");
      });
  };

  const handleEdit = async () => {
    if (editText.trim() === comment.text) {
      setIsEditing(false);
      return;
    }

    startTransition(async () => {
      try {
        await updateQuizComment({ commentId: comment.id, text: editText });
        toast.success("تم تعديل التعليق");
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        toast.error("فشل التعديل");
        console.error("Edit error:", error);
      }
    });
  };

  const handleDelete = async () => {
    // Optimistic update
    setOptimisticIsDeleted(true);
    setDeleteDialogOpen(false);

    try {
      await deleteQuizComment(comment.id);
      toast.success("تم حذف التعليق");
      router.refresh();
    } catch (error) {
      // Revert on failure
      setOptimisticIsDeleted(false);
      toast.error("فشل الحذف");
      console.error("Delete error:", error);
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "منذ لحظات";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  };

  const replyCount = comment.replies?.length || 0;

  return (
    <div style={{ paddingRight: `${level * 2}rem` }}>
      {/* Vertical reply line for nested comments */}
      {level > 0 && (
        <div
          className="border-muted absolute h-full border-r"
          style={{ right: `${level * 2 - 0.5}rem` }}
        />
      )}

      <div className="group relative py-3">
        {/* Comment Header */}
        <div className="mb-2 flex items-center gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={comment.user.image || undefined} />
            <AvatarFallback>
              {comment.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{comment.user.name}</span>

            {isContributor && (
              <span className="bg-primary/15 border-primary/30 text-primary rounded border px-2 py-0.5 text-xs">
                المساهم
              </span>
            )}

            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground text-xs">
              {timeAgo(comment.createdAt)}
            </span>

            {comment.editedAt && (
              <>
                <span className="text-muted-foreground">•</span>
                <span
                  className="text-muted-foreground text-xs"
                  title={`تم التعديل ${timeAgo(comment.editedAt)}`}
                >
                  (تم التعديل)
                </span>
              </>
            )}
          </div>

          {/* Three Dots Menu - at the end */}
          {!optimisticIsDeleted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors",
                    "data-[state=open]:bg-muted data-[state=open]:text-foreground"
                  )}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {isOwner ? (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="ml-2 h-4 w-4" />
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.info("يجب تسجيل الدخول للإبلاغ");
                        return;
                      }
                      setReportDialogOpen(true);
                    }}
                  >
                    <Flag className="ml-2 h-4 w-4" />
                    إبلاغ
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Comment Content */}
        {optimisticIsDeleted ? (
          <div className="text-muted-foreground mr-10 mb-2 text-sm break-words italic">
            [تم حذف التعليق]
          </div>
        ) : isEditing ? (
          <div className="mr-10 mb-3 space-y-2">
            <Textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={isPending || !editText.trim()}
              >
                {isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.text);
                }}
                disabled={isPending}
              >
                إلغاء
              </Button>
            </div>
          </div>
        ) : (
          <div className="mr-10 mb-2 text-sm break-words whitespace-pre-wrap">
            {comment.text}
          </div>
        )}

        {/* Comment Actions */}
        {!optimisticIsDeleted && !isEditing && (
          <div className="mr-10 flex items-center gap-2">
            {/* Vote Buttons - Reddit style with score between */}
            <div className="flex items-center">
              <button
                onClick={() => handleVote("LIKE")}
                className={cn(
                  "hover:bg-muted rounded p-1 transition-colors",
                  optimisticVote === "LIKE"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <ArrowBigUp
                  className={cn(
                    "h-5 w-5",
                    optimisticVote === "LIKE" && "fill-current"
                  )}
                />
              </button>
              <span
                className={cn(
                  "min-w-[2rem] text-center text-xs font-semibold",
                  optimisticScore > 0 && "text-primary",
                  optimisticScore < 0 && "text-destructive",
                  optimisticScore === 0 && "text-muted-foreground"
                )}
              >
                {optimisticScore > 0 && "+"}
                {optimisticScore}
              </span>
              <button
                onClick={() => handleVote("DISLIKE")}
                className={cn(
                  "hover:bg-muted rounded p-1 transition-colors",
                  optimisticVote === "DISLIKE"
                    ? "text-destructive"
                    : "text-muted-foreground hover:text-destructive"
                )}
              >
                <ArrowBigDown
                  className={cn(
                    "h-5 w-5",
                    optimisticVote === "DISLIKE" && "fill-current"
                  )}
                />
              </button>
            </div>

            {/* Reply Button - Only show on top-level comments */}
            {level === 0 && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded px-2 py-1 text-xs font-medium transition-colors"
              >
                <MessageSquare className="ml-1 inline h-3.5 w-3.5" />
                رد
              </button>
            )}
          </div>
        )}

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-3 mr-10">
            <QuizCommentForm
              quizId={quizId}
              parentCommentId={comment.id}
              onSuccess={() => setIsReplying(false)}
              onCancel={() => setIsReplying(false)}
              placeholder="اكتب ردك..."
              isAuthenticated={isAuthenticated}
            />
          </div>
        )}

        {/* Show Replies Button - YouTube style */}
        {level === 0 && !showReplies && replyCount > 0 && (
          <button
            onClick={() => setShowReplies(true)}
            className="text-primary hover:bg-muted mt-2 mr-10 flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
            {replyCount} {replyCount === 1 ? "رد" : "ردود"}
          </button>
        )}

        {/* Flat Replies - YouTube style (no deep nesting) */}
        {level === 0 &&
          showReplies &&
          comment.replies &&
          comment.replies.length > 0 && (
            <div className="mt-3 mr-10 space-y-3">
              {comment.replies.map(reply => (
                <QuizCommentItem
                  key={reply.id}
                  comment={reply}
                  userVote={null}
                  currentUserId={currentUserId}
                  quizId={quizId}
                  contributorId={contributorId}
                  level={1}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
      </div>

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        type="quizComment"
        targetId={comment.id}
      />

      <DeleteQuizCommentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
