"use client";

import { BookOpen } from "lucide-react";
import SubjectEnrollmentCard from "./subject-enrollment-card";

type Enrollment = {
  id: number;
  subject: {
    id: number;
    name: string;
    code: string;
    imageUrl: string | null;
    college: {
      name: string;
    };
  };
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
};

type LearningTabProps = {
  readonly enrollments: Enrollment[];
};

export default function LearningTab({ enrollments }: LearningTabProps) {
  if (enrollments.length === 0) {
    return (
      <div className="text-muted-foreground bg-muted/20 rounded-lg border py-12 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p className="text-lg font-medium">لم تسجل في أي مقرر بعد</p>
        <p className="text-sm">سجل في مقرر لبدء رحلتك التعليمية</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {enrollments.map(enrollment => (
        <SubjectEnrollmentCard key={enrollment.id} enrollment={enrollment} />
      ))}
    </div>
  );
}
