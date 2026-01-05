"use client";

import {
  createSubjectAction,
  deleteSubjectAction,
  updateSubjectAction,
} from "@/actions/subject.actions";
import {
  createCollegeAction,
  createUniversityAction,
  deleteCollegeAction,
  deleteUniversityAction,
  updateCollegeAction,
  updateUniversityAction,
} from "@/actions/university.actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Prisma } from "@/generated/prisma";
import {
  BookMarked,
  Building2,
  GraduationCap,
  MoreVertical,
  PenLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

// Types
type SubjectWithCounts = Prisma.SubjectGetPayload<{
  include: { _count: { select: { chapters: true } } };
}>;

type CollegeWithSubjects = Prisma.CollegeGetPayload<{
  include: {
    subjects: { include: { _count: { select: { chapters: true } } } };
    _count: { select: { subjects: true } };
  };
}>;

type UniversityWithRelations = Prisma.UniversityGetPayload<{
  include: {
    colleges: {
      include: {
        subjects: { include: { _count: { select: { chapters: true } } } };
        _count: { select: { subjects: true } };
      };
    };
  };
}>;

interface UniversitiesManagerProps {
  universities: UniversityWithRelations[];
}

// Utility functions
const chaptersLabel = (count: number) => {
  if (count === 0) return "بدون فصول";
  if (count === 1) return "فصل واحد";
  if (count === 2) return "فصلان";
  if (count <= 10) return `${count} فصول`;
  return `${count} فصل`;
};

const numberFormatter = new Intl.NumberFormat("ar-SA-u-nu-latn");

// Memoized Subject Item
const SubjectItem = memo(function SubjectItem({
  subject,
  collegeId,
  onEdit,
  onDelete,
}: {
  subject: SubjectWithCounts;
  collegeId: number;
  onEdit: (subject: SubjectWithCounts, collegeId: number) => void;
  onDelete: (subject: SubjectWithCounts, collegeId: number) => void;
}) {
  return (
    <li className="bg-background group flex items-center justify-between gap-2 rounded border p-3">
      <Link href={`/admin/subjects/${subject.id}`} className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium group-hover:underline">
            {subject.name}
          </span>
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px] uppercase">
            {subject.code}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          {chaptersLabel(subject._count?.chapters ?? 0)}
        </p>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-right">
          <DropdownMenuItem onSelect={() => onEdit(subject, collegeId)}>
            <PenLine className="ml-2 h-3.5 w-3.5" />
            تعديل
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onDelete(subject, collegeId)}
          >
            <Trash2 className="ml-2 h-3.5 w-3.5" />
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
});

// Memoized College Item
const CollegeItem = memo(function CollegeItem({
  college,
  universityId,
  onEditCollege,
  onDeleteCollege,
  onCreateSubject,
  onEditSubject,
  onDeleteSubject,
}: {
  college: CollegeWithSubjects;
  universityId: number;
  onEditCollege: (college: CollegeWithSubjects, uniId: number) => void;
  onDeleteCollege: (college: CollegeWithSubjects, uniId: number) => void;
  onCreateSubject: (collegeId: number) => void;
  onEditSubject: (subject: SubjectWithCounts, collegeId: number) => void;
  onDeleteSubject: (subject: SubjectWithCounts, collegeId: number) => void;
}) {
  return (
    <AccordionItem
      value={`college-${college.id}`}
      className="bg-muted/30 rounded-lg border !border-b"
    >
      <div className="flex items-center gap-2 px-3">
        <AccordionTrigger className="flex-1 py-3 hover:no-underline">
          <div className="flex flex-1 items-center gap-3">
            <div className="bg-secondary text-secondary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <h4 className="text-sm font-medium">{college.name}</h4>
              <p className="text-muted-foreground text-xs">
                {numberFormatter.format(college._count.subjects)} مادة
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onCreateSubject(college.id)}
            aria-label="إضافة مادة"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-right">
              <DropdownMenuItem
                onSelect={() => onEditCollege(college, universityId)}
              >
                <PenLine className="ml-2 h-3.5 w-3.5" />
                تعديل
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDeleteCollege(college, universityId)}
              >
                <Trash2 className="ml-2 h-3.5 w-3.5" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <AccordionContent className="px-3 pb-3">
        {college.subjects.length === 0 ? (
          <div className="bg-background/50 rounded border border-dashed p-4 text-center">
            <BookMarked className="text-muted-foreground mx-auto mb-2 h-6 w-6" />
            <p className="text-muted-foreground text-xs">لا توجد مواد</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onCreateSubject(college.id)}
            >
              <Plus className="ml-1 h-3 w-3" />
              إضافة مادة
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {college.subjects.map(subject => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                collegeId={college.id}
                onEdit={onEditSubject}
                onDelete={onDeleteSubject}
              />
            ))}
          </ul>
        )}
      </AccordionContent>
    </AccordionItem>
  );
});

