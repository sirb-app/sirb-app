import { Button } from "@/components/ui/button";
import { BookOpen, FileQuestion, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-background fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* Illustration Area */}
        <div className="relative mb-8">
          {/* Floating documents effect */}
          <div className="border-muted-foreground/20 bg-muted/30 absolute -top-8 -right-16 h-16 w-12 rotate-12 rounded border-2" />
          <div className="border-muted-foreground/20 bg-muted/30 absolute top-0 -left-20 h-20 w-16 -rotate-6 rounded border-2" />
          <div className="border-muted-foreground/20 bg-muted/30 absolute top-12 -right-20 h-12 w-16 rotate-45 rounded border-2" />
          <div className="border-muted-foreground/20 bg-muted/30 absolute top-16 -left-16 h-16 w-12 -rotate-12 rounded border-2" />

          {/* Center icon */}
          <div className="bg-muted/50 relative flex h-40 w-40 items-center justify-center rounded-full">
            <FileQuestion className="text-muted-foreground h-20 w-20" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="mb-4 text-8xl font-bold tracking-tight">404</h1>

        {/* Message */}
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl font-semibold">الصفحة غير موجودة</h2>
          <p className="text-muted-foreground text-lg">
            ربما أخطأت في كتابة العنوان، أو ربما تم نقل الصفحة
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="ml-2 h-4 w-4" />
              العودة للرئيسية
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/subjects">
              <BookOpen className="ml-2 h-4 w-4" />
              تصفح المواد
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
