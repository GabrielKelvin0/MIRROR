"use client";

import { useActionState } from "react";
import {
  addDecision,
  addUpdate,
} from "@/app/(creator)/creator/strategies/actions";

type Allocation = {
  id: string;
  assetClass: string;
  targetWeight: number;
};

type AllocationDelta = {
  id: string;
  assetClass: string;
  beforePercentage: number | null;
  afterPercentage: number | null;
};

type Update = {
  id: string;
  kind: "UPDATE" | "DECISION";
  title: string;
  description: string;
  changesSummary: string | null;
  reasoning: string | null;
  riskAssessment: string | null;
  evidence: string | null;
  assumptionChanges: string | null;
  effectiveDate: string;
  allocationDeltas: AllocationDelta[];
};

type Props = {
  strategyId: string;
  strategyStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  allocations: Allocation[];
  updates: Update[];
};

const initialState = { error: undefined as string | undefined };

function DeltaValue({ value, empty }: { value: number | null; empty: string }) {
  return (
    <span className="tabular-nums font-medium text-neutral-800">
      {value === null ? empty : `${value}%`}
    </span>
  );
}

export function UpdateManager({
  strategyId,
  strategyStatus,
  allocations,
  updates,
}: Props) {
  const [decisionState, decisionAction, decisionPending] = useActionState(
    addDecision.bind(null, strategyId),
    initialState
  );
  const [updateState, updateAction, updatePending] = useActionState(
    addUpdate.bind(null, strategyId),
    initialState
  );

  return (
    <div>
      <h3 className="font-semibold text-neutral-900">Decision history</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Record what changed, why it changed, the evidence behind it, and the risk implications.
        Published decisions become part of the strategy&apos;s transparent history.
      </p>

      {strategyStatus === "PUBLISHED" ? (
        <form
          action={decisionAction}
          className="mt-4 space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4"
        >
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">Record decision</h4>
            <p className="mt-1 text-xs text-neutral-600">
              Decisions are append-only historical records. If you need to correct one later,
              publish a new decision explaining the correction.
            </p>
          </div>

          <div>
            <label htmlFor="decision-title" className="mb-1 block text-xs font-medium text-neutral-700">
              Decision title <span className="text-red-600">*</span>
            </label>
            <input
              id="decision-title"
              name="title"
              required
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="e.g. Reduced technology concentration"
            />
          </div>

          <div>
            <label
              htmlFor="decision-changes"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              What changed? <span className="text-red-600">*</span>
            </label>
            <textarea
              id="decision-changes"
              name="changesSummary"
              required
              rows={2}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="Describe the actual strategy change."
            />
          </div>

          <div>
            <label
              htmlFor="decision-reasoning"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Why did it change? <span className="text-red-600">*</span>
            </label>
            <textarea
              id="decision-reasoning"
              name="reasoning"
              required
              rows={3}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="Explain the reasoning behind the decision."
            />
          </div>

          <div>
            <label
              htmlFor="decision-evidence"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Evidence / supporting reasoning <span className="text-red-600">*</span>
            </label>
            <textarea
              id="decision-evidence"
              name="evidence"
              required
              rows={3}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="What facts, observations, or analysis supported the change?"
            />
          </div>

          <div>
            <label
              htmlFor="decision-risk"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Risk implications <span className="text-red-600">*</span>
            </label>
            <textarea
              id="decision-risk"
              name="riskAssessment"
              required
              rows={3}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="How does this decision change the strategy's risks or trade-offs?"
            />
          </div>

          <div>
            <label
              htmlFor="decision-assumptions"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Assumption changes
            </label>
            <textarea
              id="decision-assumptions"
              name="assumptionChanges"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="Optional: note any thesis or assumption that changed."
            />
          </div>

          <div>
            <label
              htmlFor="decision-effective-date"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Effective date <span className="text-red-600">*</span>
            </label>
            <input
              id="decision-effective-date"
              name="effectiveDate"
              type="date"
              required
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm sm:max-w-xs"
            />
          </div>

          <fieldset className="rounded-lg border border-neutral-200 bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-neutral-900">
              Allocation changes (optional)
            </legend>
            <p className="mt-1 text-xs text-neutral-500">
              MIRROR derives the previous weight from the database when you publish. Leave a new
              target blank when an allocation is unchanged. Additions are still managed in the
              allocation editor above and are not represented as historical deltas in this phase.
            </p>

            {allocations.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No current allocations to change.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {allocations.map((allocation) => (
                  <div
                    key={allocation.id}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-neutral-100 p-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{allocation.assetClass}</p>
                      <p className="text-xs text-neutral-500">
                        Current target: {allocation.targetWeight}%
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor={`allocation-after-${allocation.id}`}
                        className="mb-1 block text-xs font-medium text-neutral-700"
                      >
                        New target %
                      </label>
                      <input
                        id={`allocation-after-${allocation.id}`}
                        name={`allocationAfter:${allocation.id}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        inputMode="decimal"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                        placeholder="Unchanged"
                      />
                    </div>
                    <label className="flex min-h-10 items-center gap-2 text-xs font-medium text-neutral-700">
                      <input
                        name={`allocationRemove:${allocation.id}`}
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-300"
                      />
                      Remove
                    </label>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {decisionState.error ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {decisionState.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={decisionPending}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {decisionPending ? "Publishing decision…" : "Publish decision"}
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          Structured decisions are available after this strategy is published. Drafts can still use
          simple updates below while the blueprint is being prepared.
        </div>
      )}

      <details className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-700">
          Publish a simple update
        </summary>
        <p className="mt-2 text-xs text-neutral-500">
          Use this for a general note that does not need the full structured decision record.
        </p>
        <form action={updateAction} className="mt-4 space-y-3">
          <div>
            <label htmlFor="update-title" className="mb-1 block text-xs font-medium text-neutral-700">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              id="update-title"
              name="title"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="update-description"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              id="update-description"
              name="description"
              required
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="update-changes"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Changes summary
              </label>
              <input
                id="update-changes"
                name="changesSummary"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="update-effective-date"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Effective date <span className="text-red-600">*</span>
              </label>
              <input
                id="update-effective-date"
                name="effectiveDate"
                type="date"
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="update-reasoning"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Reasoning
            </label>
            <textarea
              id="update-reasoning"
              name="reasoning"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="update-risk"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Risk assessment
            </label>
            <textarea
              id="update-risk"
              name="riskAssessment"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          {updateState.error ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {updateState.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={updatePending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {updatePending ? "Publishing…" : "Publish update"}
          </button>
        </form>
      </details>

      {updates.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-500">No decisions or updates published yet.</p>
      ) : (
        <ol className="mt-5 space-y-4">
          {updates.map((u) => (
            <li key={u.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{u.title}</p>
                  <span
                    className={
                      u.kind === "DECISION"
                        ? "rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700"
                        : "rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600"
                    }
                  >
                    {u.kind === "DECISION" ? "Decision" : "Update"}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {new Date(u.effectiveDate).toLocaleDateString()}
                </span>
              </div>

              {u.kind === "UPDATE" ? (
                <p className="mt-1 text-sm text-neutral-700">{u.description}</p>
              ) : null}

              {u.changesSummary ? (
                <p className="mt-2 text-xs text-neutral-600">
                  <strong>What changed:</strong> {u.changesSummary}
                </p>
              ) : null}
              {u.reasoning ? (
                <p className="mt-1 text-xs text-neutral-600">
                  <strong>Why:</strong> {u.reasoning}
                </p>
              ) : null}
              {u.evidence ? (
                <p className="mt-1 text-xs text-neutral-600">
                  <strong>Evidence:</strong> {u.evidence}
                </p>
              ) : null}
              {u.riskAssessment ? (
                <p className="mt-1 text-xs text-neutral-600">
                  <strong>Risk:</strong> {u.riskAssessment}
                </p>
              ) : null}
              {u.assumptionChanges ? (
                <p className="mt-1 text-xs text-neutral-600">
                  <strong>Assumptions:</strong> {u.assumptionChanges}
                </p>
              ) : null}

              {u.allocationDeltas.length > 0 ? (
                <div className="mt-3 rounded-lg bg-neutral-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Allocation changes
                  </p>
                  <ul className="mt-2 space-y-2">
                    {u.allocationDeltas.map((delta) => (
                      <li
                        key={delta.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-700"
                      >
                        <span className="font-medium">{delta.assetClass}</span>
                        <span className="flex items-center gap-1">
                          <DeltaValue value={delta.beforePercentage} empty="New" />
                          <span aria-hidden="true">→</span>
                          <DeltaValue value={delta.afterPercentage} empty="Removed" />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
