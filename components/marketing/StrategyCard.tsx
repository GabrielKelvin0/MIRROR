import Link from "next/link";
import type { StrategyBlueprintData } from "@/lib/data/strategies";

function RiskBadge({ profile }: { profile: string }) {
  const tone =
    profile === "Conservative"
      ? "bg-amber-50 text-amber-800"
      : profile === "Aggressive"
        ? "bg-red-50 text-red-800"
        : "bg-neutral-100 text-neutral-700";
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>{profile}</span>;
}

export function StrategyCard({ strategy }: { strategy: StrategyBlueprintData }) {
  const firstLine = strategy.allocation.lines[0];
  return (
    <Link
      href={`/strategies/${strategy.slug}`}
      className="flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-emerald-600"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
          {strategy.category}
        </span>
        <span className="rounded-md border border-neutral-200 px-2 py-0.5 text-xs text-neutral-500">
          Sample model
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-neutral-900">{strategy.name}</h3>
      <p className="mt-2 text-sm text-neutral-600">{strategy.tagline}</p>

      <div className="mt-5 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
        <div className="flex items-center justify-between">
          <span className="font-medium text-neutral-700">Risk</span>
          <RiskBadge profile={strategy.riskProfile} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-medium text-neutral-700">Horizon</span>
          <span>{strategy.timeHorizon}</span>
        </div>
        {firstLine ? (
          <div className="mt-3 flex items-center justify-between">
            <span className="font-medium text-neutral-700">Largest allocation</span>
            <span>
              {firstLine.assetClass} · {firstLine.weight}%
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
