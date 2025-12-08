import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  GraduationCap,
  HelpCircle,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

type FAQ = {
  icon: LucideIcon;
  question: string;
  answer: string;
};

const faqs: FAQ[] = [
  {
    icon: HelpCircle,
    question: "ما هو سرب؟",
    answer:
      "سرب منصة تعليمية تجمع طلاب الجامعات لمشاركة المعرفة. الطلاب المتقدمون يساهمون بمحتوى تعليمي متنوع يساعد زملاءهم الجدد في فهم المقررات الدراسية بشكل أفضل.",
  },
  {
    icon: Users,
    question: "من يمكنه المساهمة بالمحتوى؟",
    answer:
      "أي طالب جامعي يمكنه المساهمة بعد التسجيل. المحتوى يمر بمراجعة من مشرفين متخصصين في كل مادة لضمان جودته وصحته قبل النشر.",
  },
  {
    icon: BookOpen,
    question: "ما أنواع المحتوى المتاحة؟",
    answer:
      "نوفر فيديوهات تعليمية، ملفات PDF وملخصات، ملاحظات نصية، واختبارات تفاعلية. كل نوع مصمم ليناسب أساليب التعلم المختلفة.",
  },
  {
    icon: GraduationCap,
    question: "هل المنصة مجانية؟",
    answer:
      "نعم، سرب مجاني بالكامل للطلاب. هدفنا تسهيل الوصول للمعرفة وتشجيع التعاون بين الطلاب.",
  },
  {
    icon: Sparkles,
    question: "ما هو المعلم الذكي؟",
    answer:
      "المعلم الذكي نظام تعلم تكيفي يتابع مستواك في كل موضوع ويولد محتوى مخصص لك: ملاحظات مركزة، بطاقات تعليمية للمراجعة، واختبارات تقيس فهمك وتحدد نقاط الضعف.",
  },
  {
    icon: Shield,
    question: "كيف تضمنون جودة المحتوى؟",
    answer:
      "كل محتوى يمر بمراجعة من مشرفين أكاديميين قبل النشر. أيضاً نظام التقييم والتصويت يساعد في إبراز المحتوى الأفضل.",
  },
];

export function FAQSection() {
  return (
    <section aria-labelledby="faq-heading" className="relative py-16 md:py-24">
      {/* Background pattern - lighter opacity for FAQ */}
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative mx-auto max-w-3xl px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          {/* Decorative star icon */}
          <div className="mx-auto mb-6">
            <svg
              className="text-foreground mx-auto h-8 w-8"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
          <h2
            id="faq-heading"
            className="text-2xl font-bold md:text-3xl lg:text-4xl"
          >
            الأسئلة الشائعة
          </h2>
          <p className="text-muted-foreground mt-3 text-base">
            إجابات على أكثر الأسئلة شيوعاً حول سرب
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-none py-1"
            >
              <AccordionTrigger className="py-4 text-right hover:no-underline">
                <div className="flex items-center gap-4">
                  <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
                    <faq.icon className="text-muted-foreground h-5 w-5" />
                  </div>
                  <span className="text-base font-semibold">
                    {faq.question}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pr-14 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
