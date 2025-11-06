import {
  listContentAction,
  listSubjectsForFilterAction,
} from "@/actions/content.actions";
import { ContentManager } from "./_components/content-manager";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    subject?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [contentResult, subjectsResult] = await Promise.all([
    listContentAction({
      status: params.status as "PENDING" | "APPROVED" | "REJECTED" | undefined,
      contentType: params.type,
      subjectId: params.subject ? parseInt(params.subject, 10) : undefined,
      search: params.search,
      page,
      limit: 20,
    }),
    listSubjectsForFilterAction(),
  ]);

  if ("error" in contentResult) {
    return (
      <div className="flex min-h-[400px] items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-destructive text-lg font-semibold">
            {contentResult.error}
          </p>
        </div>
      </div>
    );
  }

  if ("error" in subjectsResult) {
    return (
      <div className="flex min-h-[400px] items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-destructive text-lg font-semibold">
            {subjectsResult.error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ContentManager
      content={contentResult.content}
      total={contentResult.total}
      currentPage={page}
      subjects={subjectsResult}
    />
  );
}
