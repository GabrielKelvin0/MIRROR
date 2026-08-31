"use client";

import { useActionState } from "react";
import { addAllocation, deleteAllocation } from "@/app/(creator)/strategies/actions";

type Allocation = {
  id: string;
  assetClass: string;
  targetWeight: number;
  reasoning: string | null;
};

type Props = {
  strategyId: string;
  allocations: Allocation[];
};

const initialState = { error: undefined as string | undefined };

function AddAllocationForm({ strategyId }: { strategyId: string }) {
  const [state, formAction, pending] = useActionState(addAllocation(strategyId), initialState);
  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="assetClass" className="mb-1 block text-xs font-medium text-neutral-700">
            Asset class <span className="text-red-600">*</span>
          </label>
          <input
            id="assetClass"
            name="assetClass"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="e.g. Global Equities"
          />
        </div>
        <div>
          <label htmlFor="targetWeight" className="mb-1 block text-xs font-medium text-neutral-700">
            Weight % <span className="text-red-600">*</span>
          </label>
          <input
            id="targetWeight"
            name="targetWeight"
            type="number"
            min="0"
            max="100"
            step="0.5"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="reasoning" className="mb-1 block text-xs font-medium text-neutral-700">
            Reasoning
          </label>
          <input
            id="reasoning"
            name="reasoning"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {pending ? "Adding…" : "Add allocation"}
          </button>
        </div>
      </form>
      {state.error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

function DeleteAllocationButton({
  strategyId,
  allocationId,
}: {
  strategyId: string;
  allocationId: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteAllocation(strategyId, allocationId),
    initialState
  );
  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="inline-block px-2 py-1 -mx-2 -my-1 text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
      >
        Remove
      </button>
      {state.error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function AllocationManager({ strategyId, allocations }: Props) {
  const total = allocations.reduce((sum, a) => sum + a.targetWeight, 0);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Target allocation</h3>
        <span
          className={`text-sm font-medium tabular-nums ${
            total > 100 ? "text-red-600" : "text-neutral-600"
          }`}
        >
          {total}% of 100%
        </span>
      </div>

      {allocations.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          No allocations yet. Add one below to describe the target portfolio mix.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-100 border border-neutral-200 rounded-lg">
          {allocations.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">{a.assetClass}</p>
                {a.reasoning ? <p className="text-xs text-neutral-500">{a.reasoning}</p> : null}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold tabular-nums text-neutral-800">
                  {a.targetWeight}%
                </span>
                <DeleteAllocationButton strategyId={strategyId} allocationId={a.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddAllocationForm strategyId={strategyId} />
    </div>
  );
}
