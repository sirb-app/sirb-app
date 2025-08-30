import { Navigation } from "@/components/navigation";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "سرب - تطبيق تعليمي",
  description: "تطبيق سرب التعليمي - منصة تعليمية متطورة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${ibmPlexSansArabic.variable} bg-background font-sans antialiased`}
      >
        <Navigation />
        <main className="pt-6">{children}</main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
