"use client";

import { useActionState } from "react";
import { addStrategy, removeStrategy, type ActionResult } from "@/app/(learner)/portfolio/actions";

type AllocationEntry = {
  id: string;
  strategyId: string;
  name: string;
  riskProfile: string;
  allocationPercentage: number;
};

type AvailableStrategy = {
  id: string;
  name: string;
  riskProfile: string;
};

type Props = {
  portfolioId: string;
  allocations: AllocationEntry[];
  availableStrategies: AvailableStrategy[];
};

const initialState: ActionResult = { error: undefined };

function AllocationRow({
  portfolioId,
  allocation,
}: {
  portfolioId: string;
  allocation: AllocationEntry;
}) {
  const [state, formAction, pending] = useActionState(
    removeStrategy(portfolioId, allocation.strategyId),
    initialState
  );

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-medium text-neutral-900">{allocation.name}</p>
        <p className="text-sm text-neutral-500">{allocation.riskProfile}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-semibold text-neutral-900">
          {allocation.allocationPercentage.toFixed(0)}%
        </span>
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {pending ? "Removing…" : "Remove"}
          </button>
          {state.error ? (
            <span className="sr-only" role="alert">
              {state.error}
            </span>
          ) : null}
        </form>
      </div>
    </li>
  );
}

export function PortfolioAllocationManager({
  portfolioId,
  allocations,
  availableStrategies,
}: Props) {
  const [state, formAction, pending] = useActionState(addStrategy(portfolioId), initialState);

  return (
    <div className="space-y-6">
      <div>
        {allocations.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No strategies allocated yet. Add one below to define your hypothetical mix.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {allocations.map((allocation) => (
              <AllocationRow
                key={allocation.id}
                portfolioId={portfolioId}
                allocation={allocation}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-neutral-100 pt-6">
        <h3 className="text-sm font-semibold text-neutral-900">Add a strategy allocation</h3>
        {availableStrategies.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">
            No more published strategies to allocate.{" "}
            {allocations.length === 0
              ? "There are no published strategies available yet."
              : "You have allocated every published strategy."}
          </p>
        ) : (
          <form action={formAction} className="mt-3 flex flex-wrap items-end gap-4">
            <div className="min-w-48 flex-1">
              <label
                htmlFor="strategy-select"
                className="block text-sm font-medium text-neutral-700"
              >
                Strategy
              </label>
              <select
                id="strategy-select"
                name="strategyId"
                required
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                {availableStrategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name} ({strategy.riskProfile})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label
                htmlFor="allocation-percentage"
                className="block text-sm font-medium text-neutral-700"
              >
                Allocation %
              </label>
              <input
                id="allocation-percentage"
                name="allocationPercentage"
                type="number"
                min="0"
                max="100"
                step="any"
                required
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? "Adding…" : "Add allocation"}
            </button>
            {state.error ? (
              <p className="w-full text-sm text-red-600" role="alert">
                {state.error}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
