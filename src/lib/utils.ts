import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert a string to a URL-friendly slug. */
export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}
/**
 * Removes common prefixes from titles like "المحتوى 1:" or "الفصل 1:"
 */
export function stripTitlePrefix(title: string): string {
  // Remove patterns like "المحتوى 1:", "المحتوى 1 -", "الفصل 1:", "الفصل 1 -", etc.
  return title
    .replace(/^المحتوى\s+\d+\s*[:\-\s]+/i, "")
    .replace(/^الفصل\s+\d+\s*[:\-\s]+/i, "")
    .trim();
}
