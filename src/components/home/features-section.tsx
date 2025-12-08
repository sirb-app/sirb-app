import {
  BookOpen,
  Brain,
  FileText,
  Layers,
  MessageSquare,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

export function FeaturesSection() {
  return (
    <section aria-labelledby="features-heading" className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-8 lg:px-16">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 id="features-heading" className="text-2xl font-bold md:text-3xl">
            لماذا سرب؟
          </h2>
          <p className="text-muted-foreground mt-3 text-base">
            كل ما تحتاجه لرحلتك الأكاديمية في مكان واحد
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-4 md:grid-cols-6 md:grid-rows-3">
          {/* Large Card - AI Tutor */}
          <div className="group relative overflow-hidden rounded-2xl bg-violet-100 p-6 md:col-span-4 md:row-span-2 dark:bg-violet-950/40">
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-200 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                <Sparkles className="h-4 w-4" />
                معلم ذكي
              </div>
              <h3 className="text-2xl font-bold text-violet-900 md:text-3xl dark:text-violet-100">
                تعلم تكيفي مخصص لك
              </h3>
              <p className="mt-3 max-w-md text-violet-700 dark:text-violet-300">
                يتابع مستواك في كل موضوع ويولد ملاحظات وبطاقات تعليمية واختبارات
                مخصصة بناءً على تقدمك
              </p>

              {/* Visual Elements */}
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/60 px-3 py-1.5 text-sm text-violet-800 dark:bg-white/10 dark:text-violet-200">
                  <FileText className="h-4 w-4" /> ملاحظات
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/60 px-3 py-1.5 text-sm text-violet-800 dark:bg-white/10 dark:text-violet-200">
                  <BookOpen className="h-4 w-4" /> بطاقات
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/60 px-3 py-1.5 text-sm text-violet-800 dark:bg-white/10 dark:text-violet-200">
                  <Brain className="h-4 w-4" /> اختبارات
                </span>
              </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-800/30" />
          </div>

          {/* Medium Card - Peer Learning */}
          <div className="group relative overflow-hidden rounded-2xl bg-cyan-100 p-5 md:col-span-2 md:row-span-1 dark:bg-cyan-950/40">
            <div className="flex h-full flex-col">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-200 dark:bg-cyan-900/50">
                <Users className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
              </div>
              <h3 className="font-semibold text-cyan-900 dark:text-cyan-100">
                التعلم من الأقران
              </h3>
              <p className="mt-1 text-sm text-cyan-700 dark:text-cyan-300">
                طلاب متقدمون يشاركون معرفتهم
              </p>
            </div>
          </div>

          {/* Medium Card - Content Types */}
          <div className="group relative overflow-hidden rounded-2xl bg-amber-100 p-5 md:col-span-2 md:row-span-1 dark:bg-amber-950/40">
            <div className="flex h-full flex-col">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200 dark:bg-amber-900/50">
                <Layers className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              </div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                محتوى متنوع
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                فيديوهات، ملفات، ملخصات، واختبارات
              </p>
            </div>
          </div>

          {/* Small Cards Row */}
          <div className="grid gap-4 md:col-span-6 md:grid-cols-3">
            {/* Video Content */}
            <div className="flex items-center gap-4 rounded-2xl bg-rose-100 p-4 dark:bg-rose-950/40">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-200 dark:bg-rose-900/50">
                <Video className="h-6 w-6 text-rose-700 dark:text-rose-300" />
              </div>
              <div>
                <h4 className="font-semibold text-rose-900 dark:text-rose-100">
                  شروحات مرئية
                </h4>
                <p className="text-sm text-rose-700 dark:text-rose-300">
                  فيديوهات تعليمية
                </p>
              </div>
            </div>

            {/* Discussions */}
            <div className="flex items-center gap-4 rounded-2xl bg-emerald-100 p-4 dark:bg-emerald-950/40">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-200 dark:bg-emerald-900/50">
                <MessageSquare className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                  نقاشات
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  تواصل مع زملائك
                </p>
              </div>
            </div>

            {/* Quizzes */}
            <div className="flex items-center gap-4 rounded-2xl bg-sky-100 p-4 dark:bg-sky-950/40">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-200 dark:bg-sky-900/50">
                <Brain className="h-6 w-6 text-sky-700 dark:text-sky-300" />
              </div>
              <div>
                <h4 className="font-semibold text-sky-900 dark:text-sky-100">
                  اختبارات
                </h4>
                <p className="text-sm text-sky-700 dark:text-sky-300">
                  اختبر فهمك
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
