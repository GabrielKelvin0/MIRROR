"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  addStrategy,
  removeStrategy,
  type ActionResult,
} from "@/app/(learner)/learner/portfolio/actions";

type AllocationEntry = {
  id: string;
  strategyId: string;
  name: string;
  riskProfile: string;
  allocationPercentage: number;
  plannedAmount: number;
  status: string;
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
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function AllocationRow({
  portfolioId,
  allocation,
}: {
  portfolioId: string;
  allocation: AllocationEntry;
}) {
  const [state, formAction, pending] = useActionState(
    removeStrategy.bind(null, portfolioId, allocation.strategyId),
    initialState
  );

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words font-medium text-neutral-900">
            {allocation.status === "PUBLISHED" ? (
              <Link
                href={`/strategies/${allocation.strategyId}`}
                className="underline underline-offset-4 hover:text-emerald-800"
              >
                {allocation.name}
              </Link>
            ) : (
              allocation.name
            )}
          </p>
          <p className="text-sm text-neutral-500">{allocation.riskProfile}</p>
          {allocation.status !== "PUBLISHED" ? (
            <p className="text-xs text-neutral-600">
              Unpublished · allocation can be reduced or removed
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <span className="font-semibold text-neutral-900">
            {allocation.allocationPercentage}% target
          </span>
          <p className="text-sm text-neutral-600">
            {currency.format(allocation.plannedAmount)} planned capital
          </p>
        </div>
      </div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer py-2 text-neutral-600 hover:text-neutral-900">
          Remove allocation
        </summary>
        <form action={formAction}>
          <label
            htmlFor={`remove-reason-${allocation.id}`}
            className="block text-sm text-neutral-700"
          >
            Explanation (optional)
          </label>
          <input
            id={`remove-reason-${allocation.id}`}
            name="reasoning"
            maxLength={5000}
            disabled={pending}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {pending ? "Removing…" : `Remove ${allocation.name}`}
          </button>
          {state.error ? (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {state.error}
            </p>
          ) : null}
        </form>
      </details>
    </li>
  );
}

export function PortfolioAllocationManager({
  portfolioId,
  allocations,
  availableStrategies,
}: Props) {
  const [state, formAction, pending] = useActionState(
    addStrategy.bind(null, portfolioId),
    initialState
  );

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
            <div className="w-full">
              <label
                htmlFor="allocation-reasoning"
                className="block text-sm font-medium text-neutral-700"
              >
                Why add this allocation? (optional)
              </label>
              <textarea
                id="allocation-reasoning"
                name="reasoning"
                maxLength={5000}
                rows={2}
                disabled={pending}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
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
