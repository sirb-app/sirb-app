"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileDownloadButtonProps {
  fileId: number;
  fileName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  iconOnly?: boolean;
}

export function FileDownloadButton({
  fileId,
  fileName,
  variant = "outline",
  size = "default",
  className,
  iconOnly = false,
}: FileDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/r2/download?fileId=${fileId}`);

      if (!res.ok) {
        throw new Error("Failed to get download URL");
      }

      const { downloadUrl } = await res.json();

      // Open download in new tab
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("فشل تحميل الملف");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
      aria-label="تحميل الملف"
    >
      <Download className={iconOnly ? "h-4 w-4" : "ml-2 h-4 w-4"} />
      {!iconOnly && (isLoading ? "جاري التحميل..." : "تحميل")}
    </Button>
  );
}