// Memoized University Item
const UniversityItem = memo(function UniversityItem({
  uni,
  onEditUniversity,
  onDeleteUniversity,
  onCreateCollege,
  onEditCollege,
  onDeleteCollege,
  onCreateSubject,
  onEditSubject,
  onDeleteSubject,
}: {
  uni: UniversityWithRelations;
  onEditUniversity: (uni: UniversityWithRelations) => void;
  onDeleteUniversity: (uni: UniversityWithRelations) => void;
  onCreateCollege: (uniId: number) => void;
  onEditCollege: (college: CollegeWithSubjects, uniId: number) => void;
  onDeleteCollege: (college: CollegeWithSubjects, uniId: number) => void;
  onCreateSubject: (collegeId: number) => void;
  onEditSubject: (subject: SubjectWithCounts, collegeId: number) => void;
  onDeleteSubject: (subject: SubjectWithCounts, collegeId: number) => void;
}) {
  const subjectCount = uni.colleges.reduce(
    (acc, c) => acc + c._count.subjects,
    0
  );

  return (
    <AccordionItem
      value={`uni-${uni.id}`}
      className="bg-card rounded-lg border !border-b shadow-sm"
    >
      <div className="flex items-center gap-2 px-4">
        <AccordionTrigger className="flex-1 py-4 hover:no-underline">
          <div className="flex flex-1 items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{uni.name}</h3>
                <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-xs uppercase">
                  {uni.code}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {numberFormatter.format(uni.colleges.length)} كلية •{" "}
                {numberFormatter.format(subjectCount)} مادة
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onCreateCollege(uni.id)}
            aria-label="إضافة كلية"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-right">
              <DropdownMenuItem onSelect={() => onEditUniversity(uni)}>
                <PenLine className="ml-2 h-4 w-4" />
                تعديل الجامعة
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDeleteUniversity(uni)}
              >
                <Trash2 className="ml-2 h-4 w-4" />
                حذف الجامعة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <AccordionContent className="px-4 pb-4">
        {uni.colleges.length === 0 ? (
          <div className="bg-muted/30 rounded-lg border border-dashed p-6 text-center">
            <GraduationCap className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">لا توجد كليات بعد</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onCreateCollege(uni.id)}
            >
              <Plus className="ml-2 h-4 w-4" />
              إضافة كلية
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {uni.colleges.map(college => (
              <CollegeItem
                key={college.id}
                college={college}
                universityId={uni.id}
                onEditCollege={onEditCollege}
                onDeleteCollege={onDeleteCollege}
                onCreateSubject={onCreateSubject}
                onEditSubject={onEditSubject}
                onDeleteSubject={onDeleteSubject}
              />
            ))}
          </Accordion>
        )}
      </AccordionContent>
    </AccordionItem>
  );
});

