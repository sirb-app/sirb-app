import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Start seeding...");

  // Create Universities
  const imam = await prisma.university.create({
    data: {
      name: "الإمام محمد بن سعود الإسلامية",
      code: "IMAMU",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/LogoI_of_Imam_Mohammad_Ibn_Saud_Islamic_University.png/960px-LogoI_of_Imam_Mohammad_Ibn_Saud_Islamic_University.png",
    },
  });

  const nourah = await prisma.university.create({
    data: {
      name: "الأميرة نورة بنت عبدالرحمن",
      code: "PNU",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/8/80/PNU_logo.png",
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

  // Create a dummy user for canvas contributors
  const dummyUser = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000000",
      name: "مساهم النظام",
      email: "system@contributor.com",
      emailVerified: true,
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Created dummy contributor user");

  // Get only the first subject to create chapters
  const firstSubject = await prisma.subject.findFirst({
    include: { college: true },
  });

  if (!firstSubject) {
    console.log("❌ No subjects found to create chapters for");
    return;
  }

  console.log(`📚 Creating chapters and canvases for: ${firstSubject.name}...`);

  // Create chapters for the first subject only
  const subject = firstSubject;
  const chapterCount = Math.floor(Math.random() * 4) + 3; // 3-6 chapters per subject

  for (let i = 1; i <= chapterCount; i++) {
    const chapter = await prisma.chapter.create({
      data: {
        title: `الفصل ${i}: ${getChapterTitle(subject.name, i)}`,
        description: getChapterDescription(subject.name, i),
        sequence: i,
        subjectId: subject.id,
      },
    });

    // Create 2-3 canvases per chapter with mixed content
    const canvasCount = Math.floor(Math.random() * 2) + 2; // 2-3 canvases

    for (let j = 1; j <= canvasCount; j++) {
      const canvas = await prisma.canvas.create({
        data: {
          title: `المحتوى ${j}: ${getCanvasTitle(subject.name, i, j)}`,
          description: getCanvasDescription(subject.name, i, j),
          imageUrl: getCanvasImage(j), // Random canvas thumbnail
          sequence: j,
          status: "APPROVED", // All canvases are approved for now
          chapterId: chapter.id,
          contributorId: dummyUser.id, // Use the dummy user's ID
        },
      });

      // Create mixed content for each canvas (text, video, file)
      let contentSequence = 1;

      // Add 1-2 text blocks
      const textCount = Math.floor(Math.random() * 2) + 1;
      for (let k = 0; k < textCount; k++) {
        const textContent = await prisma.textContent.create({
          data: {
            content: getTextContent(subject.name, i, k + 1),
          },
        });

        await prisma.contentBlock.create({
          data: {
            canvasId: canvas.id,
            sequence: contentSequence++,
            contentType: "TEXT",
            contentId: textContent.id,
          },
        });
      }

      // Add 1 video
      const video = await prisma.video.create({
        data: {
          title: `شرح: ${getCanvasTitle(subject.name, i, j)}`,
          description: `فيديو توضيحي لـ ${getCanvasTitle(subject.name, i, j).toLowerCase()}`,
          url: "https://youtu.be/Q94_BoOr2xs?si=3_i7x0uqXIeZ4f-2",
          youtubeVideoId: "Q94_BoOr2xs",
          duration: 600, // 10 minutes placeholder
        },
      });

      await prisma.contentBlock.create({
        data: {
          canvasId: canvas.id,
          sequence: contentSequence++,
          contentType: "VIDEO",
          contentId: video.id,
        },
      });

      // Add 0-1 file (50% chance)
      if (Math.random() > 0.5) {
        const file = await prisma.file.create({
          data: {
            title: `ملف: ${getCanvasTitle(subject.name, i, j)}`,
            description: "ملف PDF يحتوي على ملخص الدرس",
            url: "https://example.com/sample.pdf", // Placeholder
            fileSize: BigInt(1024 * 500), // 500KB placeholder
            mimeType: "application/pdf",
          },
        });

        await prisma.contentBlock.create({
          data: {
            canvasId: canvas.id,
            sequence: contentSequence++,
            contentType: "FILE",
            contentId: file.id,
          },
        });
      }

      // Add another text block at the end (50% chance)
      if (Math.random() > 0.5) {
        const textContent = await prisma.textContent.create({
          data: {
            content: getTextContent(subject.name, i, 3),
          },
        });

        await prisma.contentBlock.create({
          data: {
            canvasId: canvas.id,
            sequence: contentSequence++,
            contentType: "TEXT",
            contentId: textContent.id,
          },
        });
      }
    }
  }

  console.log(`✅ Created chapters and canvases for: ${subject.name}`);

  console.log("🎉 Seeding finished successfully!");
}

// Helper functions to generate chapter and canvas titles/descriptions
function getChapterTitle(subjectName: string, chapterNum: number): string {
  const chapterTitles: Record<string, string[]> = {
    "مقدمة في البرمجة": [
      "مقدمة في البرمجة",
      "المتغيرات وأنواع البيانات",
      "الحلقات والشروط",
      "الدوال والمصفوفات",
      "مشروع تطبيقي",
    ],
    "هياكل البيانات والخوارزميات": [
      "مقدمة في هياكل البيانات",
      "المصفوفات والقوائم",
      "الأشجار والرسوم البيانية",
      "خوارزميات البحث والترتيب",
      "تحليل التعقيد",
    ],
    "قواعد البيانات": [
      "مقدمة في قواعد البيانات",
      "تصميم قاعدة البيانات",
      "لغة SQL الأساسية",
      "الاستعلامات المتقدمة",
      "مشروع قاعدة بيانات",
    ],
    "تطوير تطبيقات الويب": [
      "مقدمة في تطوير الويب",
      "HTML و CSS",
      "JavaScript الأساسي",
      "React و المكونات",
      "مشروع تطبيق ويب",
    ],
    "الذكاء الاصطناعي": [
      "مقدمة في الذكاء الاصطناعي",
      "التعلم الآلي",
      "الشبكات العصبية",
      "معالجة اللغة الطبيعية",
      "مشروع تطبيقي",
    ],
  };

  const titles = chapterTitles[subjectName] || [
    "المفاهيم الأساسية",
    "التطبيقات العملية",
    "المواضيع المتقدمة",
    "المشاريع والتطبيقات",
    "المراجعة والتقييم",
  ];

  return titles[chapterNum - 1] || `الموضوع ${chapterNum}`;
}

function getChapterDescription(
  subjectName: string,
  chapterNum: number
): string {
  return `في هذا الفصل سنتعلم ${getChapterTitle(subjectName, chapterNum).toLowerCase()} بشكل مفصل مع أمثلة عملية وتطبيقات.`;
}

function getCanvasTitle(
  subjectName: string,
  chapterNum: number,
  canvasNum: number
): string {
  const canvasTitles = [
    "المقدمة والنظرة العامة",
    "المفاهيم الأساسية",
    "الأمثلة العملية",
    "التمارين والتطبيقات",
    "المراجعة والخلاصة",
  ];

  return canvasTitles[canvasNum - 1] || `المحتوى ${canvasNum}`;
}

function getCanvasDescription(
  subjectName: string,
  chapterNum: number,
  canvasNum: number
): string {
  return `محتوى تفاعلي يتضمن شرح مفصل وأمثلة عملية لـ ${getCanvasTitle(subjectName, chapterNum, canvasNum).toLowerCase()}.`;
}

function getCanvasImage(canvasNum: number): string {
  // Rotate through different educational images for variety
  const images = [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop", // Students learning
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop", // Classroom
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop", // Teamwork
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop", // Online learning
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop", // Books
  ];
  return images[(canvasNum - 1) % images.length];
}

function getTextContent(
  subjectName: string,
  chapterNum: number,
  textNum: number
): string {
  const contents = [
    "في هذا القسم سنتعلم المفاهيم الأساسية بشكل مفصل. من المهم فهم هذه المبادئ جيداً قبل الانتقال للأمثلة العملية. سنغطي النقاط الرئيسية ونشرح كل منها بالتفصيل مع أمثلة توضيحية.",
    "تطبيقات عملية: سنستخدم ما تعلمناه في أمثلة واقعية لتعزيز الفهم وتطوير المهارات العملية. هذه الأمثلة مستوحاة من حالات حقيقية في سوق العمل وستساعدك على فهم كيفية تطبيق المفاهيم النظرية في الواقع.",
    "ملاحظات هامة: تذكر دائماً أن الممارسة المستمرة هي مفتاح الإتقان. حاول تطبيق ما تعلمته في مشاريعك الخاصة، ولا تتردد في طرح الأسئلة في قسم التعليقات. التعلم عملية مستمرة تحتاج إلى الصبر والمثابرة.",
  ];
  return (
    contents[textNum - 1] ||
    "محتوى تعليمي إضافي يساعد على فهم الموضوع بشكل أفضل ويوفر سياقاً إضافياً للمحتوى المقدم."
  );
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
