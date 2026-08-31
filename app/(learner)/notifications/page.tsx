import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { notificationRepository } from "@/lib/db";
import { MarkReadButton } from "@/components/learner/MarkReadButton";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Updates about the strategies you follow.",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function NotificationsPage() {
  const user = await requireRole("LEARNER");
  const [notifications, unreadCount] = await Promise.all([
    notificationRepository.listForUser(user.id),
    notificationRepository.countUnread(user.id),
  ]);

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Notifications</h1>
        <p className="mt-2 text-neutral-600">
          Updates from the strategies you follow. {unreadCount} unread.
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center">
          <h2 className="text-lg font-semibold text-neutral-800">No notifications yet</h2>
          <p className="mt-2 text-sm text-neutral-600">
            You will see a notification here when a strategy you follow publishes a meaningful
            update.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {notifications.map((notification) => {
            const unread = !notification.read;
            return (
              <li
                key={notification.id}
                className={`flex items-start justify-between gap-4 p-4 ${
                  unread ? "bg-amber-50/40" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                        unread ? "bg-amber-500" : "bg-neutral-300"
                      }`}
                      aria-hidden
                    />
                    <p className="font-medium text-neutral-900">{notification.title}</p>
                    {notification.strategyUpdate ? (
                      <span className="text-xs text-neutral-500">
                        {formatDate(notification.createdAt)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{notification.message}</p>
                  <p className="mt-1 text-xs text-neutral-500">{unread ? "Unread" : "Read"}</p>
                </div>
                <MarkReadButton notificationId={notification.id} unread={unread} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
