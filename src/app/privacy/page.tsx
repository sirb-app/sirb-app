import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | سرب",
  description: "سياسة الخصوصية لمنصة سرب",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">سياسة الخصوصية</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-4 text-xl font-semibold">مقدمة</h2>
          <p className="text-muted-foreground leading-relaxed">
            نحن في سرب نقدر خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه
            السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام منصتنا
            التعليمية.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">المعلومات التي نجمعها</h2>
          <p className="text-muted-foreground leading-relaxed">
            نجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء حساب، مثل الاسم
            والبريد الإلكتروني ومعلومات الملف الشخصي. كما نجمع معلومات حول
            استخدامك للمنصة مثل المقررات التي تتابعها وتقدمك الدراسي.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">كيف نستخدم معلوماتك</h2>
          <p className="text-muted-foreground leading-relaxed">
            نستخدم المعلومات المجمعة لتقديم خدماتنا وتحسينها، وتخصيص تجربتك
            التعليمية، والتواصل معك بشأن حسابك والمنصة. لن نشارك معلوماتك
            الشخصية مع أطراف ثالثة دون موافقتك.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">حماية البيانات</h2>
          <p className="text-muted-foreground leading-relaxed">
            نتخذ إجراءات أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو
            التغيير أو الإفشاء. نستخدم تشفير SSL لحماية البيانات المنقولة، ونخزن
            كلمات المرور بشكل مشفر.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">ملفات تعريف الارتباط</h2>
          <p className="text-muted-foreground leading-relaxed">
            نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك على المنصة وتذكر
            تفضيلاتك. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال
            متصفحك.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">حقوقك</h2>
          <p className="text-muted-foreground leading-relaxed">
            يحق لك الوصول إلى بياناتك الشخصية وتصحيحها أو حذفها. يمكنك أيضاً طلب
            نسخة من بياناتك أو الاعتراض على معالجتها في أي وقت.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">التواصل معنا</h2>
          <p className="text-muted-foreground leading-relaxed">
            إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه أو ممارساتنا المتعلقة
            بالخصوصية، يرجى التواصل معنا عبر البريد الإلكتروني.
          </p>
        </section>
      </div>

      <p className="text-muted-foreground mt-12 border-t pt-6 text-sm">
        آخر تحديث: {new Date().toLocaleDateString("ar-SA")}
      </p>
    </div>
  );
}
