"use client";

import { saveVideoProgress } from "@/actions/save-video-progress.action";
import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";

type VideoContentBlockProps = {
  readonly video: {
    id: number;
    title: string;
    description: string | null;
    youtubeVideoId: string;
    duration: number;
    isOriginal: boolean;
    progress: Array<{ lastPosition: number }>;
  };
};

export default function VideoContentBlock({ video }: VideoContentBlockProps) {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hasResumed = useRef(false);
  const savedPositionRef = useRef(video.progress[0]?.lastPosition || 0);
  const [currentTime, setCurrentTime] = useState(0);

  // Save progress to database (debounced)
  const saveProgress = useCallback(
    async (position: number) => {
      try {
        await saveVideoProgress(video.id, position);
      } catch (error) {
        console.error("Failed to save video progress:", error);
      }
    },
    [video.id]
  );

  // Handle progress updates - stable reference
  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const videoEl = e.target as HTMLVideoElement;
      const playedSeconds = videoEl.currentTime;

      setCurrentTime(playedSeconds);

      // Debounce saving to DB (save every 5 seconds)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProgress(playedSeconds);
      }, 5000);
    },
    [saveProgress]
  );

  // Auto-resume from saved position (only once)
  const handleLoadedMetadata = useCallback(() => {
    if (
      !hasResumed.current &&
      savedPositionRef.current > 10 &&
      playerRef.current
    ) {
      playerRef.current.currentTime = savedPositionRef.current;
      hasResumed.current = true;
    }
  }, []);

  // Save on pause
  const handlePause = useCallback(() => {
    if (currentTime > 0) {
      saveProgress(currentTime);
    }
  }, [currentTime, saveProgress]);

  // Save progress on unmount (when user navigates away)
  useEffect(() => {
    return () => {
      if (currentTime > 0) {
        saveProgress(currentTime);
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentTime, saveProgress]);

  return (
    <div className="space-y-3">
      {video.title && (
        <div className="text-muted-foreground text-sm">{video.title}</div>
      )}

      {/* Video player - responsive following react-player v3 docs */}
      <div className="relative">
        <ReactPlayer
          ref={playerRef}
          src={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
          style={{ width: "100%", height: "auto", aspectRatio: "16/9" }}
          controls
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
        />
      </div>

      {/* Source Attribution - Subtle informational style */}
      {/* Show badge when isOriginal is false (meaning isExternal is true) */}
      {video.isOriginal === false && (
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm">
          <ExternalLink className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span className="leading-relaxed">محتوى منقول من مصدر خارجي</span>
        </div>
      )}
    </div>
  );
}
