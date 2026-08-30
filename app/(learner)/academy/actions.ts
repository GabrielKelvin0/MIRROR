"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { academyRepository } from "@/lib/db";
import {
  validateProgressInput,
  nextCompletionState,
  type CompletionAction,
} from "@/lib/services/academy-rules";

/**
 * Learner Academy actions.
 *
 * Every action requires the LEARNER role (server-side, via requireRole) and is
 * scoped to the resolved local database user id — never client-supplied
 * identity. Completion state is resolved by the pure deterministic rule
 * `nextCompletionState` before any write.
 */

export type ActionResult = { error: string | undefined };

async function getLearnerId(): Promise<string> {
  const user = await requireRole("LEARNER");
  return user.id;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong";
}

/** Mark a lesson complete or incomplete (scoped to the caller's own progress). */
export function setLessonCompletion(
  courseSlug: string,
  lessonSlug: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    const userId = await getLearnerId();
    try {
      const rawAction = formData.get("action")?.toString();
      const completed = nextCompletionState(rawAction as CompletionAction);
      const lessonId = validateProgressInput({
        lessonId: `${courseSlug}/${lessonSlug}`,
        courseId: courseSlug,
      }).lessonId;
      await academyRepository.setLessonCompletion(userId, lessonId, completed);
      revalidatePath(`/learner/academy/${courseSlug}`);
      revalidatePath(`/learner/academy/${courseSlug}/${lessonSlug}`);
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}