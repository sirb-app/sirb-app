"use client";

import { deleteUserAction } from "@/actions/delete-user.action";
import {
  banUserAction,
  getUserDetailsAction,
  unbanUserAction,
  updateUserRoleAction,
} from "@/actions/user.actions";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Prisma } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type UserWithCounts = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        contributedCanvases: true;
        enrollments: true;
        moderatedSubjects: true;
      };
    };
  };
}>;

type UserDetails = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        contributedCanvases: true;
        enrollments: true;
        moderatedSubjects: true;
        comments: true;
        canvasVotes: true;
        reportsSubmitted: true;
      };
    };
    enrollments: {
      select: {
        id: true;
        enrolledAt: true;
        subject: {
          select: {
            id: true;
            name: true;
            code: true;
            college: {
              select: {
                name: true;
                university: {
                  select: {
                    name: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    contributedCanvases: {
      select: {
        id: true;
        title: true;
        contentBlocks: {
          select: {
            contentType: true;
          };
        };
        status: true;
        createdAt: true;
        chapter: {
          select: {
            title: true;
            subject: {
              select: {
                name: true;
                code: true;
              };
            };
          };
        };
      };
    };
    moderatedSubjects: {
      select: {
        id: true;
        createdAt: true;
        subject: {
          select: {
            id: true;
            name: true;
            code: true;
            college: {
              select: {
                name: true;
                university: {
                  select: {
                    name: true;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

interface UsersManagerProps {
  users: UserWithCounts[];
  total: number;
  currentPage: number;
}

type ActionType = "ban" | "unban" | "delete" | "role" | "details";

export function UsersManager({ users, total, currentPage }: UsersManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [roleFilter, setRoleFilter] = useState(
    searchParams.get("role") || "all"
  );
  const [bannedFilter, setBannedFilter] = useState(
    searchParams.get("banned") || "all"
  );

  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [targetUser, setTargetUser] = useState<UserWithCounts | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [banReason, setBanReason] = useState("");
  const [newRole, setNewRole] = useState<"USER" | "ADMIN">("USER");

  const totalPages = Math.ceil(total / 20);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (bannedFilter !== "all") params.set("banned", bannedFilter);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setBannedFilter("all");
    router.push("/admin/users");
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const openAction = (type: ActionType, user: UserWithCounts) => {
    setActionType(type);
    setTargetUser(user);
    if (type === "role") {
      setNewRole(user.role === "ADMIN" ? "USER" : "ADMIN");
    } else if (type === "details") {
      startTransition(async () => {
        const res = await getUserDetailsAction(user.id);
        if ("user" in res) {
          setUserDetails(res.user);
        } else {
          toast.error(res.error);
          setActionType(null);
          setTargetUser(null);
        }
      });
    }
  };

  const closeAction = () => {
    setActionType(null);
    setTargetUser(null);
    setUserDetails(null);
    setBanReason("");
  };

  const handleBan = () => {
    if (!targetUser || !banReason.trim()) return;
    startTransition(async () => {
      const res = await banUserAction(targetUser.id, banReason.trim());
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("تم حظر المستخدم");
        closeAction();
        router.refresh();
      }
    });
  };

  const handleUnban = () => {
    if (!targetUser) return;
    startTransition(async () => {
      const res = await unbanUserAction(targetUser.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("تم إلغاء حظر المستخدم");
        closeAction();
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!targetUser) return;
    startTransition(async () => {
      const res = await deleteUserAction({ userId: targetUser.id });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("تم حذف المستخدم");
        closeAction();
        router.refresh();
      }
    });
  };

  const handleRoleChange = () => {
    if (!targetUser) return;
    startTransition(async () => {
      const res = await updateUserRoleAction(targetUser.id, newRole);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("تم تحديث الصلاحيات");
        closeAction();
        router.refresh();
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
      dateStyle: "medium",
    }).format(new Date(date));
  };

  const hasActiveFilters =
    searchQuery || roleFilter !== "all" || bannedFilter !== "all";

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-1">
            {total.toLocaleString("ar-SA-u-nu-latn")} مستخدم
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="search">البحث</Label>
            <div className="relative mt-1.5">
              <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                className="pr-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-40">
            <Label htmlFor="role-filter">الصلاحية</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger id="role-filter" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="USER">مستخدم</SelectItem>
                <SelectItem value="ADMIN">مسؤول</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <Label htmlFor="banned-filter">الحالة</Label>
            <Select value={bannedFilter} onValueChange={setBannedFilter}>
              <SelectTrigger id="banned-filter" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="false">نشط</SelectItem>
                <SelectItem value="true">محظور</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button onClick={handleSearch} size="sm">
            <Search className="ml-2 h-4 w-4" />
            بحث
          </Button>
          {hasActiveFilters && (
            <Button onClick={handleClearFilters} variant="outline" size="sm">
              <X className="ml-2 h-4 w-4" />
              مسح الفلاتر
            </Button>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-12 text-center">
          <User className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="mb-2 text-lg font-semibold">لا يوجد مستخدمون</h3>
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? "لم يتم العثور على نتائج. جرب تغيير الفلاتر."
              : "لا يوجد مستخدمون في النظام."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">الصلاحية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">النشاط</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => openAction("details", user)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback className="text-xs uppercase">
                            {(user.name || "??").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.name}</p>
                          <p className="text-muted-foreground truncate text-sm">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "ADMIN" ? "default" : "secondary"
                        }
                        className="gap-1"
                      >
                        {user.role === "ADMIN" ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <Shield className="h-3 w-3" />
                        )}
                        {user.role === "ADMIN" ? "مسؤول" : "مستخدم"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.banned ? (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            محظور
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            نشط
                          </Badge>
                        )}
                        {!user.emailVerified && (
                          <Badge variant="secondary" className="gap-1">
                            غير موثق
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-muted-foreground space-y-0.5 text-xs">
                        <div>{user._count.contributedCanvases} مساهمات</div>
                        <div>{user._count.enrollments} تسجيلات</div>
                        {user._count.moderatedSubjects > 0 && (
                          <div>مشرف على {user._count.moderatedSubjects}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            openAction("role", user);
                          }}
                          disabled={isPending || !!user.banned}
                          title={
                            user.banned
                              ? "لا يمكن تغيير صلاحيات مستخدم محظور"
                              : "تغيير الصلاحية"
                          }
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        {user.banned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              openAction("unban", user);
                            }}
                            disabled={isPending}
                            title="إلغاء الحظر"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              openAction("ban", user);
                            }}
                            disabled={isPending || user.role === "ADMIN"}
                            title="حظر المستخدم"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            openAction("delete", user);
                          }}
                          disabled={isPending || user.role === "ADMIN"}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          title="حذف المستخدم"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                صفحة {currentPage.toLocaleString("ar-SA-u-nu-latn")} من{" "}
                {totalPages.toLocaleString("ar-SA-u-nu-latn")}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={actionType === "ban"}
        onOpenChange={open => !open && closeAction()}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حظر المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              هل أنت متأكد من حظر &quot;{targetUser?.name}&quot;؟ لن يتمكن من
              تسجيل الدخول أو استخدام المنصة.
            </p>
            <div className="space-y-2">
              <Label htmlFor="ban-reason">سبب الحظر</Label>
              <textarea
                id="ban-reason"
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                disabled={isPending}
                rows={3}
                placeholder="اذكر سبب الحظر..."
                required
                className={cn(
                  "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
                  "border-input min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs",
                  "focus-visible:border-ring focus-visible:ring-ring/50 transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
                  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeAction}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBan}
              disabled={isPending || !banReason.trim()}
            >
              {isPending ? "جارٍ الحظر..." : "حظر"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={actionType === "unban"}
        onOpenChange={open => !open && closeAction()}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء حظر المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء حظر &quot;{targetUser?.name}&quot;؟ سيتمكن
              من تسجيل الدخول واستخدام المنصة مرة أخرى.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                handleUnban();
              }}
              disabled={isPending}
            >
              {isPending ? "جارٍ الإلغاء..." : "إلغاء الحظر"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={actionType === "delete"}
        onOpenChange={open => !open && closeAction()}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{targetUser?.name}&quot;؟ سيتم حذف جميع
              بياناته ومساهماته بشكل نهائي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={actionType === "role"}
        onOpenChange={open => !open && closeAction()}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير صلاحيات المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              تغيير صلاحيات &quot;{targetUser?.name}&quot; من{" "}
              <strong>
                {targetUser?.role === "ADMIN" ? "مسؤول" : "مستخدم"}
              </strong>{" "}
              إلى <strong>{newRole === "ADMIN" ? "مسؤول" : "مستخدم"}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-role">الصلاحية الجديدة</Label>
              <Select
                value={newRole}
                onValueChange={val => setNewRole(val as "USER" | "ADMIN")}
              >
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">مستخدم</SelectItem>
                  <SelectItem value="ADMIN">مسؤول</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeAction}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleRoleChange}
              disabled={isPending}
            >
              {isPending ? "جارٍ التحديث..." : "تحديث"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={actionType === "details"}
        onOpenChange={open => !open && closeAction()}
      >
        <SheetContent
          side="left"
          className="w-full overflow-y-auto p-6 sm:max-w-2xl"
          dir="rtl"
        >
          <SheetHeader className="mb-6">
            <SheetTitle>تفاصيل المستخدم</SheetTitle>
            <SheetDescription>
              معلومات مفصلة حول نشاط وبيانات المستخدم
            </SheetDescription>
          </SheetHeader>

          {userDetails && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userDetails.image ?? undefined} />
                  <AvatarFallback className="text-lg">
                    {userDetails.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{userDetails.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {userDetails.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      variant={
                        userDetails.role === "ADMIN" ? "default" : "secondary"
                      }
                    >
                      {userDetails.role === "ADMIN" ? "مسؤول" : "مستخدم"}
                    </Badge>
                    {userDetails.banned && (
                      <Badge variant="destructive">محظور</Badge>
                    )}
                    {!userDetails.emailVerified && (
                      <Badge variant="secondary">غير موثق</Badge>
                    )}
                  </div>
                </div>
              </div>

              {userDetails.banned && userDetails.banReason && (
                <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-4">
                  <h4 className="text-destructive mb-2 font-semibold">
                    سبب الحظر
                  </h4>
                  <p className="text-destructive/90 text-sm">
                    {userDetails.banReason}
                  </p>
                  {userDetails.banExpires && (
                    <p className="text-destructive/70 mt-2 text-xs">
                      ينتهي الحظر: {formatDate(userDetails.banExpires)}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-muted-foreground mb-1 text-xs">
                    المساهمات
                  </div>
                  <div className="text-2xl font-bold">
                    {userDetails._count.contributedCanvases}
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-muted-foreground mb-1 text-xs">
                    التسجيلات
                  </div>
                  <div className="text-2xl font-bold">
                    {userDetails._count.enrollments}
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-muted-foreground mb-1 text-xs">
                    مشرف على
                  </div>
                  <div className="text-2xl font-bold">
                    {userDetails._count.moderatedSubjects}
                  </div>
                </div>
              </div>

              {userDetails.moderatedSubjects.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <h4 className="font-semibold">الإشراف على المواد</h4>
                  </div>
                  <div className="space-y-2">
                    {userDetails.moderatedSubjects.map(mod => (
                      <div key={mod.id} className="bg-muted rounded-lg p-3">
                        <p className="font-medium">{mod.subject.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {mod.subject.college.name} -{" "}
                          {mod.subject.college.university.name}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          منذ {formatDate(mod.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userDetails.enrollments.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    <h4 className="font-semibold">المواد المسجلة</h4>
                    <span className="text-muted-foreground text-xs">
                      (آخر 10)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {userDetails.enrollments.map(enrollment => (
                      <div
                        key={enrollment.id}
                        className="bg-muted rounded-lg p-3"
                      >
                        <p className="font-medium">{enrollment.subject.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {enrollment.subject.code} -{" "}
                          {enrollment.subject.college.name}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          تاريخ التسجيل: {formatDate(enrollment.enrolledAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userDetails.contributedCanvases.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <h4 className="font-semibold">المساهمات</h4>
                    <span className="text-muted-foreground text-xs">
                      (آخر 10)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {userDetails.contributedCanvases.map(contribution => (
                      <div
                        key={contribution.id}
                        className="bg-muted rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{contribution.title}</p>
                            <p className="text-muted-foreground text-xs">
                              {contribution.chapter.subject.name} -{" "}
                              {contribution.chapter.title}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {formatDate(contribution.createdAt)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              contribution.status === "APPROVED"
                                ? "default"
                                : contribution.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {contribution.status === "APPROVED"
                              ? "موافق عليه"
                              : contribution.status === "PENDING"
                                ? "قيد المراجعة"
                                : "مرفوض"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
