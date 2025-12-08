import HomeSearch from "@/components/home-search";
import { Logo } from "@/components/logo";
import type { Prisma } from "@/generated/prisma";

type University = Prisma.UniversityGetPayload<{
  select: {
    id: true;
    name: true;
    code: true;
    imageUrl: true;
  };
}>;

type HeroSectionProps = {
  readonly universities: University[];
};

export function HeroSection({ universities }: HeroSectionProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[80vh] items-center justify-center py-16 md:py-24"
    >
      {/* Subtle grid background */}
      <div className="bg-grid-pattern pointer-events-none absolute inset-0" />

      <div className="relative mx-auto w-full max-w-4xl px-4 md:px-8">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Main Logo */}
          <Logo size="3xl" className="mb-4" />

          {/* Tagline */}
          <h1
            id="hero-heading"
            className="text-foreground text-2xl font-medium md:text-3xl lg:text-4xl"
          >
            منصة تعليمية تجمع الطلاب لمشاركة المعرفة
          </h1>

          {/* Search CTA */}
          <div className="mt-4 w-full max-w-2xl">
            <HomeSearch universities={universities} />
          </div>

          {/* Helper Text */}
          <p className="text-muted-foreground text-sm">
            ابحث عن مقررك الدراسي أو{" "}
            <a href="/subjects" className="text-primary hover:underline">
              تصفح جميع المقررات
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
