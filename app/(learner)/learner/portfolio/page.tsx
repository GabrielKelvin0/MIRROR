import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { portfolioRepository } from "@/lib/db";
import { PortfolioCreateForm } from "@/components/learner/PortfolioCreateForm";

export const metadata: Metadata = {
  title: "Paper Portfolio",
  description:
    "Build a purely hypothetical paper portfolio with simulated capital. Nothing here is real money.",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function PortfolioListPage() {
  const user = await requireRole("LEARNER");
  const portfolios = await portfolioRepository.listForUser(user.id);

  return (
    <div className="space-y-10 p-8">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="font-semibold text-emerald-900">Hypothetical — not real money</h2>
        <p className="mt-1 text-sm text-emerald-800">
          Paper portfolios use simulated starting capital and clearly-labelled illustrative returns.
          They are for education only — never invest real money or treat these as actual results.
        </p>
      </section>

      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Paper Portfolio</h1>
        <p className="mt-2 text-neutral-600">
          Create a virtual portfolio, allocate strategies, record decisions, and view hypothetical
          performance against a sample benchmark.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Create a new paper portfolio</h2>
        <div className="mt-4 max-w-xl">
          <PortfolioCreateForm />
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-neutral-900">Your paper portfolios</h2>
        {portfolios.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-12 text-center">
            <h3 className="text-lg font-semibold text-neutral-800">No paper portfolios yet</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Use the form above to simulate your first portfolio with starting capital.
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {portfolios.map((portfolio) => {
              const allocated = portfolio.strategies.reduce(
                (sum, s) => sum + (s.allocationPercentage ?? 0),
                0
              );
              return (
                <li key={portfolio.id}>
                  <Link
                    href={`/learner/portfolio/${portfolio.id}`}
                    className="block rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
                  >
                    <p className="font-semibold text-neutral-900">{portfolio.name}</p>
                    {portfolio.description ? (
                      <p className="mt-1 text-sm text-neutral-600">{portfolio.description}</p>
                    ) : null}
                    <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-neutral-500">Starting capital</dt>
                        <dd className="font-medium text-neutral-900">
                          {currency.format(portfolio.startingCapital)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Current (hyp.)</dt>
                        <dd className="font-medium text-neutral-900">
                          {currency.format(portfolio.currentValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Allocated</dt>
                        <dd className="font-medium text-neutral-900">{allocated}%</dd>
                      </div>
                    </dl>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
