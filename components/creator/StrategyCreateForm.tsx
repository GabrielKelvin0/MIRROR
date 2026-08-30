"use client";

import { useActionState } from "react";
import { createStrategy } from "@/app/(creator)/strategies/actions";

const initialState = { error: undefined as string | undefined };

export function StrategyCreateForm() {
  const [state, formAction, pending] = useActionState(createStrategy, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-800">
          Strategy name <span className="text-red-600">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          placeholder="e.g. The Compounder"
        />
      </div>

      <div>
        <label htmlFor="riskProfile" className="mb-1 block text-sm font-medium text-neutral-800">
          Risk profile <span className="text-red-600">*</span>
        </label>
        <select
          id="riskProfile"
          name="riskProfile"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          <option value="LOW">Low</option>
          <option value="MODERATE">Moderate</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      <div>
        <label htmlFor="timeHorizon" className="mb-1 block text-sm font-medium text-neutral-800">
          Time horizon
        </label>
        <input
          id="timeHorizon"
          name="timeHorizon"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          placeholder="e.g. 5–10 years"
        />
      </div>

      <div>
        <label htmlFor="objective" className="mb-1 block text-sm font-medium text-neutral-800">
          Objective
        </label>
        <textarea
          id="objective"
          name="objective"
          rows={3}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      {state.error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create draft"}
      </button>
    </form>
  );
}
