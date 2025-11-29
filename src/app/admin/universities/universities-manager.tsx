"use client";

import { createUniversityAction } from "@/actions/university.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Prisma } from "@/generated/prisma";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type UniversityWithRelations = Prisma.UniversityGetPayload<{
  include: {
    colleges: { include: { _count: { select: { subjects: true } } } };
  };
}>;
interface UniversitiesManagerProps {
  universities: UniversityWithRelations[];
}

export default function UniversitiesManager({
  universities,
}: UniversitiesManagerProps) {
  const [data, setData] = useState(universities);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<{
    field: "name" | "code" | "colleges" | "createdAt";
    dir: "asc" | "desc";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  const filtered: UniversityWithRelations[] = useMemo(() => {
    let items: UniversityWithRelations[] = data;
    if (debounced.trim()) {
      const q = debounced.toLowerCase();
      items = items.filter(
        uni =>
          uni.name.toLowerCase().includes(q) ||
          uni.code.toLowerCase().includes(q)
      );
    }
    if (sort) {
      const { field, dir } = sort;
      items = [...items].sort((a, b) => {
        let av: number | string | Date;
        let bv: number | string | Date;
        if (field === "colleges") {
          av = a.colleges.length;
          bv = b.colleges.length;
        } else if (field === "createdAt") {
          av = new Date(a[field]).getTime();
          bv = new Date(b[field]).getTime();
        } else {
          av = a[field] as typeof av;
          bv = b[field] as typeof bv;
        }
        if (typeof av === "string" && typeof bv === "string") {
          const comp = av.localeCompare(bv, undefined, { sensitivity: "base" });
          return dir === "asc" ? comp : -comp;
        }
        if (av < bv) return dir === "asc" ? -1 : 1;
        if (av > bv) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [data, debounced, sort]);

  const toggleSort = (field: "name" | "code" | "colleges" | "createdAt") => {
    setSort(prev => {
      if (!prev || prev.field !== field) return { field, dir: "asc" };
      if (prev.dir === "asc") return { field, dir: "desc" };
      return null; // third click clears sort
    });
  };

  const onSubmit = (formData: FormData) => {
    const code = formData.get("code");
    if (typeof code === "string") {
      formData.set("code", code.toUpperCase());
    }
    startTransition(async () => {
      const res = await createUniversityAction(formData);
      if (res.error === null) {
        toast.success("تمت إضافة الجامعة");
        setDialogOpen(false);
        const name = (formData.get("name") as string) ?? "";
        const codeValue = (formData.get("code") as string) ?? "";
        if ("data" in res && res.data) {
          setData(prev => [
            { ...res.data, name, code: codeValue, colleges: [] },
            ...prev,
          ]);
        }
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">إدارة الجامعات</h1>
        </div>
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="whitespace-nowrap"
                aria-label="إضافة جامعة جديدة"
              >
                <Plus className="ml-2 h-4 w-4" />
                إضافة جامعة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>جامعة جديدة</DialogTitle>
                <DialogDescription>أدخل معلومات الجامعة.</DialogDescription>
              </DialogHeader>
              <form
                action={onSubmit}
                className="space-y-6"
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
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      إلغاء
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "جارٍ الحفظ..." : "حفظ"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
        <div className="bg-muted/60 text-muted-foreground supports-[backdrop-filter]:bg-muted/50 sticky top-0 z-10 grid grid-cols-5 items-center gap-2 border-b px-4 py-2 text-xs font-medium backdrop-blur sm:grid-cols-6">
          <button
            type="button"
            onClick={() => toggleSort("code")}
            className="hover:text-foreground text-right font-mono transition"
            {...(sort?.field === "code"
              ? { "aria-sort": sort.dir === "asc" ? "ascending" : "descending" }
              : {})}
          >
            الكود {sort?.field === "code" && (sort.dir === "asc" ? "▲" : "▼")}
          </button>
          <button
            type="button"
            onClick={() => toggleSort("name")}
            className="hover:text-foreground col-span-2 text-right transition"
            {...(sort?.field === "name"
              ? { "aria-sort": sort.dir === "asc" ? "ascending" : "descending" }
              : {})}
          >
            الاسم {sort?.field === "name" && (sort.dir === "asc" ? "▲" : "▼")}
          </button>
          <button
            type="button"
            onClick={() => toggleSort("colleges")}
            className="hover:text-foreground text-right transition"
            {...(sort?.field === "colleges"
              ? { "aria-sort": sort.dir === "asc" ? "ascending" : "descending" }
              : {})}
          >
            الكليات{" "}
            {sort?.field === "colleges" && (sort.dir === "asc" ? "▲" : "▼")}
          </button>
          <button
            type="button"
            onClick={() => toggleSort("createdAt")}
            className="hover:text-foreground hidden text-right transition sm:inline-block"
            {...(sort?.field === "createdAt"
              ? { "aria-sort": sort.dir === "asc" ? "ascending" : "descending" }
              : {})}
          >
            تاريخ الإنشاء{" "}
            {sort?.field === "createdAt" && (sort.dir === "asc" ? "▲" : "▼")}
          </button>
          <div aria-hidden />
        </div>
        <ul className="divide-y">
          {filtered.length === 0 && (
            <li className="text-muted-foreground p-6 text-center text-sm">
              لا توجد نتائج.
            </li>
          )}
          {filtered.map(uni => (
            <li key={uni.id} className="bg-background/40">
              <Link
                href={`/admin/universities/${encodeURIComponent(uni.code)}`}
                className="group hover:bg-muted/30 grid grid-cols-5 items-center gap-2 px-4 py-3 transition-colors sm:grid-cols-6"
                aria-label={`عرض تفاصيل جامعة ${uni.name}`}
              >
                <span className="font-mono text-sm break-all whitespace-normal">
                  {uni.code}
                </span>
                <span className="col-span-2 font-medium tracking-tight break-words whitespace-normal group-hover:underline">
                  {uni.name}
                </span>
                <span className="text-sm">
                  {new Intl.NumberFormat("ar-SA-u-nu-latn").format(
                    uni.colleges.length
                  )}
                </span>
                <span className="hidden text-sm sm:inline-block">
                  {new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  }).format(new Date(uni.createdAt))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
