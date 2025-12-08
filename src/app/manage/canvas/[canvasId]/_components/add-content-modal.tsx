"use client";

import {
  addCanvasQuestionBlock,
  addFileBlock,
  addTextBlock,
  addVideoBlock,
  updateCanvasQuestionBlock,
  updateFileBlock,
  updateTextBlock,
  updateVideoBlock,
} from "@/actions/canvas-manage.action";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Circle,
  File,
  FileText,
  HelpCircle,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ContentBlockData = {
  content?: string;
  title?: string;
  url?: string;
  isOriginal?: boolean;
  mimeType?: string;
  fileSize?: bigint;
  questionText?: string;
  questionType?: string;
  justification?: string | null;
  options?: Array<{ optionText: string; isCorrect: boolean }>;
  [key: string]: unknown;
};

type ContentBlock = {
  id: number;
  sequence: number;
  contentType: "TEXT" | "VIDEO" | "FILE" | "QUESTION";
  data?: ContentBlockData | null;
};

type AddContentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  canvasId: number;
  initialData?: ContentBlock | null;
};

type ContentType =
  | "TEXT"
  | "VIDEO"
  | "FILE"
  | "MCQ_SINGLE"
  | "MCQ_MULTI"
  | "TRUE_FALSE";

export default function AddContentModal({
  isOpen,
  onClose,
  canvasId,
  initialData,
}: AddContentModalProps) {
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>("TEXT");
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to ensure value is always a string
  const ensureString = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  // Form States - ensure all string states are initialized with empty strings
  const [textContent, setTextContent] = useState<string>("");

  const [videoTitle, setVideoTitle] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoIsExternal, setVideoIsExternal] = useState(false);

  const [fileTitle, setFileTitle] = useState<string>("");
  const [fileIsExternal, setFileIsExternal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [questionText, setQuestionText] = useState<string>("");
  const [questionJustification, setQuestionJustification] =
    useState<string>("");

  // Safe setters that always ensure string values
  const setVideoTitleSafe = (value: string | undefined | null) => {
    setVideoTitle(ensureString(value));
  };

  const setVideoUrlSafe = (value: string | undefined | null) => {
    setVideoUrl(ensureString(value));
  };

  const setFileTitleSafe = (value: string | undefined | null) => {
    setFileTitle(ensureString(value));
  };

  const setTextContentSafe = (value: string | undefined | null) => {
    setTextContent(ensureString(value));
  };

  const setQuestionTextSafe = (value: string | undefined | null) => {
    setQuestionText(ensureString(value));
  };

  const setQuestionJustificationSafe = (value: string | undefined | null) => {
    setQuestionJustification(ensureString(value));
  };
  const [questionOptions, setQuestionOptions] = useState([
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
  ]);
  const [questionErrors, setQuestionErrors] = useState<{
    questionText?: string;
    options?: string;
    correctAnswer?: string;
  }>({});
  const [textError, setTextError] = useState<string>("");
  const [videoErrors, setVideoErrors] = useState<{
    title?: string;
    url?: string;
  }>({});
  const [fileErrors, setFileErrors] = useState<{
    title?: string;
    file?: string;
  }>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Always reset all fields first
      setTextContent("");
      setVideoTitle("");
      setVideoUrl("");
      setVideoIsExternal(false);
      setFileTitle("");
      setFileIsExternal(false);
      setSelectedFile(null);
      setIsUploading(false);
      setQuestionText("");
      setQuestionJustification("");
      setQuestionOptions([
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ]);
      setQuestionErrors({});

      if (initialData && initialData.data) {
        // Set content type and populate data
        if (initialData.contentType === "QUESTION") {
          const questionData = initialData.data;
          const questionType = questionData.questionType as ContentType;
          setContentType(questionType);
          setQuestionTextSafe(questionData.questionText);
          setQuestionJustificationSafe(questionData.justification);

          // Set options based on type
          if (questionType === "TRUE_FALSE") {
            setQuestionOptions([
              {
                optionText: "صح",
                isCorrect: questionData.options?.[0]?.isCorrect || false,
              },
              {
                optionText: "خطأ",
                isCorrect: questionData.options?.[1]?.isCorrect || false,
              },
            ]);
          } else if (questionData.options) {
            setQuestionOptions(
              questionData.options.map(opt => ({
                optionText: String(opt.optionText ?? ""),
                isCorrect: Boolean(opt.isCorrect),
              }))
            );
          }
        } else if (initialData.contentType === "TEXT") {
          setContentType("TEXT");
          setTextContentSafe(initialData.data?.content);
        } else if (initialData.contentType === "VIDEO") {
          setContentType("VIDEO");
          setVideoTitleSafe(initialData.data?.title);
          setVideoUrlSafe(initialData.data?.url);
          setVideoIsExternal(!initialData.data?.isOriginal);
        } else if (initialData.contentType === "FILE") {
          setContentType("FILE");
          setFileTitleSafe(initialData.data?.title);
          setFileIsExternal(!initialData.data?.isOriginal);
        }
      } else {
        setContentType("TEXT");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  // Reset form fields when content type changes (only during creation, not editing)
  useEffect(() => {
    if (!initialData && isOpen) {
      // Reset all string states to empty strings immediately
      setTextContent("");
      setVideoTitle("");
      setVideoUrl("");
      setVideoIsExternal(false);
      setFileTitle("");
      setFileIsExternal(false);
      setSelectedFile(null);
      setQuestionText("");
      setQuestionJustification("");

      // Set question options based on content type
      if (contentType === "TRUE_FALSE") {
        setQuestionOptions([
          { optionText: "صح", isCorrect: false },
          { optionText: "خطأ", isCorrect: false },
        ]);
      } else if (contentType === "MCQ_SINGLE" || contentType === "MCQ_MULTI") {
        setQuestionOptions([
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
        ]);
      }

      setQuestionErrors({});
      setTextError("");
      setVideoErrors({});
      setFileErrors({});
    }
  }, [contentType, initialData, isOpen]);

  const handleContentTypeChange = (type: ContentType) => {
    if (initialData) return; // Don't allow type change when editing
    setContentType(type);

    // Reset question-related state for question types
    if (
      type === "MCQ_SINGLE" ||
      type === "MCQ_MULTI" ||
      type === "TRUE_FALSE"
    ) {
      if (type === "TRUE_FALSE") {
        setQuestionOptions([
          { optionText: "صح", isCorrect: false },
          { optionText: "خطأ", isCorrect: false },
        ]);
      } else {
        setQuestionOptions([
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
        ]);
      }
      setQuestionErrors({});
    }
  };

  const updateQuestionOption = (index: number, text: string) => {
    const newOptions = [...questionOptions];
    newOptions[index].optionText = text;
    setQuestionOptions(newOptions);
    setQuestionErrors(prev => ({ ...prev, options: undefined }));
  };

  const toggleQuestionCorrect = (index: number) => {
    const newOptions = [...questionOptions];

    if (contentType === "MCQ_SINGLE" || contentType === "TRUE_FALSE") {
      // Single answer: uncheck all others
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      // Multi answer: toggle this one
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    }

    setQuestionOptions(newOptions);
    setQuestionErrors(prev => ({ ...prev, correctAnswer: undefined }));
  };

  const validateQuestionForm = () => {
    const newErrors: {
      questionText?: string;
      options?: string;
      correctAnswer?: string;
    } = {};

    // Validate question text
    if (questionText.trim().length < 5) {
      newErrors.questionText = "نص السؤال يجب أن يكون 5 أحرف على الأقل";
    }

    // Check all options have text (skip for TRUE_FALSE as options are pre-filled)
    if (
      contentType !== "TRUE_FALSE" &&
      questionOptions.some(opt => opt.optionText.trim().length === 0)
    ) {
      newErrors.options = "جميع الخيارات يجب أن تحتوي على نص";
    }

    // Check at least one correct answer
    if (!questionOptions.some(opt => opt.isCorrect)) {
      newErrors.correctAnswer = "يجب اختيار إجابة صحيحة واحدة على الأقل";
    }

    // For single/true-false, exactly one correct
    if (
      (contentType === "MCQ_SINGLE" || contentType === "TRUE_FALSE") &&
      questionOptions.filter(opt => opt.isCorrect).length !== 1
    ) {
      newErrors.correctAnswer = "يجب اختيار إجابة صحيحة واحدة فقط";
    }

    return newErrors;
  };

  // File validation
  const validateFile = (file: File): boolean => {
    const maxSize =
      Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

    if (file.size > maxSize) {
      toast.error("حجم الملف يجب أن يكون أقل من 10 ميجابايت");
      return false;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "image/png",
      "image/jpeg",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("نوع الملف غير مدعوم");
      return false;
    }

    return true;
  };

  // Upload file to R2
  const uploadFileToR2 = async (file: File): Promise<string> => {
    // 1. Get presigned URL from API
    const res = await fetch("/api/r2/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        canvasId,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { presignedUrl, key } = await res.json();

    // 2. Upload file directly to R2
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("Upload failed");
    }

    return key;
  };

  const handleSubmit = async () => {
    // Validate before submitting - ensure we use string values
    if (contentType === "TEXT") {
      const content = (textContent || "").trim();
      if (!content) {
        setTextError("المحتوى النصي مطلوب");
        return;
      }
      setTextError("");
    } else if (contentType === "VIDEO") {
      const title = (videoTitle || "").trim();
      const url = (videoUrl || "").trim();
      const errors: { title?: string; url?: string } = {};
      if (!title) {
        errors.title = "عنوان الفيديو مطلوب";
      }
      if (!url) {
        errors.url = "رابط يوتيوب مطلوب";
      }
      if (Object.keys(errors).length > 0) {
        setVideoErrors(errors);
        return;
      }
      setVideoErrors({});
    } else if (contentType === "FILE") {
      const title = (fileTitle || "").trim();
      const errors: { title?: string; file?: string } = {};
      if (!title) {
        errors.title = "عنوان الملف مطلوب";
      }
      if (!initialData && !selectedFile) {
        errors.file = "الرجاء اختيار ملف";
      }
      if (Object.keys(errors).length > 0) {
        setFileErrors(errors);
        return;
      }
      setFileErrors({});
    }

    try {
      setIsLoading(true);

      if (contentType === "TEXT") {
        if (initialData) {
          await updateTextBlock({
            blockId: initialData.id,
            canvasId,
            content: (textContent || "").trim(),
          });
          toast.success("تم تحديث النص");
        } else {
          await addTextBlock({ canvasId, content: (textContent || "").trim() });
          toast.success("تم إضافة النص");
        }
      } else if (contentType === "VIDEO") {
        const data = {
          canvasId,
          title: (videoTitle || "").trim(),
          url: (videoUrl || "").trim(),
          isOriginal: !videoIsExternal,
        };
        if (initialData) {
          await updateVideoBlock({ blockId: initialData.id, ...data });
          toast.success("تم تحديث الفيديو");
        } else {
          await addVideoBlock(data);
          toast.success("تم إضافة الفيديو");
        }
      } else if (contentType === "FILE") {
        let uploadedKey: string | null = null;

        try {
          // Upload file to R2 if new file selected
          if (selectedFile) {
            setIsUploading(true);
            uploadedKey = await uploadFileToR2(selectedFile);
          }

          const data: {
            canvasId: number;
            title: string;
            isOriginal: boolean;
            r2Key?: string;
            fileSize?: number;
            mimeType?: string;
          } = {
            canvasId,
            title: (fileTitle || "").trim(),
            isOriginal: !fileIsExternal,
          };

          if (initialData) {
            // Update existing file
            if (uploadedKey) {
              data.r2Key = uploadedKey;
              data.fileSize = selectedFile!.size;
              data.mimeType = selectedFile!.type;
            }
            const result = await updateFileBlock({
              blockId: initialData.id,
              ...data,
            });

            // Cleanup old file from R2 if it was replaced
            if (result.oldKey && uploadedKey) {
              fetch("/api/r2/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: result.oldKey }),
              }).catch(() => {}); // Silent cleanup
            }

            toast.success("تم تحديث الملف");
          } else {
            // Add new file - create new object with required fields
            await addFileBlock({
              canvasId,
              title: (fileTitle || "").trim(),
              isOriginal: !fileIsExternal,
              r2Key: uploadedKey!,
              fileSize: selectedFile!.size,
              mimeType: selectedFile!.type,
            });
            toast.success("تم إضافة الملف بنجاح");
          }
        } catch (uploadError) {
          // Cleanup orphaned file if DB save failed
          if (uploadedKey) {
            fetch("/api/r2/delete", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: uploadedKey }),
            }).catch(() => {}); // Silent cleanup
          }
          throw uploadError;
        } finally {
          setIsUploading(false);
        }
      } else if (
        contentType === "MCQ_SINGLE" ||
        contentType === "MCQ_MULTI" ||
        contentType === "TRUE_FALSE"
      ) {
        const validationErrors = validateQuestionForm();
        setQuestionErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
          return;
        }

        // For TRUE_FALSE, only use first 2 options
        const optionsToSubmit =
          contentType === "TRUE_FALSE"
            ? questionOptions.slice(0, 2)
            : questionOptions;

        const data = {
          canvasId,
          questionText: questionText.trim(),
          questionType: contentType as
            | "MCQ_SINGLE"
            | "MCQ_MULTI"
            | "TRUE_FALSE",
          justification: questionJustification.trim() || undefined,
          options: optionsToSubmit.map(opt => ({
            optionText: opt.optionText.trim(),
            isCorrect: opt.isCorrect,
          })),
        };

        if (initialData) {
          await updateCanvasQuestionBlock({ blockId: initialData.id, ...data });
          toast.success("تم تحديث السؤال بنجاح");
        } else {
          await addCanvasQuestionBlock(data);
          toast.success("تم إضافة السؤال بنجاح");
        }
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setIsLoading(false);
    }
  };

  const TypeButton = ({
    type,
    icon: Icon,
    label,
  }: {
    type: ContentType;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => !initialData && handleContentTypeChange(type)}
      disabled={!!initialData}
      className={cn(
        "flex h-full w-full flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
        contentType === type
          ? "border-primary bg-primary/5 text-primary"
          : "bg-muted hover:bg-muted/80 text-muted-foreground border-transparent",
        initialData && contentType !== type && "cursor-not-allowed opacity-50"
      )}
    >
      <div
        className={cn(
          "rounded-full p-2",
          contentType === type ? "bg-primary/10" : "bg-background"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );

  const renderForm = () => {
    switch (contentType) {
      case "TEXT":
        return (
          <div className="animate-in fade-in zoom-in-95 space-y-4 pt-2 duration-200">
            <div className="space-y-2">
              <Label>المحتوى النصي</Label>
              <TipTapEditor
                content={textContent ?? ""}
                onChange={value => {
                  setTextContent(value || "");
                  setTextError("");
                }}
                placeholder="اكتب الشرح هنا..."
              />
              {textError && (
                <p className="text-destructive text-sm">{textError}</p>
              )}
            </div>
          </div>
        );
      case "VIDEO":
        return (
          <div
            key="video-form"
            className="animate-in fade-in zoom-in-95 space-y-4 pt-2 duration-200"
          >
            <div className="space-y-2">
              <Label htmlFor="v-title">عنوان الفيديو</Label>
              <Input
                id="v-title"
                value={videoTitle}
                onChange={e => {
                  setVideoTitleSafe(e.target.value);
                  setVideoErrors(prev => ({ ...prev, title: undefined }));
                }}
                placeholder="مثال: شرح الدرس الأول"
                autoFocus
              />
              {videoErrors.title && (
                <p className="text-destructive text-sm">{videoErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-url">رابط يوتيوب</Label>
              <Input
                id="v-url"
                value={videoUrl}
                onChange={e => {
                  setVideoUrlSafe(e.target.value);
                  setVideoErrors(prev => ({ ...prev, url: undefined }));
                }}
                placeholder="https://youtube.com/..."
                dir="ltr"
              />
              {videoErrors.url && (
                <p className="text-destructive text-sm">{videoErrors.url}</p>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <Checkbox
                id="v-external"
                checked={videoIsExternal}
                onCheckedChange={checked =>
                  setVideoIsExternal(checked === true)
                }
              />
              <Label
                htmlFor="v-external"
                className="cursor-pointer text-sm font-normal"
              >
                هذا المحتوى ليس من إعدادي الشخصي
              </Label>
            </div>
          </div>
        );
      case "FILE":
        return (
          <div
            key="file-form"
            className="animate-in fade-in zoom-in-95 space-y-5 pt-2 duration-200"
          >
            {/* File Title */}
            <div className="space-y-2">
              <Label htmlFor="f-title">عنوان الملف</Label>
              <Input
                id="f-title"
                value={fileTitle}
                onChange={e => {
                  setFileTitleSafe(e.target.value);
                  setFileErrors(prev => ({ ...prev, title: undefined }));
                }}
                placeholder="مثال: ملخص الفصل الأول"
                autoFocus
                disabled={isUploading}
              />
              {fileErrors.title && (
                <p className="text-destructive text-sm">{fileErrors.title}</p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">الملف</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.gif"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && validateFile(file)) {
                    setSelectedFile(file);
                    setFileErrors(prev => ({ ...prev, file: undefined }));
                  } else if (file) {
                    e.target.value = ""; // Reset input
                  }
                }}
                disabled={isUploading}
                className="cursor-pointer"
              />
              {fileErrors.file && (
                <p className="text-destructive text-sm">{fileErrors.file}</p>
              )}

              {/* File Info */}
              {selectedFile && !isUploading && (
                <div className="bg-muted/50 mt-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <File className="text-muted-foreground h-5 w-5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-foreground truncate text-sm font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                          ميجابايت
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        const input = document.getElementById(
                          "file-upload"
                        ) as HTMLInputElement;
                        if (input) input.value = "";
                      }}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      disabled={isUploading}
                    >
                      <span className="text-xs">إزالة</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="bg-primary/5 mt-2 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div className="bg-primary h-full w-full animate-pulse rounded-full" />
                    </div>
                    <span className="text-primary shrink-0 text-xs font-medium">
                      جاري الرفع...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Source Attribution */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="f-external"
                  checked={fileIsExternal}
                  onCheckedChange={checked =>
                    setFileIsExternal(checked === true)
                  }
                  disabled={isUploading}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="f-external"
                  className="cursor-pointer text-sm leading-relaxed font-normal"
                >
                  هذا المحتوى ليس من إعدادي الشخصي (منقول من مصدر خارجي)
                </Label>
              </div>
            </div>
          </div>
        );
      case "MCQ_SINGLE":
      case "MCQ_MULTI":
        return (
          <div className="animate-in fade-in zoom-in-95 space-y-5 pt-2 duration-200">
            {/* Question Text */}
            <div className="space-y-2">
              <Label>
                نص السؤال <span className="text-destructive">*</span>
              </Label>
              <TipTapEditor
                content={questionText}
                onChange={value => {
                  setQuestionTextSafe(value);
                  setQuestionErrors(prev => ({
                    ...prev,
                    questionText: undefined,
                  }));
                }}
                placeholder="اكتب السؤال هنا..."
              />
              {questionErrors.questionText && (
                <p className="text-destructive text-sm">
                  {questionErrors.questionText}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label>
                الخيارات (4 خيارات) <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {questionOptions.map((option, index) => {
                  const isSelected = option.isCorrect;
                  const isSingle = contentType === "MCQ_SINGLE";
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border-2 px-3 py-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      )}
                      dir="rtl"
                    >
                      {isSingle ? (
                        <input
                          type="radio"
                          id={`opt-${index}`}
                          name="mcq-option"
                          checked={isSelected}
                          onChange={() => toggleQuestionCorrect(index)}
                          className="h-4 w-4 shrink-0"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          id={`opt-${index}`}
                          checked={isSelected}
                          onChange={() => toggleQuestionCorrect(index)}
                          className="h-4 w-4 shrink-0"
                        />
                      )}
                      <Input
                        value={option.optionText ?? ""}
                        onChange={e =>
                          updateQuestionOption(index, e.target.value)
                        }
                        placeholder={`الخيار ${index + 1}`}
                        className="h-7 flex-1 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                        dir="rtl"
                      />
                    </div>
                  );
                })}
              </div>
              {questionErrors.options && (
                <p className="text-destructive text-sm">
                  {questionErrors.options}
                </p>
              )}
              {questionErrors.correctAnswer && (
                <p className="text-destructive text-sm">
                  {questionErrors.correctAnswer}
                </p>
              )}
            </div>

            {/* Justification */}
            <div className="space-y-2">
              <Label>التوضيح (اختياري)</Label>
              <TipTapEditor
                content={questionJustification}
                onChange={value => setQuestionJustificationSafe(value)}
                placeholder="اكتب توضيحاً للإجابة الصحيحة..."
              />
            </div>
          </div>
        );
      case "TRUE_FALSE":
        return (
          <div className="animate-in fade-in zoom-in-95 space-y-5 pt-2 duration-200">
            {/* Question Text */}
            <div className="space-y-2">
              <Label>
                نص السؤال <span className="text-destructive">*</span>
              </Label>
              <TipTapEditor
                content={questionText}
                onChange={value => {
                  setQuestionTextSafe(value);
                  setQuestionErrors(prev => ({
                    ...prev,
                    questionText: undefined,
                  }));
                }}
                placeholder="اكتب السؤال هنا..."
              />
              {questionErrors.questionText && (
                <p className="text-destructive text-sm">
                  {questionErrors.questionText}
                </p>
              )}
            </div>

            {/* True/False Options */}
            <div className="space-y-2">
              <Label>
                الخيارات <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {questionOptions.slice(0, 2).map((option, index) => {
                  const isSelected = option.isCorrect;
                  return (
                    <label
                      key={index}
                      htmlFor={`tf-${index}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      )}
                      dir="rtl"
                    >
                      <input
                        type="radio"
                        id={`tf-${index}`}
                        name="tf-option"
                        checked={isSelected}
                        onChange={() => toggleQuestionCorrect(index)}
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="flex-1 text-sm">
                        {option.optionText}
                      </span>
                    </label>
                  );
                })}
              </div>
              {questionErrors.correctAnswer && (
                <p className="text-destructive text-sm">
                  {questionErrors.correctAnswer}
                </p>
              )}
            </div>

            {/* Justification */}
            <div className="space-y-2">
              <Label>التوضيح (اختياري)</Label>
              <TipTapEditor
                content={questionJustification}
                onChange={value => setQuestionJustificationSafe(value)}
                placeholder="اكتب توضيحاً للإجابة الصحيحة..."
              />
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] space-y-4 overflow-x-hidden overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "تعديل المحتوى" : "إضافة محتوى جديد"}
          </DialogTitle>
        </DialogHeader>

        <div className="relative w-full overflow-x-hidden sm:px-12">
          <Carousel
            className="mx-auto w-full"
            opts={{ align: "center", direction: "rtl" }}
          >
            <CarouselContent className="-mr-1">
              <CarouselItem className="basis-1/2 pr-1 sm:basis-1/3">
                <TypeButton type="TEXT" icon={FileText} label="نص" />
              </CarouselItem>
              <CarouselItem className="basis-1/2 pr-1 sm:basis-1/3">
                <TypeButton type="VIDEO" icon={Video} label="فيديو" />
              </CarouselItem>
              <CarouselItem className="basis-1/2 pr-1 sm:basis-1/3">
                <TypeButton type="FILE" icon={File} label="ملف" />
              </CarouselItem>
              <CarouselItem className="basis-1/2 pr-1 sm:basis-1/3">
                <TypeButton
                  type="MCQ_SINGLE"
                  icon={Circle}
                  label="اختيار واحد"
                />
              </CarouselItem>
              <CarouselItem className="basis-1/2 pr-1 sm:basis-1/3">
                <TypeButton
                  type="MCQ_MULTI"
                  icon={CheckSquare}
                  label="اختيارات متعددة"
                />
              </CarouselItem>
              <CarouselItem className="basis-1/2 pr-1 sm:basis-1/3">
                <TypeButton
                  type="TRUE_FALSE"
                  icon={HelpCircle}
                  label="صح أم خطأ"
                />
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        <div
          className="overflow-x-hidden border-t pt-4"
          key={`form-container-${contentType}`}
        >
          {renderForm()}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading
              ? "جاري الرفع..."
              : isLoading
                ? "جاري الحفظ..."
                : initialData
                  ? "حفظ التعديلات"
                  : "حفظ المحتوى"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
