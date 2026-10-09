import { ValidationError } from "@/lib/errors";

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; title?: string; items: string[] }
  | { type: "callout"; label: string; text: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isAcademySlug(slug: string): boolean {
  return typeof slug === "string" && slug.length <= 100 && SLUG.test(slug);
}

/** The persisted lesson ID is also the existing progress and URL identity. */
export function academyLessonId(courseSlug: string, lessonSlug: string): string {
  if (![courseSlug, lessonSlug].every(isAcademySlug)) {
    throw new ValidationError("Invalid course or lesson identifier");
  }
  return `${courseSlug}/${lessonSlug}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Validate stored JSON before rendering it; malformed content uses the text fallback. */
export function readContentBlocks(value: unknown): ContentBlock[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const blocks: ContentBlock[] = [];
  for (const block of value) {
    if (!isRecord(block)) return null;
    switch (block["type"]) {
      case "heading":
      case "paragraph":
        if (typeof block["text"] !== "string") return null;
        blocks.push({ type: block["type"], text: block["text"] });
        break;
      case "callout":
        if (typeof block["label"] !== "string" || typeof block["text"] !== "string") return null;
        blocks.push({ type: "callout", label: block["label"], text: block["text"] });
        break;
      case "list": {
        const items = block["items"];
        const title = block["title"];
        if (!Array.isArray(items) || !items.every((item) => typeof item === "string")) return null;
        if (title !== undefined && typeof title !== "string") return null;
        blocks.push(title === undefined ? { type: "list", items } : { type: "list", title, items });
        break;
      }
      default:
        return null;
    }
  }
  return blocks;
}
