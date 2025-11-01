import CanvasFileViewer from "@/components/canvas-file-viewer";
import CanvasQuizViewer from "@/components/canvas-quiz-viewer";
import CanvasVideoPlayer from "@/components/canvas-video-player";
import type { Prisma } from "@/generated/prisma";
import { stripTitlePrefix } from "@/lib/utils";

type CanvasWithContent = Prisma.CanvasGetPayload<{
  include: {
    videos: {
      include: {
        progress: {
          select: { lastPosition: true };
        };
      };
    };
    files: true;
    quizzes: true;
  };
}>;

type CanvasContentProps = {
  readonly canvas: CanvasWithContent;
  readonly userId: string;
};

export default function CanvasContent({ canvas, userId }: CanvasContentProps) {
  // Combine all content and sort by sequence
  const allContent = [
    ...canvas.videos.map(v => ({ ...v, type: "video" as const })),
    ...canvas.files.map(f => ({ ...f, type: "file" as const })),
    ...canvas.quizzes.map(q => ({ ...q, type: "quiz" as const })),
  ].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 py-8 md:p-8 md:py-12">
      {/* Canvas Header */}
      <div className="space-y-3">
        <h1 className="text-3xl leading-tight font-bold md:text-4xl">
          {stripTitlePrefix(canvas.title)}
        </h1>
        {canvas.description && (
          <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
            {canvas.description}
          </p>
        )}
      </div>

      {/* Content Items */}
      {allContent.length > 0 ? (
        <div className="space-y-8">
          {allContent.map((item, index) => {
            if (item.type === "video") {
              return (
                <CanvasVideoPlayer
                  key={`video-${item.id}`}
                  video={item}
                  userId={userId}
                />
              );
            }

            if (item.type === "file") {
              return <CanvasFileViewer key={`file-${item.id}`} file={item} />;
            }

            if (item.type === "quiz") {
              return <CanvasQuizViewer key={`quiz-${item.id}`} quiz={item} />;
            }

            return null;
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            لا يوجد محتوى متاح حالياً
          </p>
        </div>
      )}
    </div>
  );
}
