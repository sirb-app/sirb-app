"use client";

import type { LucideIcon } from "lucide-react";
import { BookOpen, FileText, HelpCircle, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type StatsSectionProps = {
  readonly canvasCount: number;
  readonly subjectCount: number;
  readonly quizCount: number;
  readonly studyPlanCount: number;
};

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

export function StatsSection({
  canvasCount,
  subjectCount,
  quizCount,
  studyPlanCount,
}: StatsSectionProps) {
  return (
    <section aria-labelledby="stats-heading" className="py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Content Card - Violet */}
          <StatCard
            value={canvasCount}
            label="محتوى تعليمي"
            icon={FileText}
            hoverClass="hover:bg-violet-100 dark:hover:bg-violet-950/40"
            iconHoverBg="group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50"
            iconHoverColor="group-hover:text-violet-600 dark:group-hover:text-violet-400"
          />

          {/* Subjects Card - Cyan */}
          <StatCard
            value={subjectCount}
            label="مقرر دراسي"
            icon={BookOpen}
            hoverClass="hover:bg-cyan-100 dark:hover:bg-cyan-950/40"
            iconHoverBg="group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50"
            iconHoverColor="group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
          />

          {/* Quizzes Card - Amber */}
          <StatCard
            value={quizCount}
            label="اختبار تفاعلي"
            icon={HelpCircle}
            hoverClass="hover:bg-amber-100 dark:hover:bg-amber-950/40"
            iconHoverBg="group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50"
            iconHoverColor="group-hover:text-amber-600 dark:group-hover:text-amber-400"
          />

          {/* Study Plans Card - Rose */}
          <StatCard
            value={studyPlanCount}
            label="جلسة تعليمية"
            icon={Sparkles}
            hoverClass="hover:bg-rose-100 dark:hover:bg-rose-950/40"
            iconHoverBg="group-hover:bg-rose-200 dark:group-hover:bg-rose-900/50"
            iconHoverColor="group-hover:text-rose-600 dark:group-hover:text-rose-400"
          />
        </div>
      </div>
    </section>
  );
}

type StatCardProps = {
  value: number;
  label: string;
  icon: LucideIcon;
  hoverClass: string;
  iconHoverBg: string;
  iconHoverColor: string;
};

function StatCard({
  value,
  label,
  icon: Icon,
  hoverClass,
  iconHoverBg,
  iconHoverColor,
}: StatCardProps) {
  const { count, ref } = useCountUp(value, 1500);

  return (
    <div
      ref={ref}
      className={`group bg-card relative overflow-hidden rounded-2xl p-6 text-center transition-colors duration-300 ${hoverClass}`}
    >
      <div
        className={`bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 ${iconHoverBg}`}
      >
        <Icon
          className={`text-muted-foreground h-6 w-6 transition-colors duration-300 ${iconHoverColor}`}
        />
      </div>
      <div className="text-3xl font-bold tabular-nums md:text-4xl">
        {count}+
      </div>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </div>
  );
}
