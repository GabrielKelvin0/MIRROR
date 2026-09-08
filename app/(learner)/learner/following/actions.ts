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
 * Next.js 15 requires every exported server action to be an async function;
 * row ids arrive as bound arguments from the client component.
 */

export type ActionResult = { error: string | undefined };

async function getLearnerId(): Promise<string> {
  const user = await requireRole("LEARNER");
  return user.id;
}

/** Follow a published strategy (idempotent). */
export async function followStrategy(
  strategyId: string,
  _prev: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  const userId = await getLearnerId();
  try {
    await followRepository.follow(userId, validateFollowInput({ strategyId }));
    revalidatePath("/learner/following");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Unfollow a strategy (scoped to the caller's own follow). */
export async function unfollowStrategy(
  strategyId: string,
  _prev: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  const userId = await getLearnerId();
  try {
    await followRepository.unfollow(userId, strategyId);
    revalidatePath("/learner/following");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Mark the caller's notification as read. */
export async function markNotificationRead(
  notificationId: string,
  _prev: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  const userId = await getLearnerId();
  try {
    await notificationRepository.setRead(notificationId, userId, true);
    revalidatePath("/learner/notifications");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

function messageOf(err: unknown): string {
  return safeErrorMessage(err);
}
