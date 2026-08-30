"use client";

import { useActionState } from "react";
import { deletePortfolio, type ActionResult } from "@/app/(learner)/portfolio/actions";

type Props = {
  portfolioId: string;
};

const initialState: ActionResult = { error: undefined };

export function PortfolioDeleteButton({ portfolioId }: Props) {
  const [state, formAction, pending] = useActionState(deletePortfolio(portfolioId), initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Delete this paper portfolio?")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete portfolio"}
      </button>
      {state.error ? (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
