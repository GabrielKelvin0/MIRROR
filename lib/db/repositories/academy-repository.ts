/**
 * Server-only curriculum reads and per-user Academy progress.
 * Lesson.id and Progress.lessonId share the stable courseSlug/lessonSlug key.
 * Progress user IDs must come from the authenticated server-side session.
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { academyLessonId, isAcademySlug } from "@/lib/services/academy-content";
import { NotFoundError } from "@/lib/errors";

const LESSON_SUMMARY = {
  id: true,
  slug: true,
  title: true,
  order: true,
  estimatedMinutes: true,
} as const;
const COURSE_SUMMARY = {
  id: true,
  slug: true,
  title: true,
  description: true,
  level: true,
  order: true,
  lessons: {
    select: LESSON_SUMMARY,
    orderBy: [{ order: "asc" }, { slug: "asc" }],
  },
} satisfies Prisma.CourseSelect;

export class AcademyRepository {
  /** Public curriculum metadata only; no content bodies or learner progress. */
  async listCourses() {
    return prisma.course.findMany({
      select: COURSE_SUMMARY,
      orderBy: [{ order: "asc" }, { slug: "asc" }],
    });
  }

  async getCourse(slug: string) {
    return prisma.course.findUnique({ where: { slug }, select: COURSE_SUMMARY });
  }

  async getLesson(courseSlug: string, lessonSlug: string) {
    if (![courseSlug, lessonSlug].every(isAcademySlug)) return null;
    return prisma.lesson.findUnique({
      where: { id: academyLessonId(courseSlug, lessonSlug) },
      select: {
        ...LESSON_SUMMARY,
        content: true,
        contentBlocks: true,
        course: { select: COURSE_SUMMARY },
      },
    });
  }

  async listCompletedLessonKeys(userId: string): Promise<string[]> {
    const rows = await prisma.progress.findMany({
      where: { userId, completed: true },
      select: { lessonId: true },
      orderBy: { completedAt: "asc" },
    });
    return rows.map((row) => row.lessonId);
  }

  async isLessonComplete(userId: string, lessonId: string): Promise<boolean> {
    const row = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { completed: true },
    });
    return row?.completed === true;
  }

  /** Reject invented lessons before the upsert; the FK also protects concurrent deletion. */
  async setLessonCompletion(userId: string, lessonId: string, completed: boolean): Promise<void> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundError("Lesson not found");

    await prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { completed, completedAt: completed ? new Date() : null },
      create: { userId, lessonId, completed, completedAt: completed ? new Date() : null },
    });
  }
}

export const academyRepository = new AcademyRepository();
export type AcademyCourse = Awaited<ReturnType<AcademyRepository["listCourses"]>>[number];
