/**
 * MIRROR — Academy progress repository (server-only).
 *
 * Owns persistence for the `Progress` table (lesson completion). Progress is
 * always scoped to the authenticated user; the user id comes from the
 * server-side session and is never supplied by the client as authority.
 *
 * Lesson identity uses a deterministic key — "courseSlug/lessonSlug" — which
 * mirrors the slug keys of the sample curriculum in `lib/data/curriculum.ts`.
 * This keeps progress storable now and directly swappable when the curriculum
 * moves to the database without a redesign.
 *
 * KNOWN LIMITATION (schema-FK): `Progress.lessonId` is a foreign key to
 * `Lesson.id` (a cuid). The sample curriculum has no real `Lesson` rows yet, so
 * progress rows here store the "courseSlug/lessonSlug" key in `lessonId`. When a
 * later phase seeds real `Course`/`Lesson` rows, progress must be reconciled to
 * real lesson ids (or the curriculum seeded) so the FK resolves. This code
 * compiles, typechecks, and is unit-tested but was not runtime-executed here
 * (no database in this container).
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