import Link from "next/link";
import type { PublishedStrategySummary } from "@/lib/db/repositories/strategy-repository";
import {
  creatorDisplayName,
  formatDisplayDate,
  riskProfileLabel,
} from "@/lib/services/strategy-presentation";

/**
 * Public discovery card for a PUBLISHED, creator-authored strategy.
 *
 * Server-rendered only (used by the public strategies page). Every strategy
 * shown here is already filtered to PUBLISHED at the data boundary
 * (strategyRepository.listPublished).
 */
export function PublishedStrategyCard({ strategy }: { strategy: PublishedStrategySummary }) {
  const creator = strategy.creator;
  const verified = Boolean(creator?.creatorProfile?.isVerified);

  return (
    <Link
      href={"/strategies/" + strategy.id}
      className="flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-emerald-600"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Published
        </span>
        {verified ? (
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Verified creator
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-semibold text-neutral-900">{strategy.name}</h3>
      <p className="mt-1 text-xs text-neutral-500">
        By {creatorDisplayName(creator?.firstName, creator?.lastName)}
      </p>

      {strategy.philosophy ? (
        <p className="mt-3 text-sm text-neutral-600">{strategy.philosophy}</p>
      ) : null}

      <div className="mt-5 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
        <div className="flex items-center justify-between">
          <span className="font-medium text-neutral-700">Risk profile</span>
          <span>{riskProfileLabel(strategy.riskProfile)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-medium text-neutral-700">Time horizon</span>
          <span>{strategy.timeHorizon || "Not set"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-medium text-neutral-700">Published</span>
          <span>{strategy.publishedAt ? formatDisplayDate(strategy.publishedAt) : "—"}</span>
        </div>
      </div>

      <p className="mt-4 rounded-md bg-neutral-50 px-2 py-1 text-xs text-neutral-500">
        Educational strategy — not investment advice
      </p>
    </Link>
  );
}
