"use client";

import { cn } from "@/lib/utils";
import imageCompression from "browser-image-compression";
import { Camera, ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

/**
 * Extract R2 key from a public CDN URL
 * e.g., "https://cdn.sirb-app.com/canvas-images/123/uuid.jpg" -> "canvas-images/123/uuid.jpg"
 */
function extractR2KeyFromUrl(url: string | null): string | null {
  if (!url || !R2_PUBLIC_URL) return null;
  if (!url.startsWith(R2_PUBLIC_URL)) return null;
  return url.slice(R2_PUBLIC_URL.length + 1); // +1 for the "/"
}

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
} as const;

type CanvasImageUploadProps = {
  currentImageUrl: string | null;
  onImageChange: (imageUrl: string | null, key: string | null) => void;
  canvasId?: number;
  disabled?: boolean;
  className?: string;
};

export function CanvasImageUpload({
  currentImageUrl,
  onImageChange,
  canvasId,
  disabled = false,
  className,
}: CanvasImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const [currentKey, setCurrentKey] = useState<string | null>(() =>
    extractR2KeyFromUrl(currentImageUrl)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when prop changes (e.g., on cancel edit)
  useEffect(() => {
    setPreviewUrl(currentImageUrl);
    setCurrentKey(extractR2KeyFromUrl(currentImageUrl));
  }, [currentImageUrl]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "يرجى اختيار صورة بصيغة PNG أو JPEG أو WebP";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "حجم الصورة يجب أن يكون أقل من 5 ميجابايت";
    }

    return null;
  };

  const compressImage = async (file: File): Promise<File> => {
    try {
      return await imageCompression(file, COMPRESSION_OPTIONS);
    } catch (error) {
      console.error("Compression failed:", error);
      return file;
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }

    setIsUploading(true);

    let uploadedKey: string | null = null;
    let localPreview: string | null = null;

    try {
      const compressedFile = await compressImage(file);

      localPreview = URL.createObjectURL(compressedFile);
      setPreviewUrl(localPreview);

      const response = await fetch("/api/r2/upload/canvas-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: compressedFile.name,
          contentType: compressedFile.type,
          size: compressedFile.size,
          canvasId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "فشل في الحصول على رابط الرفع");
      }

      const { presignedUrl, publicUrl, key } = await response.json();
      uploadedKey = key;

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": compressedFile.type },
        body: compressedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("فشل رفع الصورة");
      }

      // Clean up local preview
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }

      // Note: Don't delete old image here - let parent handle it after successful save
      // This prevents data loss if user cancels the edit

      setPreviewUrl(publicUrl);
      setCurrentKey(key);
      onImageChange(publicUrl, key);
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }

      // Cleanup uploaded file if it exists
      if (uploadedKey) {
        try {
          await fetch("/api/r2/delete/canvas-image", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: uploadedKey }),
          });
        } catch (deleteError) {
          console.error("Failed to cleanup uploaded image:", deleteError);
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ أثناء رفع الصورة";
      toast.error(errorMessage);
      setPreviewUrl(currentImageUrl);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentKey) {
      try {
        await fetch("/api/r2/delete/canvas-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: currentKey }),
        });
      } catch (error) {
        console.error("Failed to delete canvas image:", error);
      }
    }

    setPreviewUrl(null);
    setCurrentKey(null);
    onImageChange(null, null);
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="group relative w-full"
        aria-label="رفع صورة الغلاف"
      >
        <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="صورة الغلاف"
              fill
              sizes="(max-width: 640px) 100vw, 500px"
              className="object-cover"
            />
          ) : (
            <div className="from-muted to-muted/50 flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br">
              <ImageIcon className="text-muted-foreground/40 h-12 w-12" />
              <span className="text-muted-foreground text-sm">
                اضغط لرفع صورة الغلاف
              </span>
            </div>
          )}

          {/* Upload overlay */}
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
              <div className="flex flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-8 w-8 text-white" />
                <span className="text-sm text-white">
                  {previewUrl ? "تغيير الصورة" : "رفع صورة"}
                </span>
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Remove button */}
      {previewUrl && !isUploading && !disabled && (
        <button
          type="button"
          onClick={handleRemoveImage}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-colors"
          aria-label="إزالة الصورة"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
