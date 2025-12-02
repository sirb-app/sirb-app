"use client";

import { voteCanvas } from "@/actions/canvas-vote.action";
import ReportDialog from "@/components/report-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Eye,
  Flag,
  Link,
  MoreVertical,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CanvasContributorSectionProps = {
  readonly canvas: {
    id: number;
    contributorId: string;
    createdAt: Date;
    upvotesCount: number;
    downvotesCount: number;
    netScore: number;
    viewCount: number;
    contributor: {
      id: string;
      name: string;
      image: string | null;
    };
  };
  readonly userVote?: "LIKE" | "DISLIKE" | null;
  readonly isAuthenticated: boolean;
};

export default function CanvasContributorSection({
  canvas,
  userVote = null,
  isAuthenticated,
}: CanvasContributorSectionProps) {
  const [optimisticVote, setOptimisticVote] = useState<
    "LIKE" | "DISLIKE" | null
  >(userVote);
  const [optimisticUpvotes, setOptimisticUpvotes] = useState(
    canvas.upvotesCount
  );
  const [optimisticDownvotes, setOptimisticDownvotes] = useState(
    canvas.downvotesCount
  );
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const router = useRouter();

  const handleVote = async (voteType: "LIKE" | "DISLIKE") => {
    if (!isAuthenticated) {
      toast.info("يجب تسجيل الدخول للتصويت");
      return;
    }

    const previousVote = optimisticVote;
    const previousUpvotes = optimisticUpvotes;
    const previousDownvotes = optimisticDownvotes;

    // Optimistic update (instant)
    let newUpvotes = optimisticUpvotes;
    let newDownvotes = optimisticDownvotes;

    if (previousVote === voteType) {
      // Remove vote
      setOptimisticVote(null);
      if (voteType === "LIKE") {
        newUpvotes--;
      } else {
        newDownvotes--;
      }
    } else if (previousVote) {
      // Change vote
      setOptimisticVote(voteType);
      if (voteType === "LIKE") {
        newUpvotes++;
        newDownvotes--;
      } else {
        newDownvotes++;
        newUpvotes--;
      }
    } else {
      // New vote
      setOptimisticVote(voteType);
      if (voteType === "LIKE") {
        newUpvotes++;
      } else {
        newDownvotes++;
      }
    }

    setOptimisticUpvotes(newUpvotes);
    setOptimisticDownvotes(newDownvotes);

    // Fire and forget - don't wait for server response
    voteCanvas(canvas.id, voteType)
      .then(() => {
        router.refresh();
      })
      .catch(error => {
        // Revert optimistic update
        setOptimisticVote(previousVote);
        setOptimisticUpvotes(previousUpvotes);
        setOptimisticDownvotes(previousDownvotes);
        toast.error("فشل التصويت");
        console.error("Vote error:", error);
      });
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      toast.info("يجب تسجيل الدخول للإبلاغ");
      return;
    }
    setReportDialogOpen(true);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط");
    } catch (error) {
      toast.error("فشل نسخ الرابط");
    }
  };

  // Format relative time
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

  // Format view count
  const formatViewCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <>
      <div className="flex items-center justify-between py-4">
        {/* Left: Contributor Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={canvas.contributor.image || undefined} />
            <AvatarFallback>
              {canvas.contributor.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{canvas.contributor.name}</div>
            <div className="text-muted-foreground text-sm">
              {timeAgo(canvas.createdAt)}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* View Count */}
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <span className="font-medium">
              {formatViewCount(canvas.viewCount)}
            </span>
            <Eye className="h-4 w-4" />
          </div>

          {/* Divider */}
          <div className="border-border mx-1 h-6 w-px border-r" />

          {/* Thumbs Up/Down - YouTube style with separate counts */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote("LIKE")}
              className={cn(
                "hover:bg-muted flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors",
                optimisticVote === "LIKE"
                  ? "bg-primary/15 border-primary/30 border text-primary"
                  : "text-muted-foreground"
              )}
              aria-label="أعجبني"
            >
              <ThumbsUp
                className={cn(
                  "h-5 w-5",
                  optimisticVote === "LIKE" && "fill-current"
                )}
              />
              {optimisticUpvotes > 0 && (
                <span className="text-sm font-medium">
                  {formatViewCount(optimisticUpvotes)}
                </span>
              )}
            </button>

            <button
              onClick={() => handleVote("DISLIKE")}
              className={cn(
                "hover:bg-muted flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors",
                optimisticVote === "DISLIKE"
                  ? "bg-destructive/15 border-destructive/30 border text-destructive"
                  : "text-muted-foreground"
              )}
              aria-label="لم يعجبني"
            >
              <ThumbsDown
                className={cn(
                  "h-5 w-5",
                  optimisticVote === "DISLIKE" && "fill-current"
                )}
              />
              {optimisticDownvotes > 0 && (
                <span className="text-sm font-medium">
                  {formatViewCount(optimisticDownvotes)}
                </span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="border-border mx-1 h-6 w-px border-r" />

          {/* Three Dots Menu with Share and Report */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-2 transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleShare}>
                <Link className="ml-2 h-4 w-4" />
                نسخ رابط الدرس
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="ml-2 h-4 w-4" />
                إبلاغ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        type="canvas"
        targetId={canvas.id}
      />
    </>
  );
}
