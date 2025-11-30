"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle, FileText, Trophy } from "lucide-react";

type DashboardStatsProps = {
  readonly stats: {
    totalContributions: number;
    totalEnrollments: number;
    completedCanvases: number;
    totalPoints: number;
  };
};

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "مساهماتي",
      value: stats.totalContributions,
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "المقررات المسجلة",
      value: stats.totalEnrollments,
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "الشروحات المكتملة",
      value: stats.completedCanvases,
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      title: "النقاط الكلية",
      value: stats.totalPoints,
      icon: <Trophy className="h-5 w-5" />,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-primary/10 text-primary rounded-lg p-3">
              {stat.icon}
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
