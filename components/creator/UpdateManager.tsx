"use client";

import { useActionState } from "react";
import { addUpdate } from "@/app/(creator)/strategies/actions";

type Update = {
  id: string;
  title: string;
  description: string;
  changesSummary: string | null;
  reasoning: string | null;
  riskAssessment: string | null;
  effectiveDate: string;
};

type Props = {
  strategyId: string;
  updates: Update[];
};

const initialState = { error: undefined as string | undefined };

export function UpdateManager({ strategyId, updates }: Props) {
  const [state, formAction, pending] = useActionState(addUpdate(strategyId), initialState);

  return (
    <div>
      <h3 className="font-semibold text-neutral-900">Strategy updates</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Publish a decision or change with a clear rationale. Every meaningful update should explain
        why it was made.
      </p>

      <form
        action={formAction}
        className="mt-4 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
      >
        <div>
          <label htmlFor="title" className="mb-1 block text-xs font-medium text-neutral-700">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            id="title"
            name="title"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="e.g. Reduced technology exposure"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-xs font-medium text-neutral-700">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={2}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="changesSummary"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Changes summary
            </label>
            <input
              id="changesSummary"
              name="changesSummary"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              placeholder="e.g. Tech 25% → 15%"
            />
          </div>
          <div>
            <label
              htmlFor="effectiveDate"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Effective date <span className="text-red-600">*</span>
            </label>
            <input
              id="effectiveDate"
              name="effectiveDate"
              type="date"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reasoning" className="mb-1 block text-xs font-medium text-neutral-700">
            Reasoning (rationale)
          </label>
          <textarea
            id="reasoning"
            name="reasoning"
            rows={2}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="riskAssessment"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Risk assessment
          </label>
          <textarea
            id="riskAssessment"
            name="riskAssessment"
            rows={2}
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
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? "Publishing…" : "Publish update"}
        </button>
      </form>

      {updates.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No updates published yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {updates.map((u) => (
            <li key={u.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900">{u.title}</p>
                <span className="text-xs text-neutral-500">
                  {new Date(u.effectiveDate).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-700">{u.description}</p>
              {u.reasoning ? (
                <p className="mt-2 text-xs text-neutral-500">
                  <strong>Rationale:</strong> {u.reasoning}
                </p>
              ) : null}
              {u.riskAssessment ? (
                <p className="mt-1 text-xs text-neutral-500">
                  <strong>Risk:</strong> {u.riskAssessment}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
