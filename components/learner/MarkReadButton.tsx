"use client";

import { useActionState } from "react";
import { markNotificationRead, type ActionResult } from "@/app/(learner)/following/actions";

type Props = {
  notificationId: string;
  unread: boolean;
};

const initialState: ActionResult = { error: undefined };

export function MarkReadButton({ notificationId, unread }: Props) {
  const [state, formAction, pending] = useActionState(
    markNotificationRead(notificationId),
    initialState
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="inline-block px-2 py-1 -mx-2 -my-1 text-xs font-medium text-emerald-700 hover:underline disabled:opacity-50"
      >
        {pending ? "Updating…" : unread ? "Mark as read" : "Mark as unread"}
      </button>
      {state.error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
