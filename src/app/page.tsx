import HomeSearch from "@/components/home-search";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  // Only fetch universities - search redirects to /subjects page
  const universities = await prisma.university.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, imageUrl: true },
  });

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="mx-auto w-full px-3 md:px-8 lg:px-[150px]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-4 gap-x-3 gap-y-6 md:grid-cols-8 md:gap-x-4 md:gap-y-8 lg:grid-cols-12 lg:gap-x-5">
          {/* Title */}
          <h1 className="col-span-4 text-center text-5xl font-bold md:col-span-8 md:text-6xl lg:col-span-12">
            سرب
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground col-span-4 max-w-lg justify-self-center text-center text-lg md:col-span-8 md:text-xl lg:col-span-12">
            ابحث في المقررات الدراسية من مختلف الجامعات
          </p>

          {/* Search Component */}
          <HomeSearch universities={universities} />

          {/* Helper Text */}
          <p className="text-muted-foreground col-span-4 text-center text-sm md:col-span-8 lg:col-span-12">
            ابدأ بالبحث عن مقررك الدراسي أو تصفح جميع المقررات
          </p>
        </div>
      </div>
    </div>
  );
}
