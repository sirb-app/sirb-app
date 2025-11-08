import SearchFilters from "@/components/search-filters";
import SubjectList from "@/components/subject-list";
import SubjectsPagination from "@/components/subjects-pagination";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  search?: string;
  university?: string;
  college?: string;
  page?: string;
}>;

type PageProps = {
  searchParams: SearchParams;
};

const SUBJECTS_PER_PAGE = 20;

async function getSubjects(params: Awaited<SearchParams>) {
  const { search = "", university, college, page = "1" } = params;

  const currentPage = Math.max(1, parseInt(page) || 1);
  const skip = (currentPage - 1) * SUBJECTS_PER_PAGE;

  // Build where clause for filtering
  const where: Prisma.SubjectWhereInput = {
    AND: [
      // Search filter - searches in subject name and code
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      // College filter
      college && college !== "all" ? { collegeId: parseInt(college) } : {},
      // University filter (through college relation)
      university && university !== "all"
        ? { college: { universityId: parseInt(university) } }
        : {},
    ],
  };

  // Fetch subjects with pagination
  const [subjects, totalCount] = await Promise.all([
    prisma.subject.findMany({
      where,
      include: {
        college: {
          include: {
            university: true,
          },
        },
      },
      orderBy: [
        { college: { university: { name: "asc" } } },
        { college: { name: "asc" } },
        { name: "asc" },
      ],
      skip,
      take: SUBJECTS_PER_PAGE,
    }),
    prisma.subject.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / SUBJECTS_PER_PAGE);

  return {
    subjects,
    totalCount,
    totalPages,
    currentPage,
  };
}

async function getFiltersData() {
  const [universities, colleges] = await Promise.all([
    prisma.university.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.college.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, universityId: true },
    }),
  ]);

  return { universities, colleges };
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const [{ subjects, totalPages, currentPage }, { universities, colleges }] =
    await Promise.all([getSubjects(params), getFiltersData()]);

  return (
    <div className="container mx-auto max-w-6xl px-3 py-8 md:px-8 lg:px-16">
      {/* Search and Filters */}
      <section className="mb-8" aria-label="بحث وتصفية المقررات">
        <SearchFilters universities={universities} colleges={colleges} />
      </section>

      {/* Subject List */}
      <section className="mb-12" aria-label="قائمة المقررات الدراسية">
        <SubjectList subjects={subjects} />
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8" aria-label="تنقل بين الصفحات">
          <SubjectsPagination
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </nav>
      )}
    </div>
  );
}
