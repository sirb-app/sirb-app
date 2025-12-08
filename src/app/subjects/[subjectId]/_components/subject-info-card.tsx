import { Card, CardContent } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma";
import { BookOpen, GraduationCap, School, Trophy } from "lucide-react";
import Image from "next/image";
import { AdaptiveLearningSection, type StudyPlanSession } from "./adaptive-learning-section";
import EnrollmentButton from "./enrollment-button";

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
  readonly subject: SubjectWithRelations & {
    topContributor: {
      id: string;
      name: string;
      image: string | null;
      points: number;
    } | null;
    isEnrolled: boolean;
    chapters: Array<{
      id: number;
      title: string;
      sequence: number;
    }>;
  };
  readonly isAuthenticated: boolean;
  readonly sessions: StudyPlanSession[];
};

export default function SubjectInfoCard({
  subject,
  isAuthenticated,
  sessions,
}: SubjectInfoCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row-reverse md:items-start md:gap-8">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg md:w-80 md:flex-shrink-0">
            {subject.imageUrl ? (
              <Image
                src={subject.imageUrl}
                alt={subject.name}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
              />
            ) : (
              <div className="from-muted to-muted/50 flex h-full w-full items-center justify-center bg-gradient-to-br">
                <BookOpen className="text-muted-foreground/40 h-20 w-20" />
              </div>
            )}
            <span className="bg-background absolute top-3 left-3 rounded-md px-3 py-1.5 font-mono text-sm font-medium shadow-md">
              {subject.code}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div>
              <h1 className="text-2xl leading-tight font-bold md:text-3xl">
                {subject.name}
              </h1>
            </div>

            {subject.description && (
              <p className="text-muted-foreground leading-relaxed">
                {subject.description}
              </p>
            )}

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

            {subject.topContributor && (
              <div className="flex items-center gap-2">
                <Trophy className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="text-sm">
                  أكثر مساهم: {subject.topContributor.name}
                </span>
              </div>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-2">
              <EnrollmentButton
                subjectId={subject.id}
                initialIsEnrolled={subject.isEnrolled}
                isAuthenticated={isAuthenticated}
              />
              <AdaptiveLearningSection
                subjectId={subject.id}
                chapters={subject.chapters}
                isAuthenticated={isAuthenticated}
                isEnrolled={subject.isEnrolled}
                sessions={sessions}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
