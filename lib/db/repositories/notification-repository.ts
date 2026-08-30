/**
 * MIRROR — Notification repository (server-only).
 *
 * Owns persistence for Notification rows. Notifications are scoped to a user
 * and carry only safe, display-friendly payloads (title, message, kind) plus
 * enough linkage to show and open the originating strategy update — never
 * emails, internal ids of other users, or other sensitive data.
 *
 * Read/unread state is toggled against the authenticated user's own rows only
 * (IDOR protection lives at this boundary).
 */

import "server-only";
import { prisma } from "@/lib/db";
import type { Notification, NotificationType, StrategyUpdate } from "@prisma/client";
import { NotFoundError } from "@/lib/errors";
import { applyReadTransition } from "@/lib/services/following-rules";

/** Safe projection of a notification for display (never exposes sensitive data). */
export type SafeNotification = Pick<
  Notification,
  "id" | "type" | "title" | "message" | "read" | "readAt" | "createdAt" | "strategyUpdateId"
>;

/** A notification joined to its originating strategy update for safe display. */
export type NotificationWithUpdate = SafeNotification & {
  strategyUpdate: Pick<StrategyUpdate, "id" | "title" | "strategyId"> | null;
};

/** A thin, fully-typed record used to create a notification internally. */
export interface NewNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  strategyUpdateId?: string;
}

export class NotificationRepository {
  /** Create a single notification for a user. */
  async create(data: NewNotificationData): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        strategyUpdateId: data.strategyUpdateId ?? null,
      },
    });
  }

  /** Create notifications for many users (e.g. fan-out to followers). */
  async createMany(items: NewNotificationData[]): Promise<void> {
    if (items.length === 0) return;
    await prisma.notification.createMany({
      data: items.map((item) => ({
        userId: item.userId,
        type: item.type,
        title: item.title,
        message: item.message,
        strategyUpdateId: item.strategyUpdateId ?? null,
      })),
    });
  }

  /**
   * List a user's notifications (newest first), joined to the originating
   * strategy update so callers can link back to the update. Only safe fields
   * are selected.
   */
  async listForUser(userId: string): Promise<NotificationWithUpdate[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        strategyUpdate: {
          select: { id: true, title: true, strategyId: true },
        },
      },
    });
  }

  /** Count unread notifications for a user. */
  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  /**
   * Mark a notification read (or unread). The notification must belong to the
   * authenticated user; otherwise it is treated as not found (IDOR protection).
   */
  async setRead(id: string, userId: string, read: boolean): Promise<void> {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) {
      throw new NotFoundError("Notification not found");
    }
    applyReadTransition(notification.read, read);
    const now = new Date();
    await prisma.notification.update({
      where: { id },
      data: { read, readAt: read ? now : null },
    });
  }
}

export const notificationRepository = new NotificationRepository();
