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

const VALID_STATUSES = Object.values(ReportStatus);
const VALID_REASONS = Object.values(ReportReason);
const VALID_TYPES = ["canvas", "comment", "user"] as const;

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  const rawPage = Number(params.page);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const status = !params.status
    ? "PENDING"
    : params.status === "all"
      ? undefined
      : VALID_STATUSES.includes(params.status as ReportStatus)
        ? (params.status as ReportStatus)
        : "PENDING";

  const reason =
    params.reason &&
    params.reason !== "all" &&
    VALID_REASONS.includes(params.reason as ReportReason)
      ? (params.reason as ReportReason)
      : undefined;

  const type =
    params.type &&
    params.type !== "all" &&
    VALID_TYPES.includes(params.type as (typeof VALID_TYPES)[number])
      ? (params.type as (typeof VALID_TYPES)[number])
      : undefined;

  const rawUniversityId = Number(params.university);
  const universityId =
    params.university &&
    params.university !== "all" &&
    Number.isInteger(rawUniversityId) &&
    rawUniversityId > 0
      ? rawUniversityId
      : undefined;

  const rawSubjectId = Number(params.subject);
  const subjectId =
    params.subject &&
    params.subject !== "all" &&
    Number.isInteger(rawSubjectId) &&
    rawSubjectId > 0
      ? rawSubjectId
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
