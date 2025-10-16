import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma";
import { BookOpen, GraduationCap, School } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type SubjectWithRelations = Prisma.SubjectGetPayload<{
  include: {
    college: {
      include: {
        university: true;
      };
    };
  };
}>;

type SubjectCardProps = {
  readonly subject: SubjectWithRelations;
};

export default function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0 transition-shadow hover:shadow-lg">
      {/* Image with Code Badge */}
      <div className="bg-muted relative aspect-video w-full overflow-hidden">
        {subject.imageUrl ? (
          <Image
            src={subject.imageUrl}
            alt={subject.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          // Fallback with icon
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="text-muted-foreground h-12 w-12" />
          </div>
        )}
        {/* Code Badge - Absolute positioned on top left */}
        <span className="bg-background absolute top-2 left-2 rounded-md px-2.5 py-1 font-mono text-xs font-medium shadow-md">
          {subject.code}
        </span>
      </div>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Subject Name */}
        <h3 className="line-clamp-2 text-base leading-tight font-semibold">
          {subject.name}
        </h3>

        {/* Description */}
        {subject.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {subject.description}
          </p>
        )}

        {/* College and University - Smaller text */}
        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs">
            <School className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            <span className="text-muted-foreground truncate">
              {subject.college.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <GraduationCap className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            <span className="text-muted-foreground truncate">
              {subject.college.university.name}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Footer with Button */}
      <CardFooter className="px-4 pt-0 pb-4">
        <Button asChild variant="outline" className="w-full" size="sm">
          <Link href={`/subjects/${subject.id}`}>التفاصيل</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
