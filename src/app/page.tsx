import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";
import Image from "next/image";

export default async function Page() {
  const universities = await prisma.university.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });

  const firstUniversity = universities[0];

  return (
    <div className="my-48 flex h-dvh justify-center">
      <div className="mx-auto w-full px-3 md:px-8 lg:px-[150px]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-4 gap-x-3 gap-y-6 md:grid-cols-8 md:gap-x-4 md:gap-y-8 lg:grid-cols-12 lg:gap-x-5">
          {/* Title */}
          <h1 className="col-span-4 text-center text-5xl font-bold md:col-span-8 md:text-6xl lg:col-span-12">
            سرب
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground col-span-4 max-w-lg justify-self-center text-center text-lg md:col-span-8 md:text-xl lg:col-span-12">
            ابحث في المقررات الدراسية من مختلف الجامعات
          </p>

          {/* Row: University Selector + Search */}
          <div className="col-span-4 flex justify-center md:col-span-8 lg:col-span-12">
            <div className="flex w-full max-w-2xl items-center gap-2 md:gap-3 lg:gap-4">
              {/* University Selector using shadcn Select */}
              <Select defaultValue={firstUniversity?.id.toString()}>
                <SelectTrigger className="min-w-[90px] data-[size=default]:h-12 md:min-w-[100px] data-[size=default]:md:h-14">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/imamu-logo.png"
                      alt="شعار الجامعة"
                      width={44}
                      height={44}
                      className="h-8 w-8 object-contain md:h-10 md:w-10"
                      priority
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {universities.map(university => (
                    <SelectItem
                      key={university.id}
                      value={university.id.toString()}
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src="/imamu-logo.png"
                          alt={`شعار ${university.name}`}
                          width={32}
                          height={32}
                          className="h-6 w-6 object-contain"
                        />
                        <span>جامعة {university.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search using shadcn Input */}
              <div className="relative flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 md:right-4 md:h-6 md:w-6" />
                <Input
                  type="text"
                  placeholder="ابحث في المقررات الدراسية..."
                  className="pr-10 pl-4 text-base data-[slot=input]:h-12 md:pr-14 md:text-lg data-[slot=input]:md:h-14"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
