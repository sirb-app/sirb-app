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
        contentId: true;
      };
    };
  };
}> & {
  textMap: Map<number, Prisma.TextContentGetPayload<{}>>;
  videoMap: Map<
    number,
    Prisma.VideoGetPayload<{
      include: {
        progress: { select: { lastPosition: true } };
      };
    }>
  >;
  fileMap: Map<number, Prisma.FileGetPayload<{}>>;
};

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
          if (block.contentType === "TEXT") {
            const textContent = canvas.textMap.get(block.contentId);
            if (!textContent) return null;
            return (
              <TextContentBlock key={block.id} content={textContent.content} />
            );
          }

          if (block.contentType === "VIDEO") {
            const video = canvas.videoMap.get(block.contentId);
            if (!video) return null;
            return <VideoContentBlock key={block.id} video={video} />;
          }

          if (block.contentType === "FILE") {
            const file = canvas.fileMap.get(block.contentId);
            if (!file) return null;
            return <FileContentBlock key={block.id} file={file} />;
          }

          return null;
        })}
      </div>

      {/* Placeholder for Phase 2-4: Video progress, Canvas progress, Votes, Comments */}
    </div>
  );
}
