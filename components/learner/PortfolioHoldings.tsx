import type { PaperPosition } from "@prisma/client";
import { holdingSnapshot, recordedHoldingsValue } from "@/lib/services/portfolio-maturity";

type Props = { positions: PaperPosition[]; cashBalance: number };
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const units = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });
const money = (value: number | null) =>
  value === null || !Number.isFinite(value) ? "Unavailable" : currency.format(value);

export function PortfolioHoldings({ positions, cashBalance }: Props) {
  const value = recordedHoldingsValue(cashBalance, positions);
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Recorded paper holdings</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Position values use recorded quantities and prices. There is no live price feed. Strategy
        target allocations do not create individual holdings.
      </p>
      {positions.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">
          No individual paper positions are recorded. Your strategy allocation plan is shown
          separately above.
        </p>
      ) : (
        <>
          <div
            className="mt-4 overflow-x-auto"
            role="region"
            aria-label="Paper holdings details"
            tabIndex={0}
          >
            <table className="w-full min-w-[700px] text-left text-sm">
              <caption className="sr-only">
                Hypothetical holdings valued from recorded prices; unavailable prices are not
                treated as zero.
              </caption>
              <thead className="border-b border-neutral-200 text-neutral-600">
                <tr>
                  {[
                    "Holding",
                    "Units",
                    "Entry price",
                    "Recorded price",
                    "Cost basis",
                    "Recorded value",
                    "Simulated gain / loss",
                  ].map((label) => (
                    <th key={label} scope="col" className="px-3 py-2 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {positions.map((position) => {
                  const snapshot = holdingSnapshot(position);
                  return (
                    <tr key={position.id}>
                      <th scope="row" className="px-3 py-3 font-medium text-neutral-900">
                        {position.symbol}
                        <span className="block text-xs font-normal text-neutral-600">
                          {position.strategyId ? "Strategy-linked" : "Manual holding"}
                        </span>
                      </th>
                      <td className="px-3 py-3">
                        {Number.isFinite(position.quantity)
                          ? units.format(position.quantity)
                          : "Unavailable"}
                      </td>
                      <td className="px-3 py-3">{money(position.entryPrice)}</td>
                      <td className="px-3 py-3">{money(position.currentPrice)}</td>
                      <td className="px-3 py-3">{money(snapshot.costBasis)}</td>
                      <td className="px-3 py-3">{money(snapshot.currentValue)}</td>
                      <td className="px-3 py-3">
                        {money(snapshot.profitLoss)}
                        {snapshot.profitLossPercentage === null
                          ? ""
                          : ` (${snapshot.profitLossPercentage.toFixed(2)}%)`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-neutral-700">
            Recorded cash: {money(cashBalance)} · Cash plus recorded holdings: {money(value)}
          </p>
          {value === null ? (
            <p className="mt-2 text-sm text-neutral-600">
              A total cannot be calculated until every holding has a valid recorded price.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
