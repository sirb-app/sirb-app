import { TipTapViewer } from "@/components/ui/tiptap-viewer";

type TextContentBlockProps = {
  readonly content: string;
};

export default function TextContentBlock({ content }: TextContentBlockProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <TipTapViewer content={content} />
    </div>
  );
}
