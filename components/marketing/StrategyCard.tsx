import Link from "next/link";
import type { RiskProfile, StrategyBlueprintData } from "@/lib/data/strategies";

const RISK_LEVEL: Record<RiskProfile, number> = {
  Conservative: 1,
  Moderate: 2,
  Aggressive: 3,
};

function RiskBadge({ profile }: { profile: RiskProfile }) {
  const tone =
    profile === "Aggressive"
      ? "bg-red-50 text-red-800"
      : profile === "Moderate"
        ? "bg-amber-50 text-amber-800"
        : "bg-emerald-50 text-emerald-800";
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>{profile}</span>;
}

export function StrategyCard({ strategy }: { strategy: StrategyBlueprintData }) {
  const firstLine = strategy.allocation.lines[0];
  const level = RISK_LEVEL[strategy.riskProfile];
  const riskSegments = [1, 2, 3];

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

      <p className="mt-4 text-sm italic text-neutral-500">{strategy.philosophy}</p>

      <div className="mt-5 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
        <div className="flex items-center justify-between">
          <span className="font-medium text-neutral-700">Risk profile</span>
          <RiskBadge profile={strategy.riskProfile} />
        </div>
        <div className="mt-3 flex items-center gap-1" aria-label={`Risk level ${level} of 3`}>
          {riskSegments.map((segment) => (
            <span
              key={segment}
              className={`h-1.5 flex-1 rounded-full ${
                segment <= level ? "bg-neutral-700" : "bg-neutral-200"
              }`}
            />
          ))}
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
