import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "شروط الاستخدام | سرب",
  description: "شروط استخدام منصة سرب",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">شروط الاستخدام</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-4 text-xl font-semibold">قبول الشروط</h2>
          <p className="text-muted-foreground leading-relaxed">
            باستخدامك لمنصة سرب، فإنك توافق على الالتزام بهذه الشروط والأحكام.
            إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">استخدام المنصة</h2>
          <p className="text-muted-foreground leading-relaxed">
            يجب استخدام المنصة لأغراض تعليمية مشروعة فقط. يحظر نشر محتوى مخالف
            أو مسيء أو ينتهك حقوق الآخرين. يجب أن تكون المعلومات التي تقدمها عند
            التسجيل صحيحة ودقيقة.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            المحتوى المقدم من المستخدمين
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            أنت مسؤول عن المحتوى الذي تنشره على المنصة. يجب أن يكون المحتوى
            أصلياً أو لديك الحق في مشاركته. نحتفظ بالحق في إزالة أي محتوى يخالف
            هذه الشروط دون إشعار مسبق.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">حقوق الملكية الفكرية</h2>
          <p className="text-muted-foreground leading-relaxed">
            تحتفظ بملكية المحتوى الذي تنشئه، مع منح سرب ترخيصاً غير حصري لعرضه
            ومشاركته على المنصة. جميع العلامات التجارية والشعارات الخاصة بسرب هي
            ملك لنا.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">سلوك المستخدم</h2>
          <p className="text-muted-foreground leading-relaxed">
            يُتوقع من جميع المستخدمين التعامل باحترام ومهنية. يحظر التنمر أو
            المضايقة أو أي سلوك يضر بتجربة المستخدمين الآخرين. يجب الإبلاغ عن أي
            سلوك مخالف للمشرفين.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">إنهاء الحساب</h2>
          <p className="text-muted-foreground leading-relaxed">
            نحتفظ بالحق في تعليق أو إنهاء حسابك في حالة انتهاك هذه الشروط. يمكنك
            أيضاً إنهاء حسابك في أي وقت من خلال إعدادات الحساب.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">إخلاء المسؤولية</h2>
          <p className="text-muted-foreground leading-relaxed">
            المحتوى التعليمي المقدم على المنصة هو لأغراض إعلامية فقط. لا نضمن
            دقة أو اكتمال المحتوى المقدم من المستخدمين. استخدام المنصة يكون على
            مسؤوليتك الخاصة.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">تعديل الشروط</h2>
          <p className="text-muted-foreground leading-relaxed">
            قد نقوم بتحديث هذه الشروط من وقت لآخر. سيتم إعلامك بأي تغييرات
            جوهرية عبر البريد الإلكتروني أو إشعار على المنصة. استمرارك في
            استخدام المنصة بعد التعديلات يعني موافقتك عليها.
          </p>
        </section>
      </div>

      <p className="text-muted-foreground mt-12 border-t pt-6 text-sm">
        آخر تحديث: {new Date().toLocaleDateString("ar-SA")}
      </p>
    </div>
  );
}
