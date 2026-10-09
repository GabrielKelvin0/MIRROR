import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CURRICULUM } from "@/lib/data/curriculum";
import { academyLessonId, readContentBlocks } from "./academy-content";
import { ValidationError } from "@/lib/errors";

describe("stable Academy identity", () => {
  it("preserves the existing progress key and lesson URL slugs", () => {
    expect(academyLessonId("investing-basics", "what-is-investing")).toBe(
      "investing-basics/what-is-investing"
    );
  });

  it.each(["", "../lesson", "with/slash", "Uppercase", " leading", "a".repeat(101)])(
    "rejects ambiguous or malformed identifiers: %s",
    (slug) => {
      expect(() => academyLessonId(slug, "lesson")).toThrow(ValidationError);
      expect(() => academyLessonId("course", slug)).toThrow(ValidationError);
    }
  );
});

describe("database content validation", () => {
  it("preserves every approved lesson's content blocks", () => {
    for (const course of CURRICULUM) {
      for (const lesson of course.lessons) {
        expect(readContentBlocks(lesson.contentBlocks)).toEqual(lesson.contentBlocks);
      }
    }
  });

  it.each([
    null,
    [],
    "not JSON blocks",
    [{ type: "script", text: "bad" }],
    [{ type: "paragraph", text: 7 }],
    [{ type: "list", items: ["valid", 3] }],
    [{ type: "list", title: 7, items: [] }],
    [{ type: "callout", text: "missing label" }],
  ])("uses the legacy text fallback for malformed or absent structured content (%j)", (value) =>
    expect(readContentBlocks(value)).toBeNull()
  );

  it("keeps HTML as text rather than interpreting it as a content type", () => {
    expect(readContentBlocks([{ type: "paragraph", text: "<script>alert(1)</script>" }])).toEqual([
      { type: "paragraph", text: "<script>alert(1)</script>" },
    ]);
  });
});

describe("versioned curriculum seed", () => {
  it("contains every approved course and lesson with its original content and stable ID", () => {
    const sql = readFileSync(
      "prisma/migrations/20261007190000_academy_database_curriculum/migration.sql",
      "utf8"
    );
    const courseJson = sql.split("$academy_courses$")[1];
    const lessonJson = sql.split("$academy_lessons$")[1];
    expect(courseJson).toBeDefined();
    expect(lessonJson).toBeDefined();
    const courses = JSON.parse(courseJson!) as { slug: string; title: string }[];
    const lessons = JSON.parse(lessonJson!) as {
      courseSlug: string;
      slug: string;
      contentBlocks: unknown;
    }[];
    expect(courses).toHaveLength(16);
    expect(lessons).toHaveLength(48);
    const ids = lessons.map((lesson) => academyLessonId(lesson.courseSlug, lesson.slug));
    expect(new Set(ids).size).toBe(48);
    for (const course of CURRICULUM) {
      expect(courses.find((seed) => seed.slug === course.slug)?.title).toBe(course.title);
      for (const lesson of course.lessons) {
        expect(
          lessons.find((seed) => seed.courseSlug === course.slug && seed.slug === lesson.slug)
            ?.contentBlocks
        ).toEqual(lesson.contentBlocks);
      }
    }
  });
});
