import type { Metadata } from "next";
import Link from "next/link";
import type { RiskProfile, TimeHorizon } from "@/lib/data/strategies";
import {
  filterStrategies,
  getDiscoveryFacets,
  sampleStrategies,
  sortStrategies,
} from "@/lib/data/strategies";
import { StrategyCard } from "@/components/marketing/StrategyCard";
import { StrategyDiscoveryControls } from "@/components/marketing/StrategyDiscoveryControls";

export const metadata: Metadata = {
  title: "Strategies",
  description:
    "Browse transparent, educational strategy blueprints — search and filter by risk, horizon, asset class, and philosophy.",
};

const VALID_RISK = new Set<RiskProfile>(["Conservative", "Moderate", "Aggressive"]);
const VALID_HORIZON = new Set<TimeHorizon>(["Long-Term", "Medium-Term", "Multi-Horizon"]);

type Props = {
  searchParams: Promise<{
    q?: string;
    risk?: string;
    horizon?: string;
    asset?: string;
    philosophy?: string;
    sort?: string;
  }>;
};

export default async function StrategiesPage({ searchParams }: Props) {
  const params = await searchParams;

  const selectedRisk = VALID_RISK.has(params.risk as RiskProfile)
    ? (params.risk as RiskProfile)
    : undefined;
  const selectedHorizon = VALID_HORIZON.has(params.horizon as TimeHorizon)
    ? (params.horizon as TimeHorizon)
    : undefined;

  const facets = getDiscoveryFacets();
  const q = params.q?.trim();
  const assetClass = params.asset?.trim();
  const philosophy = params.philosophy?.trim();
  const filtered = filterStrategies(sampleStrategies, {
    ...(q ? { query: q } : {}),
    ...(selectedRisk ? { risk: selectedRisk } : {}),
    ...(selectedHorizon ? { timeHorizon: selectedHorizon } : {}),
    ...(assetClass ? { assetClass } : {}),
    ...(philosophy ? { philosophy } : {}),
  });
  const sort = params.sort === "name" || params.sort === "updated" ? params.sort : "risk";
  const results = sortStrategies(filtered, sort);

  return (
    <>
      <section className="border-b border-neutral-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-3xl font-semibold text-neutral-900">Discover strategies</h1>
          <p className="mt-3 max-w-2xl text-neutral-600">
            Transparent, educational strategy blueprints. Search and filter by risk, time horizon,
            asset class, and philosophy. Risk and methodology are always shown alongside any
            illustrative figures — results are never ranked by return alone.
          </p>

          <div className="mt-6">
            <StrategyDiscoveryControls facets={facets} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="mb-5 text-sm text-neutral-500" role="status">
            {results.length} {results.length === 1 ? "strategy" : "strategies"} found
          </p>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {results.map((strategy) => (
                <StrategyCard key={strategy.slug} strategy={strategy} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-10 text-center">
              <p className="font-medium text-neutral-800">No strategies match your filters</p>
              <p className="mt-2 text-sm text-neutral-600">
                Try clearing some filters or searching with different terms.
              </p>
              <Link
                href="/strategies"
                className="mt-4 inline-block rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                Clear all filters
              </Link>
            </div>
          )}

          <p className="mt-10 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            These are <strong>sample and educational models</strong> to demonstrate MIRROR&apos;s
            risk-forward discovery experience. No real investor, performance, or guarantee is
            implied.
          </p>
        </div>
      </section>
    </>
  );
}
