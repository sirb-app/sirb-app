"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateUser } from "@/lib/auth-client";
import imageCompression from "browser-image-compression";
import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

// Avatar upload constants
const ALLOWED_AVATAR_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 512,
  useWebWorker: true,
} as const;

type EditableAvatarProps = {
  userId: string;
  currentImage: string | null;
  userName: string;
  publicUrlBase: string;
};

export function EditableAvatar({
  userId,
  currentImage,
  userName,
  publicUrlBase,
}: EditableAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return "يرجى اختيار صورة بصيغة PNG أو JPEG أو WebP";
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return "حجم الصورة يجب أن يكون أقل من 2 ميجابايت";
    }

    return null;
  };

  const compressImage = async (file: File): Promise<File> => {
    try {
      return await imageCompression(file, COMPRESSION_OPTIONS);
    } catch (error) {
      console.error("Compression failed:", error);
      return file; // Return original if compression fails
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }

    setIsUploading(true);

    let uploadedKey: string | null = null;
    let localPreview: string | null = null;
    let updateSucceeded = false;

    try {
      // Compress image
      const compressedFile = await compressImage(file);

      // Create local preview for optimistic update
      localPreview = URL.createObjectURL(compressedFile);
      setPreviewUrl(localPreview);

      // 1. Get presigned URL (no old avatar deletion yet)
      const response = await fetch("/api/r2/upload/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: compressedFile.name,
          contentType: compressedFile.type,
          size: compressedFile.size,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "فشل في الحصول على رابط الرفع");
      }

      const { presignedUrl, publicUrl, key } = await response.json();
      uploadedKey = key;

      // 2. Upload to R2
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": compressedFile.type },
        body: compressedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("فشل رفع الصورة");
      }

      // 3. Update user profile
      updateUser({
        image: publicUrl,
        fetchOptions: {
          onSuccess: async () => {
            updateSucceeded = true;

            // Cleanup local preview
            if (localPreview) {
              URL.revokeObjectURL(localPreview);
              localPreview = null;
            }

            setPreviewUrl(publicUrl);
            toast.success("تم تحديث الصورة بنجاح");

            // Delete old avatar if it exists
            if (currentImage && currentImage.startsWith(publicUrlBase)) {
              const oldKey = currentImage.replace(`${publicUrlBase}/`, "");
              try {
                await fetch("/api/r2/delete/avatar", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ key: oldKey }),
                });
              } catch (deleteError) {
                // Log but don't fail - old avatar cleanup is not critical
                console.error("Failed to delete old avatar:", deleteError);
              }
            }

            router.refresh();
            setIsUploading(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          },
          onError: async ctx => {
            // Rollback: Delete uploaded file since update failed
            if (uploadedKey) {
              try {
                await fetch("/api/r2/delete/avatar", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ key: uploadedKey }),
                });
              } catch (deleteError) {
                console.error(
                  "Failed to cleanup uploaded avatar:",
                  deleteError
                );
              }
            }

            // Clean up local preview
            if (localPreview) {
              URL.revokeObjectURL(localPreview);
            }

            toast.error(ctx.error.message || "حدث خطأ أثناء تحديث الصورة");
            setPreviewUrl(currentImage);
            setIsUploading(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          },
        },
      });
    } catch (error) {
      // Handle errors from steps 1-2 (presigned URL generation, R2 upload)
      // Clean up local preview
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }

      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ أثناء رفع الصورة";
      toast.error(errorMessage);
      setPreviewUrl(currentImage);
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_AVATAR_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="group relative"
        aria-label="تغيير صورة الملف الشخصي"
      >
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || ""} alt={userName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl uppercase">
            {userName.slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all group-hover:bg-black/40">
            <div className="flex flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
              <span className="text-xs text-white">تغيير الصورة</span>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
