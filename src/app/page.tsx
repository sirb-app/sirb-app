import {
  CTASection,
  FAQSection,
  FeaturesSection,
  HeroSection,
  StatsSection,
  TestimonialsSection,
} from "@/components/home";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سرب",
  description:
    "منصة تعليمية تشاركية تجمع طلاب الجامعات للتعلم والتعليم من خلال المحتوى الذي ينشئه الطلاب",
};

export default async function Page() {
  // Parallel data fetching for better performance
  const [universities, canvasCount, subjectCount, quizCount] =
    await Promise.all([
      prisma.university.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true, imageUrl: true },
      }),
      prisma.canvas.count({
        where: { status: "APPROVED", isDeleted: false },
      }),
      prisma.subject.count(),
      prisma.quiz.count(),
      // TODO: Uncomment when StudyPlan model is added to Prisma schema
      // prisma.studyPlan.count(),
    ]);

  // TODO: Replace with actual query result when StudyPlan model exists
  const studyPlanCount = 127; // Hardcoded placeholder

  return (
    <div className="flex flex-col">
      {/* Hero - Above the fold with search CTA */}
      <HeroSection universities={universities} />

      {/* Social Proof - Stats (early to build trust) */}
      <StatsSection
        canvasCount={canvasCount}
        subjectCount={subjectCount}
        quizCount={quizCount}
        studyPlanCount={studyPlanCount}
      />

      {/* Features - Bento box showcase */}
      <FeaturesSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <CTASection />
    </div>
  );
}
