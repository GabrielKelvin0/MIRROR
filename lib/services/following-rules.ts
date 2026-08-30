/**
 * MIRROR — Following & notification business rules (pure, testable).
 *
 * This module contains ONLY pure functions: input validation for follows,
 * "meaningful update" classification (the anti-spam guard that decides when a
 * followed strategy warrants a notification), notification kind resolution, and
 * read/unread state transitions.
 *
 * It has no database or I/O dependency, so it can be unit-tested in isolation
 * (see following-rules.test.ts).
 *
 * Server-side authorization and ownership are enforced in the repositories and
 * server actions, not here. These functions validate shape, not identity.
 */

import type { NotificationType, Strategy, StrategyUpdate } from "@prisma/client";
import { ValidationError, BusinessRuleError } from "@/lib/errors";

/** Input for following/unfollowing a strategy. */
export interface FollowInput {
  strategyId?: string;
}

/** Normalized (validated) follow input. */
export interface NormalizedFollowInput {
  strategyId: string;
}

/** All notification types the application may emit for strategy following. */
export const NOTIFICATION_KINDS: NotificationType[] = [
  "STRATEGY_UPDATE",
  "ACCOUNT_UPDATE",
  "LEARNING_MILESTONE",
  "SYSTEM",
];

/** The one kind used for followed-strategy updates. */
export const FOLLOW_UPDATE_KIND: NotificationType = "STRATEGY_UPDATE";

function isNonEmpty(value: string | null | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

/** Validate and normalize a FollowInput. */
export function validateFollowInput(input: FollowInput): NormalizedFollowInput {
  const strategyId = input.strategyId?.trim();
  if (!strategyId) {
    throw new ValidationError("Strategy is required", { strategyId: "required" });
  }
  return { strategyId };
}

/**
 * Anti-spam guard: should a notification be created for this update?
 *
 * A notification is only warranted when:
 *   - the strategy is PUBLISHED (never notify for drafts or archived content), and
 *   - the update carries meaningful content (a title AND a description), so we do
 *     not spam followers with empty or placeholder entries.
 *
 * This is the single gate that prevents spammy notification behavior. Returning
 * false means no notification is fanned out to followers.
 */
export function shouldNotifyForUpdate(
  strategy: Pick<Strategy, "status">,
  update: Pick<StrategyUpdate, "title" | "description">
): boolean {
  const published = strategy.status === "PUBLISHED";
  const meaningful = isNonEmpty(update.title) && isNonEmpty(update.description);
  return published && meaningful;
}

/**
 * Build the user-facing (safe) notification payload for a strategy update.
 *
 * The message only ever contains non-sensitive, display-friendly summary text.
 * It never includes internal ids, emails, or other sensitive data.
 */
export function buildUpdateNotification(
  strategyName: string,
  update: Pick<StrategyUpdate, "title" | "description">,
  kind: NotificationType = FOLLOW_UPDATE_KIND
): { kind: NotificationType; title: string; message: string } {
  if (!isNonEmpty(strategyName)) {
    throw new ValidationError("Strategy name is required", { strategy: "required" });
  }
  if (!isNonEmpty(update.title) || !isNonEmpty(update.description)) {
    throw new ValidationError("Only meaningful updates can produce a notification", {
      update: "notMeaningful",
    });
  }
  const title = `${strategyName} published an update`;
  const message = update.title;
  return { kind, title, message };
}

/** Allowed read-state transitions for a Notification (read/unread toggle). */
export const ALLOWED_READ_TRANSITIONS: Record<"false" | "true", boolean[]> = {
  false: [true], // unread -> read
  true: [false], // read -> unread (allow mark-as-unread)
};

/** The next read-state value after applying a transition, or throws. */
export function applyReadTransition(current: boolean, next: boolean): boolean {
  const allowed = ALLOWED_READ_TRANSITIONS[String(current) as "false" | "true"] ?? [];
  if (!allowed.includes(next)) {
    throw new BusinessRuleError(`Cannot change notification read state to the same value`);
  }
  return next;
}
