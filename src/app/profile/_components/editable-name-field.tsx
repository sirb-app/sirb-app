"use client";

import { Input } from "@/components/ui/input";
import { updateUser } from "@/lib/auth-client";
import { USER_VALIDATION } from "@/lib/consts";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type EditableNameFieldProps = {
  initialName: string;
};

export function EditableNameField({ initialName }: EditableNameFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [tempName, setTempName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setTempName(name);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempName(name);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedName = tempName.trim();

    // Validate name length
    if (trimmedName.length < USER_VALIDATION.MIN_NAME_LENGTH) {
      toast.error("يجب أن يكون الاسم حرفين على الأقل");
      setTempName(name); // Reset to original
      setIsEditing(false);
      return;
    }

    if (trimmedName.length > USER_VALIDATION.MAX_NAME_LENGTH) {
      toast.error("يجب أن يكون الاسم 20 حرفاً أو أقل");
      setTempName(name); // Reset to original
      setIsEditing(false);
      return;
    }

    if (trimmedName === name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      // Wrap updateUser in Promise to properly handle callbacks
      await new Promise<void>((resolve, reject) => {
        updateUser({
          name: trimmedName,
          fetchOptions: {
            onError: ctx => {
              reject(new Error(ctx.error.message));
            },
            onSuccess: () => {
              setName(trimmedName);
              setTempName(trimmedName);
              setIsEditing(false);
              toast.success("تم تحديث الاسم بنجاح");
              router.refresh();
              resolve();
            },
          },
        });
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "فشل تحديث الاسم";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={tempName}
          onChange={e => setTempName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="text-center text-2xl font-bold"
          maxLength={USER_VALIDATION.MAX_NAME_LENGTH}
        />
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    );
  }

  return (
    <button
      onClick={handleEdit}
      className="group hover:text-primary flex items-center justify-center gap-2 transition-colors"
    >
      <Pencil className="text-muted-foreground h-4 w-4" />
      <h2 className="text-2xl font-bold">{name}</h2>
    </button>
  );
}
