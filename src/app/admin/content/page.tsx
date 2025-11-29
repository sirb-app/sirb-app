import {
  listContentAction,
  listUniversitiesForFilterAction,
} from "@/actions/content.actions";
import { ContentManager } from "./_components/content-manager";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    search?: string;
    university?: string;
    page?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const status = params.status?.toUpperCase() ?? "PENDING";

  const contentStatus =
    status === "ALL"
      ? undefined
      : ["PENDING", "APPROVED", "REJECTED"].includes(status)
        ? (status as "PENDING" | "APPROVED" | "REJECTED")
        : "PENDING";

  const universityId = params.university
    ? parseInt(params.university, 10)
    : undefined;

  const contentResult = await listContentAction({
    status: contentStatus,
    contentType: params.type?.toUpperCase(),
    universityId: Number.isNaN(universityId) ? undefined : universityId,
    search: params.search,
    page,
    limit: 20,
  });

  const universitiesResult = await listUniversitiesForFilterAction();

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

  const universities = "error" in universitiesResult ? [] : universitiesResult;

  return (
    <ContentManager
      content={contentResult.content}
      total={contentResult.total}
      currentPage={page}
      universities={universities}
    />
  );
}
