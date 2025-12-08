import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

type Testimonial = {
  quote: string;
  name: string;
  university: string;
  initials: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "سرب غير طريقة مذاكرتي بشكل كامل. المحتوى المتنوع والشروحات من طلاب سابقين ساعدتني كثيراً في فهم المواد الصعبة.",
    name: "أحمد العتيبي",
    university: "جامعة الإمام",
    initials: "أع",
  },
  {
    quote:
      "أفضل ما في سرب هو التنوع - فيديوهات، ملخصات، واختبارات. كل شي تحتاجه في مكان واحد.",
    name: "سارة الشمري",
    university: "جامعة الملك سعود",
    initials: "سش",
  },
  {
    quote:
      "ساهمت بمحتوى في مادة البرمجة وشفت كيف ساعد طلاب كثير. شعور رائع إنك تفيد غيرك.",
    name: "محمد القحطاني",
    university: "جامعة الإمام",
    initials: "مق",
  },
];

export function TestimonialsSection() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="bg-muted/30 py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8 lg:px-16">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16">
          <h2
            id="testimonials-heading"
            className="text-3xl font-bold md:text-4xl lg:text-5xl"
          >
            ماذا يقول طلابنا؟
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
            تجارب حقيقية من طلاب استفادوا من سرب
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {testimonials.map(testimonial => (
            <Card
              key={testimonial.name}
              className="relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <CardContent className="pt-6">
                {/* Quote Icon */}
                <Quote className="text-primary/20 absolute top-4 left-4 h-10 w-10" />

                {/* Quote Text */}
                <blockquote className="text-foreground/90 relative mb-6 text-lg leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {testimonial.university}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
