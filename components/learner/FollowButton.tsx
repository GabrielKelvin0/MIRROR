"use client";

import { useActionState } from "react";
import {
  followStrategy,
  unfollowStrategy,
  type ActionResult,
} from "@/app/(learner)/following/actions";

type Props = {
  strategyId: string;
  strategyName: string;
  isFollowing: boolean;
};

const initialState: ActionResult = { error: undefined };

export function FollowButton({ strategyId, strategyName, isFollowing }: Props) {
  const action = isFollowing ? unfollowStrategy(strategyId) : followStrategy(strategyId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const cls = isFollowing
    ? "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
    : "bg-emerald-600 text-white hover:bg-emerald-700";

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${cls}`}
      >
        {pending
          ? "Updating…"
          : isFollowing
            ? `Unfollow ${strategyName}`
            : `Follow ${strategyName}`}
      </button>
      {state.error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
