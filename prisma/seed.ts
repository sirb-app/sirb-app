import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Start seeding...");

  // Create Universities
  const imam = await prisma.university.create({
    data: {
      name: "الإمام محمد بن سعود الإسلامية",
      code: "IMAMU",
    },
  });

  const nourah = await prisma.university.create({
    data: {
      name: "الأميرة نورة بنت عبدالرحمن",
      code: "PNU",
    },
  });

  console.log("✅ Created universities");

  // Create Colleges
  // الإمام: 3 colleges
  const csCollegeImam = await prisma.college.create({
    data: {
      name: "علوم الحاسب والمعلومات",
      universityId: imam.id,
    },
  });

  const shariahCollege = await prisma.college.create({
    data: {
      name: "الشريعة",
      universityId: imam.id,
    },
  });

  const scienceCollegeImam = await prisma.college.create({
    data: {
      name: "العلوم",
      universityId: imam.id,
    },
  });

  // الأميرة: 2 colleges
  const csCollegeNourah = await prisma.college.create({
    data: {
      name: "علوم الحاسب والمعلومات",
      universityId: nourah.id,
    },
  });

  const managementCollege = await prisma.college.create({
    data: {
      name: "الإدارة",
      universityId: nourah.id,
    },
  });

  console.log("✅ Created colleges");

  // Create Subjects for الإمام (20 subjects)
  const imamSubjects = [
    // CS subjects (10 subjects - focus more here)
    {
      name: "مقدمة في البرمجة",
      code: "CS101",
      description:
        "أساسيات البرمجة باستخدام لغة Python، المتغيرات، الحلقات، والدوال",
      collegeId: csCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop",
    },
    {
      name: "هياكل البيانات والخوارزميات",
      code: "CS201",
      description: "دراسة هياكل البيانات الأساسية والمتقدمة وتحليل الخوارزميات",
      collegeId: csCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop",
    },
    {
      name: "قواعد البيانات",
      code: "CS202",
      description: "تصميم وتطوير قواعد البيانات العلائقية باستخدام SQL",
      collegeId: csCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop",
    },
    {
      name: "تطوير تطبيقات الويب",
      code: "CS301",
      description:
        "بناء تطبيقات ويب حديثة باستخدام HTML, CSS, JavaScript و React",
      collegeId: csCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=800&auto=format&fit=crop",
    },
    {
      name: "الذكاء الاصطناعي",
      code: "CS401",
      description: "مفاهيم الذكاء الاصطناعي والتعلم الآلي والشبكات العصبية",
      collegeId: csCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop",
    },
    {
      name: "أمن المعلومات",
      code: "CS303",
      description:
        "مبادئ أمن المعلومات، التشفير، والحماية من الهجمات السيبرانية",
      collegeId: csCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop",
    },
    {
      name: "هندسة البرمجيات",
      code: "CS302",
      description: "منهجيات تطوير البرمجيات، Agile، وإدارة المشاريع البرمجية",
      collegeId: csCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop",
    },
    {
      name: "الحوسبة السحابية",
      code: "CS402",
      description: "مقدمة في الحوسبة السحابية وخدمات AWS و Azure",
      collegeId: csCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop",
    },
    {
      name: "تطوير تطبيقات الجوال",
      code: "CS304",
      description: "بناء تطبيقات iOS و Android باستخدام React Native",
      collegeId: csCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop",
    },
    {
      name: "علم البيانات",
      code: "CS403",
      description: "تحليل البيانات الضخمة باستخدام Python و Pandas",
      collegeId: csCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
    },
    // Shariah subjects (6 subjects)
    {
      name: "أصول الفقه",
      code: "SH101",
      description: "دراسة القواعد الأصولية والأدلة الشرعية",
      collegeId: shariahCollege.id,
    },
    {
      name: "الفقه الإسلامي",
      code: "SH201",
      description: "الأحكام الفقهية في العبادات والمعاملات",
      collegeId: shariahCollege.id,
    },
    {
      name: "التفسير",
      code: "SH102",
      description: "علم التفسير ومناهج المفسرين",
      collegeId: shariahCollege.id,
    },
    {
      name: "الحديث النبوي",
      code: "SH103",
      description: "علوم الحديث ودراسة الأسانيد",
      collegeId: shariahCollege.id,
    },
    {
      name: "العقيدة الإسلامية",
      code: "SH104",
      description: "أصول العقيدة وأركان الإيمان",
      collegeId: shariahCollege.id,
    },
    {
      name: "الفقه المقارن",
      code: "SH301",
      description: "المقارنة بين المذاهب الفقهية المختلفة",
      collegeId: shariahCollege.id,
    },
    // Science subjects (4 subjects)
    {
      name: "الرياضيات المتقدمة",
      code: "SC101",
      description: "التفاضل والتكامل والجبر الخطي",
      collegeId: scienceCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop",
    },
    {
      name: "الفيزياء العامة",
      code: "SC102",
      description: "مبادئ الفيزياء الكلاسيكية والحركة",
      collegeId: scienceCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop",
    },
    {
      name: "الكيمياء التحليلية",
      code: "SC201",
      description: "طرق التحليل الكيميائي والكمي",
      collegeId: scienceCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=800&auto=format&fit=crop",
    },
    {
      name: "الإحصاء التطبيقي",
      code: "SC301",
      description: "تطبيقات الإحصاء في البحث العلمي",
      collegeId: scienceCollegeImam.id,
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
    },
  ];

  await prisma.subject.createMany({
    data: imamSubjects,
  });

  console.log("✅ Created subjects for الإمام (20 subjects)");

  // Create Subjects for الأميرة (20 subjects)
  const nourahSubjects = [
    // CS subjects (12 subjects - focus more here)
    {
      name: "البرمجة بلغة Java",
      code: "CS111",
      description: "أساسيات البرمجة الكائنية باستخدام Java",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop",
    },
    {
      name: "تصميم واجهات المستخدم",
      code: "CS211",
      description: "تصميم تجربة المستخدم UX/UI باستخدام Figma",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop",
    },
    {
      name: "الشبكات الحاسوبية",
      code: "CS212",
      description: "بروتوكولات الشبكات وأساسيات الإنترنت",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop",
    },
    {
      name: "نظم التشغيل",
      code: "CS311",
      description: "مبادئ نظم التشغيل وإدارة الموارد",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop",
    },
    {
      name: "البرمجة الكائنية المتقدمة",
      code: "CS312",
      description: "Design Patterns والبرمجة المتقدمة",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop",
    },
    {
      name: "تعلم الآلة",
      code: "CS411",
      description: "خوارزميات التعلم الآلي والتطبيقات العملية",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop",
    },
    {
      name: "تحليل وتصميم النظم",
      code: "CS313",
      description: "منهجيات تحليل وتصميم الأنظمة المعلوماتية",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop",
    },
    {
      name: "برمجة قواعد البيانات المتقدمة",
      code: "CS412",
      description: "MongoDB، NoSQL، وقواعد البيانات الموزعة",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop",
    },
    {
      name: "الرؤية الحاسوبية",
      code: "CS413",
      description: "معالجة الصور والتعرف على الأنماط",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&auto=format&fit=crop",
    },
    {
      name: "البرمجة التنافسية",
      code: "CS314",
      description: "حل المسائل البرمجية وتطوير مهارات حل المشكلات",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop",
    },
    {
      name: "إنترنت الأشياء",
      code: "CS414",
      description: "أجهزة IoT والتطبيقات الذكية",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&auto=format&fit=crop",
    },
    {
      name: "أخلاقيات الحوسبة",
      code: "CS315",
      description:
        "الأخلاقيات المهنية والمسؤولية الاجتماعية في تقنية المعلومات",
      collegeId: csCollegeNourah.id,
      imageUrl:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop",
    },
    // Management subjects (8 subjects)
    {
      name: "مبادئ الإدارة",
      code: "MG101",
      description: "أساسيات الإدارة والتخطيط والتنظيم",
      collegeId: managementCollege.id,
      imageUrl:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop",
    },
    {
      name: "إدارة الموارد البشرية",
      code: "MG201",
      description: "استراتيجيات إدارة وتطوير الموارد البشرية",
      collegeId: managementCollege.id,
      imageUrl:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&auto=format&fit=crop",
    },
    {
      name: "التسويق الرقمي",
      code: "MG202",
      description: "استراتيجيات التسويق عبر الإنترنت ووسائل التواصل الاجتماعي",
      collegeId: managementCollege.id,
      imageUrl:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    },
    {
      name: "المحاسبة المالية",
      code: "MG203",
      description: "مبادئ المحاسبة وإعداد القوائم المالية",
      collegeId: managementCollege.id,
      imageUrl:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop",
    },
    {
      name: "ريادة الأعمال",
      code: "MG301",
      description: "تأسيس وإدارة المشاريع الريادية",
      collegeId: managementCollege.id,
      imageUrl:
        "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop",
    },
    {
      name: "إدارة المشاريع",
      code: "MG302",
      description: "منهجيات إدارة المشاريع و PMP",
      collegeId: managementCollege.id,
      imageUrl:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
    },
    {
      name: "الإدارة الاستراتيجية",
      code: "MG401",
      description: "التخطيط الاستراتيجي وتحليل البيئة التنافسية",
      collegeId: managementCollege.id,
      imageUrl:
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop",
    },
    {
      name: "سلوك المستهلك",
      code: "MG303",
      description: "دراسة سلوك المستهلك واتخاذ قرارات الشراء",
      collegeId: managementCollege.id,
      imageUrl:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop",
    },
  ];

  await prisma.subject.createMany({
    data: nourahSubjects,
  });

  console.log("✅ Created subjects for الأميرة (20 subjects)");

  console.log("🎉 Seeding finished successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error("❌ Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
