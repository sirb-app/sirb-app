import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Prisma } from "@/generated/prisma";
import { BookOpen } from "lucide-react";
import SubjectCard from "./subject-card";

type SubjectWithRelations = Prisma.SubjectGetPayload<{
  include: {
    college: {
      include: {
        university: true;
      };
    };
  };
}>;

type SubjectListProps = {
  readonly subjects: SubjectWithRelations[];
};

export default function SubjectList({ subjects }: SubjectListProps) {
  if (subjects.length === 0) {
    return (
      <Empty className="my-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpen />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>لم يتم العثور على مقررات دراسية</EmptyTitle>
            <EmptyDescription>
              جرب تغيير معايير البحث أو الفلترة للعثور على مقررات أخرى
            </EmptyDescription>
          </EmptyContent>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {subjects.map(subject => (
        <SubjectCard key={subject.id} subject={subject} />
      ))}
    </div>
  );
}
