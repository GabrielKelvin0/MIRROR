"use client";

import { useActionState, useState } from "react";
import { rebalancePortfolio, type ActionResult } from "@/app/(learner)/learner/portfolio/actions";

type Props = {
  portfolioId: string;
  allocations: Array<{
    id: string;
    strategyId: string;
    name: string;
    status: string;
    allocationPercentage: number;
  }>;
};

const initialState: ActionResult = { error: undefined };

export function PortfolioRebalanceForm({ portfolioId, allocations }: Props) {
  const [state, formAction, pending] = useActionState(
    rebalancePortfolio.bind(null, portfolioId),
    initialState
  );
  const [weights, setWeights] = useState(() =>
    allocations.map((a) => String(a.allocationPercentage))
  );
  const [reasoning, setReasoning] = useState("");
  const parsed = weights.map((value) => (value.trim() ? Number(value) : Number.NaN));
  const valid = parsed.every((value) => Number.isFinite(value) && value >= 0 && value <= 100);
  const total = Math.round(parsed.reduce((sum, value) => sum + value, 0) * 1e10) / 1e10;
  const changed = parsed.some((value, index) => value !== allocations[index]?.allocationPercentage);
  const withinLimit = valid && total <= 100;

  if (allocations.length === 0) return null;
  if (allocations.length > 100) {
    return (
      <p className="text-sm text-neutral-600">
        Rebalance supports up to 100 strategies at once. Remove excess allocations first.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4 border-t border-neutral-200 pt-6">
      <div>
        <h3 className="font-semibold text-neutral-900">Explain a simulated rebalance</h3>
        <p id="rebalance-help" className="mt-1 text-sm text-neutral-600">
          Change the target mix and record why. This updates your allocation plan; it does not buy,
          sell, or change individual paper holdings. Unallocated capital stays in the planned
          reserve.
        </p>
      </div>
      <fieldset disabled={pending} aria-describedby="rebalance-help" className="space-y-3">
        <legend className="sr-only">New target allocations</legend>
        {allocations.map((allocation, index) => (
          <div
            key={allocation.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-neutral-50 p-3"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`rebalance-${allocation.id}`}
                className="block break-words text-sm font-medium text-neutral-900"
              >
                {allocation.name} — new target %
              </label>
              <p className="text-xs text-neutral-600">
                Current: {allocation.allocationPercentage}%
                {allocation.status !== "PUBLISHED" ? " · Unpublished; reduce or remove only" : ""}
              </p>
            </div>
            <input type="hidden" name="strategyId" value={allocation.strategyId} />
            <input
              type="hidden"
              name="expectedPercentage"
              value={allocation.allocationPercentage}
            />
            <input
              id={`rebalance-${allocation.id}`}
              name="allocationPercentage"
              type="number"
              min="0"
              max={allocation.status === "PUBLISHED" ? 100 : allocation.allocationPercentage}
              step="any"
              required
              value={weights[index] ?? ""}
              onChange={(event) => {
                const nextValue = event.target.value;
                setWeights((current) =>
                  current.map((value, row) => (row === index ? nextValue : value))
                );
              }}
              className="w-28 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
          </div>
        ))}
        <div>
          <label
            htmlFor="rebalance-reasoning"
            className="block text-sm font-medium text-neutral-700"
          >
            Why change the mix?
          </label>
          <textarea
            id="rebalance-reasoning"
            name="reasoning"
            required
            maxLength={5000}
            rows={3}
            value={reasoning}
            onChange={(event) => setReasoning(event.target.value)}
            placeholder="Record your reasoning and the risks you considered."
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </fieldset>
      <p
        aria-live="polite"
        className={`text-sm ${withinLimit ? "text-neutral-700" : "text-red-700"}`}
      >
        {valid
          ? `${total}% target allocation · ${Math.max(0, Math.round((100 - total) * 1e10) / 1e10)}% planned reserve`
          : "Enter a percentage between 0 and 100 for every strategy."}
        {valid && !withinLimit ? " — total cannot exceed 100%." : ""}
      </p>
      <button
        type="submit"
        disabled={pending || !withinLimit || !changed || !reasoning.trim()}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? "Recording rebalance…" : "Record simulated rebalance"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