// Main Component
export default function UniversitiesManager({
  universities,
}: UniversitiesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  // Optimistic state for instant feedback
  const [optimisticData, addOptimistic] = useOptimistic(
    universities,
    (state, action: { type: string; id?: number }) => {
      if (action.type === "delete-university") {
        return state.filter(u => u.id !== action.id);
      }
      return state;
    }
  );

  // Dialog states
  const [createUniOpen, setCreateUniOpen] = useState(false);
  const [editUniOpen, setEditUniOpen] = useState(false);
  const [deleteUniOpen, setDeleteUniOpen] = useState(false);
  const [targetUni, setTargetUni] = useState<UniversityWithRelations | null>(
    null
  );

  const [createCollegeOpen, setCreateCollegeOpen] = useState(false);
  const [editCollegeOpen, setEditCollegeOpen] = useState(false);
  const [deleteCollegeOpen, setDeleteCollegeOpen] = useState(false);
  const [targetUniversityId, setTargetUniversityId] = useState<number | null>(
    null
  );
  const [targetCollege, setTargetCollege] =
    useState<CollegeWithSubjects | null>(null);

  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [editSubjectOpen, setEditSubjectOpen] = useState(false);
  const [deleteSubjectOpen, setDeleteSubjectOpen] = useState(false);
  const [targetCollegeId, setTargetCollegeId] = useState<number | null>(null);
  const [targetSubject, setTargetSubject] = useState<SubjectWithCounts | null>(
    null
  );

  // Filtered data with deferred search
  const filtered = useMemo(() => {
    if (!deferredSearch.trim()) return optimisticData;
    const q = deferredSearch.toLowerCase();
    return optimisticData.filter(
      uni =>
        uni.name.toLowerCase().includes(q) || uni.code.toLowerCase().includes(q)
    );
  }, [optimisticData, deferredSearch]);

  // Stats
  const totals = useMemo(() => {
    let totalColleges = 0;
    let totalSubjects = 0;
    for (const uni of optimisticData) {
      totalColleges += uni.colleges.length;
      for (const college of uni.colleges) {
        totalSubjects += college._count.subjects;
      }
    }
    return {
      totalUniversities: optimisticData.length,
      totalColleges,
      totalSubjects,
    };
  }, [optimisticData]);

  // University handlers
  const handleCreateUniversity = useCallback(
    (formData: FormData) => {
      const code = formData.get("code");
      if (typeof code === "string") {
        formData.set("code", code.toUpperCase());
      }
      startTransition(async () => {
        const res = await createUniversityAction(formData);
        if (res.error === null) {
          toast.success("تمت إضافة الجامعة");
          setCreateUniOpen(false);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      });
    },
    [router]
  );

  const handleUpdateUniversity = useCallback(
    (formData: FormData) => {
      if (!targetUni) return;
      const code = formData.get("code");
      if (typeof code === "string") {
        formData.set("code", code.toUpperCase());
      }
      startTransition(async () => {
        const res = await updateUniversityAction(targetUni.id, formData);
        if (res.error === null) {
          toast.success("تم تحديث الجامعة");
          setEditUniOpen(false);
          setTargetUni(null);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      });
    },
    [targetUni, router]
  );

  const handleDeleteUniversity = useCallback(() => {
    if (!targetUni) return;
    startTransition(async () => {
      addOptimistic({ type: "delete-university", id: targetUni.id });
      const res = await deleteUniversityAction(targetUni.id);
      if (res.error === null) {
        toast.success("تم حذف الجامعة");
        setDeleteUniOpen(false);
        setTargetUni(null);
        router.refresh();
      } else {
        toast.error(res.error);
        router.refresh();
      }
    });
  }, [targetUni, router, addOptimistic]);

  // College handlers
  const handleCreateCollege = useCallback(
    (formData: FormData, form: HTMLFormElement) => {
      startTransition(async () => {
        const res = await createCollegeAction(formData);
        if (!("error" in res) || res.error === null) {
          toast.success("تمت إضافة الكلية");
          form.reset();
          setCreateCollegeOpen(false);
          setTargetUniversityId(null);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      });
    },
    [router]
  );

  const handleUpdateCollege = useCallback(
    (formData: FormData, form: HTMLFormElement) => {
      if (!targetCollege) return;
      startTransition(async () => {
        const res = await updateCollegeAction(targetCollege.id, formData);
        if (!("error" in res) || res.error === null) {
          toast.success("تم تحديث الكلية");
          form.reset();
          setEditCollegeOpen(false);
          setTargetCollege(null);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      });
    },
    [targetCollege, router]
  );

  const handleDeleteCollege = useCallback(() => {
    if (!targetCollege || !targetUniversityId) return;
    startTransition(async () => {
      const res = await deleteCollegeAction(
        targetCollege.id,
        targetUniversityId
      );
      if (!("error" in res) || res.error === null) {
        toast.success("تم حذف الكلية");
        setDeleteCollegeOpen(false);
        setTargetCollege(null);
        setTargetUniversityId(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }, [targetCollege, targetUniversityId, router]);

  // Subject handlers
  const handleCreateSubject = useCallback(
    (formData: FormData, form: HTMLFormElement) => {
      const code = formData.get("code");
      if (typeof code === "string") {
        formData.set("code", code.toUpperCase());
      }
      startTransition(async () => {
        const res = await createSubjectAction(formData);
        if (res.error === null) {
          toast.success("تمت إضافة المادة");
          form.reset();
          setCreateSubjectOpen(false);
          setTargetCollegeId(null);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      });
    },
    [router]
  );

  const handleUpdateSubject = useCallback(
    (formData: FormData, form: HTMLFormElement) => {
      if (!targetSubject) return;
      const code = formData.get("code");
      if (typeof code === "string") {
        formData.set("code", code.toUpperCase());
      }
      startTransition(async () => {
        const res = await updateSubjectAction(targetSubject.id, formData);
        if (res.error === null) {
          toast.success("تم تحديث المادة");
          form.reset();
          setEditSubjectOpen(false);
          setTargetSubject(null);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      });
    },
    [targetSubject, router]
  );

  const handleDeleteSubject = useCallback(() => {
    if (!targetSubject || !targetCollegeId) return;
    startTransition(async () => {
      const res = await deleteSubjectAction(targetSubject.id, targetCollegeId);
      if (res.error === null) {
        toast.success("تم حذف المادة");
        setDeleteSubjectOpen(false);
        setTargetSubject(null);
        setTargetCollegeId(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }, [targetSubject, targetCollegeId, router]);

  // Callback props for memoized components
  const onEditUniversity = useCallback((uni: UniversityWithRelations) => {
    setTargetUni(uni);
    setEditUniOpen(true);
  }, []);

  const onDeleteUniversity = useCallback((uni: UniversityWithRelations) => {
    setTargetUni(uni);
    setDeleteUniOpen(true);
  }, []);

  const onCreateCollege = useCallback((uniId: number) => {
    setTargetUniversityId(uniId);
    setCreateCollegeOpen(true);
  }, []);

  const onEditCollege = useCallback(
    (college: CollegeWithSubjects, uniId: number) => {
      setTargetUniversityId(uniId);
      setTargetCollege(college);
      setEditCollegeOpen(true);
    },
    []
  );

  const onDeleteCollege = useCallback(
    (college: CollegeWithSubjects, uniId: number) => {
      setTargetUniversityId(uniId);
      setTargetCollege(college);
      setDeleteCollegeOpen(true);
    },
    []
  );

  const onCreateSubject = useCallback((collegeId: number) => {
    setTargetCollegeId(collegeId);
    setCreateSubjectOpen(true);
  }, []);

  const onEditSubject = useCallback(
    (subject: SubjectWithCounts, collegeId: number) => {
      setTargetCollegeId(collegeId);
      setTargetSubject(subject);
      setEditSubjectOpen(true);
    },
    []
  );

  const onDeleteSubject = useCallback(
    (subject: SubjectWithCounts, collegeId: number) => {
      setTargetCollegeId(collegeId);
      setTargetSubject(subject);
      setDeleteSubjectOpen(true);
    },
    []
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="space-y-4">
        <Breadcrumb className="text-muted-foreground">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">لوحة التحكم</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>إدارة الجامعات</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">إدارة الجامعات</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search
                className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                placeholder="بحث بالاسم أو الكود"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-2 pl-8"
                aria-label="بحث"
              />
            </div>
            <Dialog open={createUniOpen} onOpenChange={setCreateUniOpen}>
              <DialogTrigger asChild>
                <Button className="whitespace-nowrap">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة جامعة
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>جامعة جديدة</DialogTitle>
                  <DialogDescription>أدخل معلومات الجامعة.</DialogDescription>
                </DialogHeader>
                <form
                  action={handleCreateUniversity}
                  className="space-y-4"
                  onSubmit={e => {
                    if (isPending) e.preventDefault();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      disabled={isPending}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">الكود</Label>
                    <Input
                      id="code"
                      name="code"
                      required
                      disabled={isPending}
                      className="uppercase"
                      pattern="[A-Za-z0-9]+"
                      title="استخدم حروف إنجليزية وأرقام فقط بدون مسافات"
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateUniOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium">
            عدد الجامعات
          </p>
          <p className="text-foreground mt-2 text-lg font-semibold">
            {numberFormatter.format(totals.totalUniversities)}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium">
            إجمالي الكليات
          </p>
          <p className="text-foreground mt-2 text-lg font-semibold">
            {numberFormatter.format(totals.totalColleges)}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium">
            إجمالي المواد
          </p>
          <p className="text-foreground mt-2 text-lg font-semibold">
            {numberFormatter.format(totals.totalSubjects)}
          </p>
        </div>
      </div>

      {/* Universities Tree */}
      {filtered.length === 0 ? (
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-8 text-center">
          <Building2 className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <h3 className="mb-1 font-semibold">لا توجد نتائج</h3>
          <p className="text-muted-foreground text-sm">
            {search ? "حاول البحث بكلمة أخرى" : "ابدأ بإضافة أول جامعة"}
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {filtered.map(uni => (
            <UniversityItem
              key={uni.id}
              uni={uni}
              onEditUniversity={onEditUniversity}
              onDeleteUniversity={onDeleteUniversity}
              onCreateCollege={onCreateCollege}
              onEditCollege={onEditCollege}
              onDeleteCollege={onDeleteCollege}
              onCreateSubject={onCreateSubject}
              onEditSubject={onEditSubject}
              onDeleteSubject={onDeleteSubject}
            />
          ))}
        </Accordion>
      )}

      {/* Edit University Dialog */}
      <Dialog
        open={editUniOpen}
        onOpenChange={open => {
          setEditUniOpen(open);
          if (!open) setTargetUni(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الجامعة</DialogTitle>
          </DialogHeader>
          <form
            key={targetUni?.id ?? "edit-uni"}
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              handleUpdateUniversity(new FormData(e.currentTarget));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-uni-name">اسم الجامعة</Label>
              <Input
                id="edit-uni-name"
                name="name"
                required
                disabled={isPending}
                defaultValue={targetUni?.name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-uni-code">كود الجامعة</Label>
              <Input
                id="edit-uni-code"
                name="code"
                required
                disabled={isPending}
                defaultValue={targetUni?.code ?? ""}
                className="uppercase"
                pattern="[A-Za-z0-9]+"
                title="استخدم حروف إنجليزية وأرقام فقط بدون مسافات"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditUniOpen(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete University Dialog */}
      <AlertDialog
        open={deleteUniOpen}
        onOpenChange={open => {
          setDeleteUniOpen(open);
          if (!open) setTargetUni(null);
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الجامعة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف جامعة &quot;{targetUni?.name}&quot;؟ سيتم حذف
              جميع الكليات والمواد والمحتوى المرتبط بها. هذا الإجراء لا يمكن
              التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUniversity}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create College Dialog */}
      <Dialog
        open={createCollegeOpen}
        onOpenChange={open => {
          setCreateCollegeOpen(open);
          if (!open) setTargetUniversityId(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>كلية جديدة</DialogTitle>
            <DialogDescription>أدخل اسم الكلية.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              formData.set("universityId", String(targetUniversityId));
              handleCreateCollege(formData, form);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-college-name">اسم الكلية</Label>
              <Input
                id="new-college-name"
                name="name"
                required
                disabled={isPending}
                autoFocus
                placeholder="مثال: كلية الهندسة"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateCollegeOpen(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit College Dialog */}
      <Dialog
        open={editCollegeOpen}
        onOpenChange={open => {
          setEditCollegeOpen(open);
          if (!open) {
            setTargetCollege(null);
            setTargetUniversityId(null);
          }
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الكلية</DialogTitle>
          </DialogHeader>
          <form
            key={targetCollege?.id ?? "edit-college"}
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              formData.set("universityId", String(targetUniversityId));
              handleUpdateCollege(formData, form);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-college-name">اسم الكلية</Label>
              <Input
                id="edit-college-name"
                name="name"
                required
                disabled={isPending}
                defaultValue={targetCollege?.name ?? ""}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditCollegeOpen(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete College Dialog */}
      <AlertDialog
        open={deleteCollegeOpen}
        onOpenChange={open => {
          setDeleteCollegeOpen(open);
          if (!open) {
            setTargetCollege(null);
            setTargetUniversityId(null);
          }
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الكلية</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف كلية &quot;{targetCollege?.name}&quot;؟ سيتم
              حذف جميع المواد والمحتوى المرتبط بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollege}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Subject Dialog */}
      <Dialog
        open={createSubjectOpen}
        onOpenChange={open => {
          setCreateSubjectOpen(open);
          if (!open) setTargetCollegeId(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>مادة جديدة</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              formData.set("collegeId", String(targetCollegeId));
              handleCreateSubject(formData, form);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-subject-name">اسم المادة</Label>
              <Input
                id="new-subject-name"
                name="name"
                required
                disabled={isPending}
                autoFocus
                placeholder="مثال: مقدمة في البرمجة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-subject-code">كود المادة</Label>
              <Input
                id="new-subject-code"
                name="code"
                required
                disabled={isPending}
                className="uppercase"
                pattern="[A-Za-z0-9]+"
                title="استخدم حروف إنجليزية وأرقام فقط بدون مسافات"
                placeholder="مثال: CS101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-subject-description">
                وصف مختصر (اختياري)
              </Label>
              <Textarea
                id="new-subject-description"
                name="description"
                disabled={isPending}
                placeholder="وصف يساعد الطلبة على فهم محتوى المادة"
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateSubjectOpen(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog
        open={editSubjectOpen}
        onOpenChange={open => {
          setEditSubjectOpen(open);
          if (!open) {
            setTargetSubject(null);
            setTargetCollegeId(null);
          }
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المادة</DialogTitle>
          </DialogHeader>
          <form
            key={targetSubject?.id ?? "edit-subject"}
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              formData.set("collegeId", String(targetCollegeId));
              handleUpdateSubject(formData, form);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-subject-name">اسم المادة</Label>
              <Input
                id="edit-subject-name"
                name="name"
                required
                disabled={isPending}
                defaultValue={targetSubject?.name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject-code">كود المادة</Label>
              <Input
                id="edit-subject-code"
                name="code"
                required
                disabled={isPending}
                defaultValue={targetSubject?.code ?? ""}
                className="uppercase"
                pattern="[A-Za-z0-9]+"
                title="استخدم حروف إنجليزية وأرقام فقط بدون مسافات"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject-description">
                وصف مختصر (اختياري)
              </Label>
              <Textarea
                id="edit-subject-description"
                name="description"
                disabled={isPending}
                defaultValue={targetSubject?.description ?? ""}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditSubjectOpen(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Dialog */}
      <AlertDialog
        open={deleteSubjectOpen}
        onOpenChange={open => {
          setDeleteSubjectOpen(open);
          if (!open) {
            setTargetSubject(null);
            setTargetCollegeId(null);
          }
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المادة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف مادة &quot;{targetSubject?.name}&quot;؟ سيتم
              حذف جميع الفصول والمحتوى المرتبط بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubject}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
