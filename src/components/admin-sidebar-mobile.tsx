"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PanelRightOpen } from "lucide-react";
import { AdminSidebarContent } from "./admin-sidebar-content";

export default function AdminSidebarMobile() {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild className="bg-accent md:hidden">
          <Button
            variant="secondary"
            size="icon"
            className="fixed right-4 bottom-5 z-50 rounded-full shadow-md"
            aria-label="فتح القائمة الجانبية"
          >
            <PanelRightOpen className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="bg-sidebar w-[300px] p-0 sm:w-[400px]"
        >
          <SheetHeader className="pt-3 pr-4 pb-4">
            <SheetTitle className="text-foreground text-xl font-bold">
              لوحة الإدارة
            </SheetTitle>
          </SheetHeader>
          <div
            className="flex h-full flex-col gap-2 text-right"
            dir="rtl"
            aria-label="الشريط الجانبي للإدارة"
          >
            <AdminSidebarContent
              linkWrapper={node => <SheetClose asChild>{node}</SheetClose>}
              showHeader={false}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
