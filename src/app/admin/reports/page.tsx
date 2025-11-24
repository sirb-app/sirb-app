import {
  getAvailableUniversities,
  getReports,
  getSubjectsByUniversity,
} from "@/actions/admin-report.actions";
import { ReportReason, ReportStatus } from "@/generated/prisma";
import { ReportsManager } from "./_components/reports-manager";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    status?: string;
    reason?: string;
    type?: string;
    university?: string;
    subject?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const status = !params.status
    ? "PENDING"
    : params.status === "all"
      ? undefined
      : (params.status as ReportStatus);

  const reason =
    params.reason && params.reason !== "all"
      ? (params.reason as ReportReason)
      : undefined;
  const type =
    params.type && params.type !== "all"
      ? (params.type as "canvas" | "comment" | "user")
      : undefined;
  const universityId =
    params.university && params.university !== "all"
      ? Number(params.university)
      : undefined;
  const subjectId =
    params.subject && params.subject !== "all"
      ? Number(params.subject)
      : undefined;

  const availableUniversities = await getAvailableUniversities();
  const availableSubjects = universityId
    ? await getSubjectsByUniversity(universityId)
    : [];

  const { reports, total } = await getReports(
    page,
    10,
    status,
    reason,
    type,
    universityId,
    subjectId
  );

  return (
    <ReportsManager
      reports={reports}
      total={total}
      currentPage={page}
      availableUniversities={availableUniversities}
      availableSubjects={availableSubjects}
    />
  );
}
