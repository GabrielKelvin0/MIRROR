/**
 * MIRROR — Academy business rules (pure, deterministic, testable).
 *
 * This module contains ONLY pure functions: course progress math, lesson
 * completion state transitions, lesson navigation, and input validation.
 * It has no database or I/O dependency and no clock, so every result is
 * deterministic and can be unit-tested in isolation.
 *
 * Server-side authorization and ownership are enforced in the repository and
 * server actions, not here. These functions validate shape, not identity.
 */

import { ValidationError } from "@/lib/errors";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface ProgressInput {
  lessonId?: string | undefined;
  courseId?: string | undefined;
}

export interface NormalizedProgress {
  lessonId: string;
  courseId: string | null;
}

export type CompletionAction = "complete" | "incomplete";

export interface CourseProgress {
  completed: number;
  total: number;
  /** Percentage 0-100 (whole number), deterministic. */
  percent: number;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/** Validate and normalize a lesson-progress input. */
export function validateProgressInput(input: ProgressInput): NormalizedProgress {
  const lessonId = (input.lessonId ?? "").trim();
  if (lessonId.length === 0) {
    throw new ValidationError("Lesson is required", { lessonId: "required" });
  }
  const courseId = (input.courseId ?? "").trim();
  return { lessonId, courseId: courseId.length > 0 ? courseId : null };
}

/* ------------------------------------------------------------------ */
/* Completion state                                                    */
/* ------------------------------------------------------------------ */

/**
 * Resolve the deterministic completion value for a completion action.
 * "complete" → true, "incomplete" → false; anything else is rejected.
 * Never reads or writes anything — pure state resolution.
 */
export function nextCompletionState(action: CompletionAction): boolean {
  if (action === "complete") return true;
  if (action === "incomplete") return false;
  throw new ValidationError("Unsupported completion action", { action: "invalid" });
}

/* ------------------------------------------------------------------ */
/* Course progress                                                     */
/* ------------------------------------------------------------------ */

/**
 * Deterministic course progress from the set of completed lesson ids against
 * the course's full lesson id list. Ignores ids that do not belong to the
 * course; the percentage is a whole number rounded deterministically.
 */
export function courseProgress(
  completedLessonIds: string[],
  allLessonIds: string[]
): CourseProgress {
  const total = allLessonIds.length;
  const completed = completedLessonIds.filter((id) => allLessonIds.includes(id)).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

/* ------------------------------------------------------------------ */
/* Lesson navigation                                                   */
/* ------------------------------------------------------------------ */

/**
 * Deterministic prev/next position within a lesson list. Returns `null` when
 * there is no previous or next lesson (first/last position).
 */
export function lessonNavigation(
  courseLength: number,
  currentIndex: number
): { previousIndex: number | null; nextIndex: number | null } {
  if (courseLength <= 0 || currentIndex < 0 || currentIndex >= courseLength) {
    return { previousIndex: null, nextIndex: null };
  }
  return {
    previousIndex: currentIndex > 0 ? currentIndex - 1 : null,
    nextIndex: currentIndex < courseLength - 1 ? currentIndex + 1 : null,
  };
}