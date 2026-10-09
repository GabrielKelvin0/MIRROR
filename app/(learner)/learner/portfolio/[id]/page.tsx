import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { portfolioRepository, strategyRepository } from "@/lib/db";
import { PortfolioAllocationManager } from "@/components/learner/PortfolioAllocationManager";
import { PortfolioDecisionForm } from "@/components/learner/PortfolioDecisionForm";
import { PortfolioDeleteButton } from "@/components/learner/PortfolioDeleteButton";
import { PerformanceRiskPanel } from "@/components/learner/PerformanceRiskPanel";
import { PortfolioRebalanceForm } from "@/components/learner/PortfolioRebalanceForm";
import { PortfolioAllocationHistory } from "@/components/learner/PortfolioAllocationHistory";
import { PortfolioHoldings } from "@/components/learner/PortfolioHoldings";
import { allocationTotal } from "@/lib/services/portfolio-maturity";
import { NotFoundError } from "@/lib/errors";

export const metadata: Metadata = {
  title: "Paper Portfolio",
  description: "Hypothetical paper portfolio detail and performance.",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export default async function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("LEARNER");
  const { id } = await params;

  // Fetch the (ownership-checked) portfolio and the public published-strategy
  // list concurrently — they are independent, so running them in parallel avoids
  // a serial DB waterfall on this page.
  const [owned, published] = await Promise.all([
    portfolioRepository.getOwned(id, user.id).catch((error: unknown) => {
      if (error instanceof NotFoundError) return null;
      throw error;
    }),
    strategyRepository.listPublished(),
  ]);
  if (!owned) {
    notFound();
  }
  const portfolio = owned;

  const summary = await portfolioRepository.performanceSummary(portfolio);
  const allocatedIds = new Set(portfolio.strategies.map((s) => s.strategyId));
  const availableStrategies = published.filter((s) => !allocatedIds.has(s.id));

  const allocations = portfolio.strategies.map((s) => ({
    id: s.id,
    strategyId: s.strategyId,
    name: s.strategy.name,
    riskProfile: s.strategy.riskProfile ?? "Risk not set",
    allocationPercentage: s.allocationPercentage ?? 0,
    plannedAmount: portfolio.startingCapital * (s.allocationPercentage / 100),
    status: s.strategy.status,
  }));

  const allocated = allocationTotal(allocations);
  const reserve = Math.round((100 - allocated) * 1e10) / 1e10;
  const returnPositive = summary.returnPct !== null && summary.returnPct >= 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/learner/portfolio"
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            ← All paper portfolios
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-neutral-900">{portfolio.name}</h1>
          {portfolio.description ? (
            <p className="mt-1 text-neutral-600">{portfolio.description}</p>
          ) : null}
        </div>
        <PortfolioDeleteButton portfolioId={portfolio.id} />
      </div>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="font-semibold text-emerald-900">Hypothetical — not real money</h2>
        <p className="mt-1 text-sm text-emerald-800">
          Strategy-only portfolios use illustrative model returns. Recorded paper holdings use
          recorded quantities and prices, with missing prices shown as unavailable. These figures
          are educational and never a promise of actual results.
        </p>
      </section>

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Hypothetical portfolio summary"
      >
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Starting capital</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {currency.format(portfolio.startingCapital)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Current value (hyp.)</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {summary.currentValue === null ? "Unavailable" : currency.format(summary.currentValue)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Hypothetical return</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              summary.returnPct === null
                ? "text-neutral-700"
                : returnPositive
                  ? "text-emerald-700"
                  : "text-red-600"
            }`}
          >
            {summary.returnPct === null
              ? "Unavailable"
              : `${returnPositive ? "+" : ""}${summary.returnPct.toFixed(2)}%`}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-600">Strategy model annual blend</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {summary.blendedAnnualReturn.toFixed(2)}%
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Compare with benchmark</h2>
        <p className="mt-1 text-sm text-neutral-500">{summary.benchmark.note}</p>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-4">
          <div>
            <p className="font-medium text-neutral-900">{summary.benchmark.name}</p>
            <p className="text-sm text-neutral-500">Hypothetical sample benchmark</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {summary.benchmark.annualReturn.toFixed(2)}%
          </p>
        </div>
      </section>

      <PerformanceRiskPanel
        allocations={allocations.map((a) => ({ label: a.name, weight: a.allocationPercentage }))}
      />

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-neutral-900">Strategy allocations</h2>
          <p className="text-sm text-neutral-500">{allocated}% target allocation</p>
        </div>

        <p className="mt-2 text-sm text-neutral-600">
          Planned reserve: {reserve}% (
          {currency.format(portfolio.startingCapital * (reserve / 100))}). Amounts use simulated
          starting capital; they are targets, not individual holdings.
        </p>
        <div className="mt-4">
          {portfolio.status === "ACTIVE" ? (
            <>
              <PortfolioAllocationManager
                portfolioId={portfolio.id}
                allocations={allocations}
                availableStrategies={availableStrategies.map((s) => ({
                  id: s.id,
                  name: s.name,
                  riskProfile: s.riskProfile ?? "Risk not set",
                }))}
              />
              <PortfolioRebalanceForm
                key={allocations.map((a) => `${a.id}:${a.allocationPercentage}`).join("|")}
                portfolioId={portfolio.id}
                allocations={allocations}
              />
            </>
          ) : (
            <div>
              <p className="text-sm text-neutral-600">
                This portfolio is archived and its allocation plan is read-only.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-800">
                {allocations.map((allocation) => (
                  <li key={allocation.id} className="break-words">
                    {allocation.name}: {allocation.allocationPercentage}% target (
                    {currency.format(allocation.plannedAmount)} planned capital)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <PortfolioHoldings positions={portfolio.positions} cashBalance={portfolio.cashBalance} />
      <PortfolioAllocationHistory events={portfolio.events} />

      {portfolio.status === "ACTIVE" ? (
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Record a decision note</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Save a decision or an idea you are considering. A note does not change allocations. Use
            the simulated rebalance form above to change the target mix and capture its history.
          </p>

          <div className="mt-6 border-t border-neutral-100 pt-6">
            <PortfolioDecisionForm portfolioId={portfolio.id} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
