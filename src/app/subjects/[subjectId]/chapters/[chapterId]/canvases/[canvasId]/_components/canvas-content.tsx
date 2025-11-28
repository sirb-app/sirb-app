import type { Prisma } from "@/generated/prisma";
import CanvasHeader from "./canvas-header";
import FileContentBlock from "./file-content-block";
import TextContentBlock from "./text-content-block";
import VideoContentBlock from "./video-content-block";

type CanvasWithContent = Prisma.CanvasGetPayload<{
  include: {
    chapter: {
      select: {
        id: true;
        title: true;
        sequence: true;
        subjectId: true;
      };
    };
    contentBlocks: {
      select: {
        id: true;
        sequence: true;
        contentType: true;
        textContent: true;
        video: {
          include: {
            progress: { select: { lastPosition: true } };
          };
        };
        file: true;
      };
    };
  };
}>;

type CanvasContentProps = {
  readonly canvas: CanvasWithContent;
  readonly userId: string;
};

export default function CanvasContent({ canvas }: CanvasContentProps) {
  return (
    <div className="space-y-8">
      {/* Header with back button */}
      <CanvasHeader
        title={canvas.title}
        description={canvas.description}
        subjectId={canvas.chapter.subjectId}
        chapterId={canvas.chapterId}
      />

      {/* Content Items */}
      <div className="space-y-6">
        {canvas.contentBlocks.map(block => {
          if (block.contentType === "TEXT" && block.textContent) {
            return (
              <TextContentBlock key={block.id} content={block.textContent.content} />
            );
          }

          if (block.contentType === "VIDEO" && block.video) {
            return <VideoContentBlock key={block.id} video={block.video} />;
          }

          if (block.contentType === "FILE" && block.file) {
            return <FileContentBlock key={block.id} file={block.file} />;
          }

          return null;
        })}
      </div>

      {/* Placeholder for Phase 2-4: Video progress, Canvas progress, Votes, Comments */}
    </div>
  );
}
