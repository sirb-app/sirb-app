import { listUsersAction } from "@/actions/user.actions";
import { UsersManager } from "./_components/users-manager";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const role = typeof params.role === "string" ? params.role : undefined;
  const banned =
    typeof params.banned === "string" ? params.banned === "true" : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;

  const result = await listUsersAction({
    search,
    role: role as "USER" | "ADMIN" | undefined,
    banned,
    page,
    limit: 20,
  });

  if ("error" in result) {
    return (
      <div className="container py-8">
        <div className="bg-destructive/10 text-destructive rounded-lg border p-4">
          {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <UsersManager
        users={result.users}
        total={result.total}
        currentPage={page}
      />
    </div>
  );
}
