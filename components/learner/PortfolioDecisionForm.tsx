"use client";

import { useActionState } from "react";
import { recordDecision, type ActionResult } from "@/app/(learner)/portfolio/actions";

type Props = {
  portfolioId: string;
};

const initialState: ActionResult = { error: undefined };

export function PortfolioDecisionForm({ portfolioId }: Props) {
  const [state, formAction, pending] = useActionState(recordDecision(portfolioId), initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="decision-summary" className="block text-sm font-medium text-neutral-700">
          What did you decide?
        </label>
        <input
          id="decision-summary"
          name="summary"
          required
          placeholder="e.g. Rebalanced 10% from growth to conservative"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="decision-description"
          className="block text-sm font-medium text-neutral-700"
        >
          Notes (optional)
        </label>
        <textarea
          id="decision-description"
          name="description"
          rows={2}
          placeholder="Why did you make this decision?"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Recording…" : "Record decision"}
      </button>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
