"use client";

import { useActionState } from "react";
import { updateStrategy } from "@/app/(creator)/strategies/actions";

type Props = {
  strategyId: string;
  initial: {
    name: string;
    description: string | null;
    philosophy: string | null;
    objective: string | null;
    riskProfile: string | null;
    timeHorizon: string | null;
    thesis: string | null;
    decisionRules: string | null;
    rebalancePolicy: string | null;
    exitConditions: string | null;
    invalidatingConditions: string | null;
  };
};

const initialState = { error: undefined as string | undefined };

export function StrategyEditForm({ strategyId, initial }: Props) {
  const [state, formAction, pending] = useActionState(updateStrategy(strategyId), initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-800">
            Strategy name <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={initial.name}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="riskProfile" className="mb-1 block text-sm font-medium text-neutral-800">
            Risk profile <span className="text-red-600">*</span>
          </label>
          <select
            id="riskProfile"
            name="riskProfile"
            defaultValue={initial.riskProfile ?? ""}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            <option value="LOW">Low</option>
            <option value="MODERATE">Moderate</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="philosophy" className="mb-1 block text-sm font-medium text-neutral-800">
            Philosophy
          </label>
          <input
            id="philosophy"
            name="philosophy"
            defaultValue={initial.philosophy ?? ""}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="timeHorizon" className="mb-1 block text-sm font-medium text-neutral-800">
            Time horizon
          </label>
          <input
            id="timeHorizon"
            name="timeHorizon"
            defaultValue={initial.timeHorizon ?? ""}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="objective" className="mb-1 block text-sm font-medium text-neutral-800">
          Objective
        </label>
        <textarea
          id="objective"
          name="objective"
          rows={3}
          defaultValue={initial.objective ?? ""}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-800">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial.description ?? ""}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="thesis" className="mb-1 block text-sm font-medium text-neutral-800">
          Thesis
        </label>
        <textarea
          id="thesis"
          name="thesis"
          rows={3}
          defaultValue={initial.thesis ?? ""}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="decisionRules" className="mb-1 block text-sm font-medium text-neutral-800">
          Decision rules
        </label>
        <textarea
          id="decisionRules"
          name="decisionRules"
          rows={3}
          defaultValue={initial.decisionRules ?? ""}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="rebalancePolicy"
          className="mb-1 block text-sm font-medium text-neutral-800"
        >
          Rebalance policy
        </label>
        <textarea
          id="rebalancePolicy"
          name="rebalancePolicy"
          rows={2}
          defaultValue={initial.rebalancePolicy ?? ""}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="exitConditions" className="mb-1 block text-sm font-medium text-neutral-800">
          Exit / invalidating conditions
        </label>
        <textarea
          id="exitConditions"
          name="exitConditions"
          rows={2}
          defaultValue={initial.exitConditions ?? ""}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="invalidatingConditions"
          className="mb-1 block text-sm font-medium text-neutral-800"
        >
          Invalidating conditions
        </label>
        <textarea
          id="invalidatingConditions"
          name="invalidatingConditions"
          rows={2}
          defaultValue={initial.invalidatingConditions ?? ""}
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
