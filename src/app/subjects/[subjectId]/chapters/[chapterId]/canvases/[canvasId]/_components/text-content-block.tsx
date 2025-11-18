type TextContentBlockProps = {
  readonly content: string;
};

export default function TextContentBlock({ content }: TextContentBlockProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}
