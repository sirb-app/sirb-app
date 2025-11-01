import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma";
import { GraduationCap, School } from "lucide-react";
import Image from "next/image";

type SubjectWithRelations = Prisma.SubjectGetPayload<{
  include: {
    college: {
      include: {
        university: true;
      };
    };
  };
}>;

type SubjectInfoCardProps = {
  readonly subject: SubjectWithRelations;
};

export default function SubjectInfoCard({ subject }: SubjectInfoCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          {/* Subject Details */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl leading-tight font-bold md:text-3xl">
                {subject.name}
              </h1>
            </div>

            {/* Description */}
            {subject.description && (
              <p className="text-muted-foreground leading-relaxed">
                {subject.description}
              </p>
            )}

            {/* College and University */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <School className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="text-sm">كلية {subject.college.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="text-sm">
                  جامعة {subject.college.university.name}
                </span>
              </div>
            </div>

            {/* Enroll Button */}
            <div className="mt-auto">
              <Button size="lg" className="w-full md:w-auto">
                التسجيل في المقرر
              </Button>
            </div>
          </div>

          {/* Subject Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg md:w-80 md:flex-shrink-0">
            {subject.imageUrl ? (
              <Image
                src={subject.imageUrl}
                alt={subject.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <div className="text-center">
                  <div className="text-muted-foreground mb-2 text-4xl">📚</div>
                  <p className="text-muted-foreground text-sm">لا توجد صورة</p>
                </div>
              </div>
            )}
            {/* Code Badge */}
            <span className="bg-background absolute top-3 left-3 rounded-md px-3 py-1.5 font-mono text-sm font-medium shadow-md">
              {subject.code}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
