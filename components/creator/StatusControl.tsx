"use client";

import { useActionState } from "react";
import { changeStatus, type ActionResult } from "@/app/(creator)/strategies/actions";
import type { StrategyStatus } from "@prisma/client";

type Props = {
  strategyId: string;
  status: StrategyStatus;
};

const initialState: ActionResult = { error: undefined };

function StatusButton({
  action,
  children,
  tone,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  tone: "publish" | "archive";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const cls =
    tone === "publish"
      ? "border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
      : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50";
  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${cls}`}
      >
        {children}
      </button>
      {state.error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function StatusControl({ strategyId, status }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {status === "DRAFT" ? (
        <StatusButton action={changeStatus(strategyId, "PUBLISHED")} tone="publish">
          Publish
        </StatusButton>
      ) : null}
      {status !== "ARCHIVED" ? (
        <StatusButton action={changeStatus(strategyId, "ARCHIVED")} tone="archive">
          Archive
        </StatusButton>
      ) : null}
      {status === "PUBLISHED" ? (
        <span className="text-xs text-neutral-500">This strategy is public.</span>
      ) : null}
    </div>
  );
}
