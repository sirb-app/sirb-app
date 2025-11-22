"use client";

import { saveVideoProgress } from "@/actions/save-video-progress.action";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";

type VideoContentBlockProps = {
  readonly video: {
    id: number;
    title: string;
    description: string | null;
    youtubeVideoId: string;
    duration: number;
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
    <div className="space-y-4">
      {video.description && (
        <div className="text-muted-foreground text-sm">{video.description}</div>
      )}

      {/* Video player - responsive following react-player v3 docs */}
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
  );
}
