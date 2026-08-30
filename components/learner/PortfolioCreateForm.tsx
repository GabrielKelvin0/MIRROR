"use client";

import { useActionState } from "react";
import { createPortfolio, type ActionResult } from "@/app/(learner)/portfolio/actions";

const initialState: ActionResult = { error: undefined };

export function PortfolioCreateForm() {
  const [state, formAction, pending] = useActionState(createPortfolio(), initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="portfolio-name" className="block text-sm font-medium text-neutral-700">
          Portfolio name
        </label>
        <input
          id="portfolio-name"
          name="name"
          required
          placeholder="e.g. My balanced growth plan"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="portfolio-description"
          className="block text-sm font-medium text-neutral-700"
        >
          Description (optional)
        </label>
        <textarea
          id="portfolio-description"
          name="description"
          rows={2}
          placeholder="What are you trying to learn with this paper portfolio?"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="portfolio-capital" className="block text-sm font-medium text-neutral-700">
          Simulated starting capital (USD)
        </label>
        <input
          id="portfolio-capital"
          name="startingCapital"
          type="number"
          min="1"
          step="any"
          required
          placeholder="10000"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Hypothetical only — you do not invest any real money.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create paper portfolio"}
      </button>

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
