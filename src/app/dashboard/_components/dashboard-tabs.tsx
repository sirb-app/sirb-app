"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ContentStatus } from "@/generated/prisma";
import ContributionsTab from "./contributions-tab";
import LearningTab from "./learning-tab";

type Canvas = {
  id: number;
  title: string;
  status: ContentStatus;
  rejectionReason: string | null;
  updatedAt: Date;
  chapter: {
    id: number;
    title: string;
    subject: {
      id: number;
      name: string;
      code: string;
    };
  };
  _count: {
    contentBlocks: number;
  };
};

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

type DashboardTabsProps = {
  readonly canvasesByStatus: {
    DRAFT: Canvas[];
    PENDING: Canvas[];
    REJECTED: Canvas[];
    APPROVED: Canvas[];
  };
  readonly enrollments: Enrollment[];
};

export default function DashboardTabs({
  canvasesByStatus,
  enrollments,
}: DashboardTabsProps) {
  const totalContributions = Object.values(canvasesByStatus).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <Tabs defaultValue="learning" className="w-full" dir="rtl">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="learning">
          التعلم ({enrollments.length})
        </TabsTrigger>
        <TabsTrigger value="contributions">
          مساهماتي ({totalContributions})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="learning" className="mt-6">
        <LearningTab enrollments={enrollments} />
      </TabsContent>

      <TabsContent value="contributions" className="mt-6">
        <ContributionsTab canvasesByStatus={canvasesByStatus} />
      </TabsContent>
    </Tabs>
  );
}
