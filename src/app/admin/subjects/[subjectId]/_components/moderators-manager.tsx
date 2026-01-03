"use client";

import {
  assignModeratorAction,
  removeModeratorAction,
  searchUsersAction,
} from "@/actions/moderator.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserSearch } from "@/components/user-search";
import type { Prisma } from "@/generated/prisma";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type ModeratorWithUser = Prisma.SubjectModeratorGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true; image: true } };
  };
}>;

interface ModeratorsManagerProps {
  subjectId: number;
  moderators: ModeratorWithUser[];
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role?: string;
}

export function ModeratorsManager({
  subjectId,
  moderators,
}: ModeratorsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [targetModerator, setTargetModerator] =
    useState<ModeratorWithUser | null>(null);

  const assignedUserIds = useMemo(
    () => new Set(moderators.map(m => m.userId)),
    [moderators]
  );

  const handleAssign = () => {
    if (!selectedUser) return;
    startTransition(async () => {
      const res = await assignModeratorAction(subjectId, selectedUser.id);
      if (res.error === null) {
        toast.success("تم تعيين المشرف");
        setAssignOpen(false);
        setSelectedUser(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleRemove = () => {
    if (!targetModerator) return;
    startTransition(async () => {
      const res = await removeModeratorAction(targetModerator.id, subjectId);
      if (res.error === null) {
        toast.success("تمت إزالة المشرف");
        setRemoveOpen(false);
        setTargetModerator(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <section className="space-y-4" dir="rtl" id="moderators">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">المشرفون</h2>
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap" aria-label="تعيين مشرف جديد">
              <UserPlus className="ml-2 h-4 w-4" />
              تعيين مشرف
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعيين مشرف جديد</DialogTitle>
            </DialogHeader>
            <UserSearch
              onUserSelect={setSelectedUser}
              selectedUser={selectedUser}
              excludeUserIds={assignedUserIds}
              searchAction={searchUsersAction}
              disabled={isPending}
            />
            <DialogFooter className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignOpen(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={handleAssign}
                disabled={isPending || !selectedUser}
              >
                {isPending ? "جاري التعيين..." : "تعيين"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {moderators.length === 0 ? (
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-8 text-center">
          <UserPlus className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <h3 className="mb-1 font-semibold">لا يوجد مشرفون</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            قم بتعيين مشرفين لإدارة المحتوى المقدم لهذه المادة
          </p>
          <Button
            onClick={() => setAssignOpen(true)}
            variant="outline"
            size="sm"
          >
            <UserPlus className="ml-2 h-4 w-4" />
            تعيين أول مشرف
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moderators.map(moderator => (
            <li
              key={moderator.id}
              className="bg-card rounded-lg border p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={moderator.user.image ?? undefined} />
                  <AvatarFallback className="text-xs uppercase">
                    {moderator.user.name?.slice(0, 2) ?? "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">
                    {moderator.user.name}
                  </h3>
                  <p className="text-muted-foreground truncate text-sm">
                    {moderator.user.email}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    تم التعيين:{" "}
                    {new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
                      dateStyle: "medium",
                    }).format(new Date(moderator.createdAt))}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetModerator(moderator);
                  setRemoveOpen(true);
                }}
                disabled={isPending}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground mt-3 w-full"
              >
                إزالة
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        open={removeOpen}
        onOpenChange={open => {
          setRemoveOpen(open);
          if (!open) setTargetModerator(null);
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إزالة المشرف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إزالة &quot;{targetModerator?.user.name}&quot; من
              قائمة المشرفين؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                handleRemove();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "جاري الإزالة..." : "إزالة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
