/**
 * MIRROR — Academy progress repository (server-only).
 *
 * Owns persistence for the `Progress` table (lesson completion). Progress is
 * always scoped to the authenticated user; the user id comes from the
 * server-side session and is never supplied by the client as authority.
 *
 * Lesson identity uses the curriculum's stable natural key —
 * "courseSlug/lessonSlug" — which mirrors the slug keys of the sample
 * curriculum in `lib/data/curriculum.ts`. `Progress.lessonId` stores that key
 * as a plain string and deliberately has NO foreign key to `Lesson.id` while
 * the curriculum is typed sample data (migration
 * 20260902080805_remove_progress_lesson_fk dropped the FK). Duplicate
 * completion for the same user/lesson is prevented by the
 * `@@unique([userId, lessonId])` constraint.
 *
 * FUTURE RECONCILIATION: when a later phase moves the curriculum into the
 * database (seeded `Course`/`Lesson` rows), progress rows must be reconciled
 * from slug-pair keys to real `Lesson` ids and the `Lesson` relation/FK can
 * then be restored. Runtime-verified against the linked Neon database: lesson
 * completion upserts succeed and duplicate rows are rejected by the unique
 * constraint.
 */

import "server-only";
import { prisma } from "@/lib/db";

export class AcademyRepository {
  /** Lesson keys the user has marked complete, deterministically ordered. */
  async listCompletedLessonKeys(userId: string): Promise<string[]> {
    const rows = await prisma.progress.findMany({
      where: { userId, completed: true },
      select: { lessonId: true },
      orderBy: { completedAt: "asc" },
    });
    return rows.map((row) => row.lessonId);
  }

  /** Whether the user has marked a specific lesson complete. */
  async isLessonComplete(userId: string, lessonId: string): Promise<boolean> {
    const row = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { completed: true },
    });
    return row?.completed === true;
  }

  /**
   * Record (or update) a lesson's completion state for the user.
   * Idempotent via the `@@unique([userId, lessonId])` constraint.
   */
  async setLessonCompletion(
    userId: string,
    lessonId: string,
    completed: boolean
  ): Promise<void> {
    await prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { completed, completedAt: completed ? new Date() : null },
      create: { userId, lessonId, completed, completedAt: completed ? new Date() : null },
    });
  }
}

export const academyRepository = new AcademyRepository();