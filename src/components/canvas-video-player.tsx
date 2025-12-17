"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma";

type VideoWithProgress = Prisma.VideoGetPayload<{
  include: {
    progress: {
      select: { lastPosition: true };
    };
  };
}>;

type CanvasVideoPlayerProps = {
  readonly video: VideoWithProgress;
};

export default function CanvasVideoPlayer({ video }: CanvasVideoPlayerProps) {
  // Get last position from progress or default to 0
  const lastPosition = video.progress[0]?.lastPosition || 0;
  const startTime = Math.floor(lastPosition);

  // YouTube embed URL with start time parameter
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeVideoId}?start=${startTime}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{video.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Embed */}
        <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        {/* Video Description */}
        {video.description && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {video.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
