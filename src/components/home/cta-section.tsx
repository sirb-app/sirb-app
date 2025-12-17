import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section aria-labelledby="cta-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
        <h2
          id="cta-heading"
          className="text-2xl font-bold md:text-3xl lg:text-4xl"
        >
          ابدأ رحلتك التعليمية
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base md:text-lg">
          انضم لمجتمع الطلاب الذين يتعلمون ويشاركون المعرفة
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/subjects">
              تصفح المقررات
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/register">إنشاء حساب</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
