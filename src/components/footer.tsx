"use client";

import { Logo } from "@/components/logo";
import { teamMembers } from "@/lib/team-data";
import { Github, Twitter } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiLinkedin } from "react-icons/si";

const footerLinks = {
  platform: {
    title: "المنصة",
    links: [
      { label: "المقررات", href: "/subjects" },
      { label: "الفريق", href: "/team" },
    ],
  },
  account: {
    title: "الحساب",
    links: [
      { label: "تسجيل الدخول", href: "/auth/login" },
      { label: "إنشاء حساب", href: "/auth/register" },
    ],
  },
  legal: {
    title: "قانوني",
    links: [
      { label: "سياسة الخصوصية", href: "/privacy" },
      { label: "شروط الاستخدام", href: "/terms" },
    ],
  },
};

const socialLinks = [
  {
    label: "Twitter",
    href: "https://twitter.com/sirbapp",
    icon: Twitter,
  },
  {
    label: "GitHub",
    href: "https://github.com/sirb-app",
    icon: Github,
  },
];

export function Footer() {
  const pathname = usePathname();

  // Hide footer on certain pages
  const isCanvasPage = pathname?.includes("/canvases/");
  const isAuthPage = pathname?.startsWith("/auth/");

  if (isCanvasPage || isAuthPage) {
    return null;
  }

  return (
    <footer className="bg-muted/30 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 lg:px-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo size="md" asLink />
            <p className="text-muted-foreground mt-3 max-w-xs text-sm">
              منصة تعليمية تجمع طلاب الجامعات لمشاركة المعرفة والتعلم من بعضهم
              البعض
            </p>

            {/* Social Links */}
            <div className="mt-4 flex gap-3">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Team */}
          <div>
            <h3 className="text-sm font-semibold">الفريق</h3>
            <ul className="mt-3 space-y-2">
              {teamMembers.map(member => (
                <li key={member.name}>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
                  >
                    <SiLinkedin className="h-3.5 w-3.5" />
                    {member.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} سرب. جميع الحقوق محفوظة.
          </p>
          <p className="text-muted-foreground text-sm">صنع بـ ❤️ للطلاب</p>
        </div>
      </div>
    </footer>
  );
}
