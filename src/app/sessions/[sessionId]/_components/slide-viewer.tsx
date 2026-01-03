"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PDFViewer, ZoomMode } from "@embedpdf/react-pdf-viewer";
import { Check, ChevronDown, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Resource {
  id: number;
  title: string;
  mime_type: string;
  file_size: number;
  chapter_id: number | null;
  url: string;
}

interface Chapter {
  id: number;
  title: string;
  sequence?: number;
}

interface SlideViewerProps {
  studyPlanId: string;
  chapters: Chapter[];
}

export function SlideViewer({ studyPlanId, chapters }: SlideViewerProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true);
        const res = await fetch(`/api/resources/session/${studyPlanId}`);
        if (!res.ok) throw new Error("Failed to fetch resources");
        const data = await res.json();
        const docs = data.resources as Resource[];
        setResources(docs);
        
        if (docs.length > 0) {
          setSelectedResource(docs[0]);
        }
      } catch {
        setError("فشل في تحميل الملفات");
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, [studyPlanId]);

  const groupedResources = useMemo(() => 
    chapters.map((chapter) => ({
      chapter,
      resources: resources.filter((r) => r.chapter_id === chapter.id),
    })).filter((g) => g.resources.length > 0),
    [chapters, resources]
  );

  const getChapterLabel = useCallback((chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find((c) => c.id === chapterId);
    return chapter?.sequence ? `${chapter.sequence}` : null;
  }, [chapters]);

  const selectedChapterLabel = useMemo(
    () => selectedResource ? getChapterLabel(selectedResource.chapter_id) : null,
    [selectedResource, getChapterLabel]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  if (!selectedResource) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <FileText className="size-12" />
        <p>لا توجد ملفات</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {resources.length > 1 && (
        <div className="relative shrink-0 border-b p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between gap-2">
                <span className="truncate">{selectedResource.title}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedChapterLabel && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                      {selectedChapterLabel}
                    </span>
                  )}
                  <ChevronDown className="size-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {groupedResources.map(({ chapter, resources: chapterResources }, idx) => (
                <div key={chapter.id}>
                  {idx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="truncate">{chapter.title}</span>
                    {chapter.sequence && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {chapter.sequence}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  {chapterResources.map((r) => (
                    <DropdownMenuItem
                      key={r.id}
                      onClick={() => setSelectedResource(r)}
                      className="flex items-center gap-2 pr-2"
                    >
                      {r.id === selectedResource.id ? (
                        <Check className="size-4 text-primary shrink-0" />
                      ) : (
                        <div className="size-4" />
                      )}
                      <span className="truncate">{r.title}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <div className="min-h-0 flex-1 text-left">
        <PDFViewer
          key={selectedResource.id}
          config={{
            src: selectedResource.url,
            theme: {
              preference: "dark",
              dark: {
                accent: {
                  primary: "var(--primary)",
                  primaryHover: "var(--ring)",
                  primaryActive: "var(--primary)",
                  primaryLight: "var(--muted)",
                  primaryForeground: "var(--primary-foreground)",
                },
                background: {
                  app: "var(--background)",
                  surface: "var(--card)",
                  surfaceAlt: "var(--muted)",
                  elevated: "var(--popover)",
                },
                foreground: {
                  primary: "var(--foreground)",
                  secondary: "var(--muted-foreground)",
                  muted: "var(--muted-foreground)",
                },
                border: {
                  default: "var(--border)",
                  subtle: "var(--muted)",
                },
              },
            },
            zoom: { defaultZoomLevel: ZoomMode.FitWidth },
            disabledCategories: ["document-open"],
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
