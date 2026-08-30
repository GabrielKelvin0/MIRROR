import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { strategyRepository } from "@/lib/db";
import { AppError } from "@/lib/errors";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Preview Strategy · MIRROR Creator",
};

function Section({ title, body }: { title: string; body?: string | null }) {
  if (!body) return null;
  return (
    <section className="border-t border-neutral-100 py-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-neutral-800">{body}</p>
    </section>
  );
}

export default async function PreviewStrategyPage({ params }: Props) {
  const { id } = await params;
  const user = await requireRole("CREATOR");

  let strategy;
  let allocations;
  let updates;
  try {
    strategy = await strategyRepository.getOwned(id, user.id);
    allocations = await strategyRepository.listAllocations(id, user.id);
    updates = await strategyRepository.listUpdates(id, user.id);
  } catch (err) {
    if (err instanceof AppError) {
      return (
        <div className="mx-auto max-w-2xl p-8 text-center">
          <h1 className="text-xl font-semibold text-neutral-900">Preview unavailable</h1>
          <p className="mt-2 text-sm text-neutral-600">{err.message}</p>
          <Link
            href="/creator/dashboard"
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            ← Back to your strategies
          </Link>
        </div>
      );
    }
    throw err;
  }

  const total = allocations.reduce((sum, a) => sum + a.targetWeight, 0);

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <Link
        href={`/creator/dashboard/strategies/${id}/edit`}
        className="text-sm font-medium text-neutral-500 hover:text-neutral-800"
      >
        ← Back to editing
      </Link>

      {strategy.status !== "PUBLISHED" ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This is a preview of your <strong>{strategy.status.toLowerCase()}</strong> strategy. It is
          not visible to the public.
        </div>
      ) : null}

      <article className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
          Strategy blueprint preview
        </span>
        <h1 className="mt-2 text-3xl font-semibold text-neutral-900">{strategy.name}</h1>
        {strategy.philosophy ? (
          <p className="mt-2 text-neutral-600">{strategy.philosophy}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-6 text-sm text-neutral-600">
          <span>
            <span className="font-medium text-neutral-900">Risk:</span>{" "}
            {strategy.riskProfile ?? "—"}
          </span>
          <span>
            <span className="font-medium text-neutral-900">Horizon:</span>{" "}
            {strategy.timeHorizon ?? "—"}
          </span>
        </div>

        <Section title="Objective" body={strategy.objective} />
        <Section title="Description" body={strategy.description} />
        <Section title="Thesis" body={strategy.thesis} />
        <Section title="Decision rules" body={strategy.decisionRules} />
        <Section title="Rebalance policy" body={strategy.rebalancePolicy} />
        <Section title="Exit conditions" body={strategy.exitConditions} />
        <Section title="Invalidating conditions" body={strategy.invalidatingConditions} />

        <section className="border-t border-neutral-100 py-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Target allocation
          </h2>
          {allocations.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">No allocations defined.</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {allocations.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between text-sm text-neutral-700"
                  >
                    <span>{a.assetClass}</span>
                    <span className="tabular-nums font-medium">{a.targetWeight}%</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-neutral-500">
                Total: {total}% — allocations are illustrative and must sum to at most 100%.
              </p>
            </>
          )}
        </section>

        {updates.length > 0 ? (
          <section className="border-t border-neutral-100 py-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Updates
            </h2>
            <ul className="mt-3 space-y-3">
              {updates.map((u) => (
                <li key={u.id} className="text-sm">
                  <p className="font-medium text-neutral-900">{u.title}</p>
                  <p className="text-neutral-600">{u.description}</p>
                  {u.reasoning ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      <strong>Rationale:</strong> {u.reasoning}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>

      <div className="mt-4 text-center">
        <Link
          href={`/creator/dashboard/strategies/${id}/edit`}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Back to editing →
        </Link>
      </div>
    </div>
  );
}
