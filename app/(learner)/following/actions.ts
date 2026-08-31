"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { followRepository, notificationRepository } from "@/lib/db";
import { safeErrorMessage } from "@/lib/errors";
import { validateFollowInput } from "@/lib/services/following-rules";

/**
 * Learner following & notification actions.
 *
 * Every action requires the LEARNER role (server-side, via requireRole), which
 * resolves the local database user. Follows and notifications are scoped to
 * that resolved user id — never to client-supplied identity.
 *
 * These are server-only mutations; there are no client sends of ids from
 * unauthenticated sources.
 */

export type ActionResult = { error: string | undefined };

async function getLearnerId(): Promise<string> {
  const user = await requireRole("LEARNER");
  return user.id;
}

/** Follow a published strategy (idempotent). */
export function followStrategy(
  strategyId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, _formData: FormData): Promise<ActionResult> => {
    const userId = await getLearnerId();
    try {
      await followRepository.follow(userId, validateFollowInput({ strategyId }));
      revalidatePath("/learner/following");
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

/** Unfollow a strategy (scoped to the caller's own follow). */
export function unfollowStrategy(
  strategyId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, _formData: FormData): Promise<ActionResult> => {
    const userId = await getLearnerId();
    try {
      await followRepository.unfollow(userId, strategyId);
      revalidatePath("/learner/following");
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

/** Mark the caller's notification as read. */
export function markNotificationRead(
  notificationId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, _formData: FormData): Promise<ActionResult> => {
    const userId = await getLearnerId();
    try {
      await notificationRepository.setRead(notificationId, userId, true);
      revalidatePath("/learner/notifications");
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

function messageOf(err: unknown): string {
  return safeErrorMessage(err);
}
