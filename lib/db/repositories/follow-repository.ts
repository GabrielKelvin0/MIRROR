/**
 * MIRROR — Follow repository (server-only).
 *
 * Owns persistence for Follow rows and fan-out of notifications whenever a
 * followed strategy publishes a meaningful update.
 *
 * Follows are scoped to the authenticated user. Every operation verifies that
 * the target strategy exists and is PUBLISHED before a learner may follow it
 * (you cannot follow a draft or archived strategy). Unfollow verifies the
 * follow belongs to the caller before deleting it (IDOR protection).
 *
 * Notification fan-out is gated by the pure anti-spam rule
 * `shouldNotifyForUpdate` so followers are not spammed by blank or placeholder
 * updates.
 */

import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import {
  shouldNotifyForUpdate,
  buildUpdateNotification,
  type NormalizedFollowInput,
} from "@/lib/services/following-rules";
import { notificationRepository } from "./notification-repository";

/**
 * Resolve a followable (published) strategy by id, returning its name for
 * notification messages, and throwing if it does not exist or is unpublished.
 */
async function publishedStrategy(strategyId: string) {
  const strategy = await prisma.strategy.findFirst({
    where: { id: strategyId, status: "PUBLISHED" },
    select: { id: true, name: true, status: true },
  });
  if (!strategy) {
    throw new NotFoundError("Strategy not found");
  }
  return strategy;
}

export class FollowRepository {
  /** Follow a published strategy. Idempotent: returns the existing follow if present. */
  async follow(userId: string, input: NormalizedFollowInput): Promise<void> {
    const { strategyId } = input;
    await publishedStrategy(strategyId);

    const existing = await prisma.follow.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
    });
    if (existing) {
      return;
    }

    await prisma.follow.create({ data: { userId, strategyId } });
  }

  /** Unfollow a strategy, verifying the follow belongs to the caller. */
  async unfollow(userId: string, strategyId: string): Promise<void> {
    const follow = await prisma.follow.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
    });
    if (!follow) {
      throw new NotFoundError("You are not following this strategy");
    }
    await prisma.follow.delete({ where: { id: follow.id } });
  }

  /** List strategies the user follows (newest first). */
  async listFollowed(userId: string) {
    return prisma.follow.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        strategy: {
          select: { id: true, name: true, riskProfile: true, timeHorizon: true },
        },
      },
    });
  }

  /** Whether a user currently follows a strategy. */
  async isFollowing(userId: string, strategyId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
      select: { id: true },
    });
    return follow != null;
  }

  /**
   * Fan out notifications to all followers of a strategy after a meaningful
   * update. This is a no-op when the anti-spam gate `shouldNotifyForUpdate` is
   * false (drafts, archived strategies, or blank/placeholder updates).
   */
  async notifyFollowersOfUpdate(
    strategyId: string,
    update: { id: string; title: string; description: string }
  ): Promise<void> {
    const strategy = await prisma.strategy.findFirst({
      where: { id: strategyId },
      select: { id: true, name: true, status: true },
    });
    if (!strategy) {
      throw new NotFoundError("Strategy not found");
    }
    if (!shouldNotifyForUpdate(strategy, update)) {
      return;
    }

    const followers = await prisma.follow.findMany({
      where: { strategyId },
      select: { userId: true },
    });
    if (followers.length === 0) {
      return;
    }

    const payload = buildUpdateNotification(strategy.name, update);
    await notificationRepository.createMany(
      followers.map((follower) => ({
        userId: follower.userId,
        type: payload.kind,
        title: payload.title,
        message: payload.message,
        strategyUpdateId: update.id,
      }))
    );
  }
}

export const followRepository = new FollowRepository();
