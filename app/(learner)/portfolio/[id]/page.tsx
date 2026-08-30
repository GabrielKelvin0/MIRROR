import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { portfolioRepository, strategyRepository } from "@/lib/db";
import { PortfolioAllocationManager } from "@/components/learner/PortfolioAllocationManager";
import { PortfolioDecisionForm } from "@/components/learner/PortfolioDecisionForm";
import { PortfolioDeleteButton } from "@/components/learner/PortfolioDeleteButton";

export const metadata: Metadata = {
  title: "Paper Portfolio",
  description: "Hypothetical paper portfolio detail and performance.",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function PortfolioDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole("LEARNER");
  const { id } = await params;

  let portfolio;
  try {
    portfolio = await portfolioRepository.getOwned(id, user.id);
  } catch {
    notFound();
  }

  const summary = await portfolioRepository.performanceSummary(id, user.id);
  const published = await strategyRepository.listPublished();
  const allocatedIds = new Set(portfolio.strategies.map((s) => s.strategyId));
  const availableStrategies = published.filter((s) => !allocatedIds.has(s.id));

  const allocations = portfolio.strategies.map((s) => ({
    id: s.id,
    strategyId: s.strategyId,
    name: s.strategy.name,
    riskProfile: s.strategy.riskProfile ?? "Risk not set",
    allocationPercentage: s.allocationPercentage ?? 0,
  }));

  const returnPositive = summary.returnPct >= 0;

  return (
    <div className="space-y-8 p-8">
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
          Values and performance below are simulated from clearly-labelled illustrative returns.
          They are educational only and never a promise of actual results.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Starting capital</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {currency.format(portfolio.startingCapital)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Current value (hyp.)</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {currency.format(summary.currentValue)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Hypothetical return</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              returnPositive ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {returnPositive ? "+" : ""}
            {summary.returnPct.toFixed(2)}%
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Illustrative annual blend</p>
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

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Strategy allocations</h2>
          <p className="text-sm text-neutral-500">
            {allocations.reduce((sum, a) => sum + a.allocationPercentage, 0).toFixed(0)}% allocated
          </p>
        </div>

        <div className="mt-2">
          <PortfolioAllocationManager
            portfolioId={portfolio.id}
            allocations={allocations}
            availableStrategies={availableStrategies.map((s) => ({
              id: s.id,
              name: s.name,
              riskProfile: s.riskProfile ?? "Risk not set",
            }))}
          />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Manual decisions</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Record a decision you made (or are considering) with this paper portfolio for learning.
        </p>

        {portfolio.events.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">No decisions recorded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-200">
            {portfolio.events.map((event) => (
              <li key={event.id} className="py-3">
                <p className="font-medium text-neutral-900">{event.description}</p>
                <p className="text-xs text-neutral-500">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(event.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t border-neutral-100 pt-6">
          <PortfolioDecisionForm portfolioId={portfolio.id} />
        </div>
      </section>
    </div>
  );
}
