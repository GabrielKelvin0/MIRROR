import {
  periodReturn,
  maxDrawdown,
  annualisedVolatility,
  benchmarkComparison,
  correlation,
  normaliseAllocation,
} from "@/lib/services/performance-rules";
import { DEMO_PORTFOLIO_SERIES, DEMO_BENCHMARK_SERIES } from "@/lib/data/performance-demo";

interface PerformanceRiskPanelProps {
  allocations: Array<{ label: string; weight: number }>;
}

/**
 * Learner-facing Performance & Risk panel (server component).
 *
 * Renders the Phase 11 metrics — period return, maximum drawdown and recovery,
 * annualised volatility, benchmark comparison, allocation, and correlation —
 * computed deterministically from a clearly-marked seed/demo series. Every
 * figure carries the stated period and data basis so nothing is misread as real
 * market data or a guarantee.
 */
export function PerformanceRiskPanel({ allocations }: PerformanceRiskPanelProps) {
  const portfolio = DEMO_PORTFOLIO_SERIES;
  const benchmark = DEMO_BENCHMARK_SERIES;

  const returnPct = periodReturn(portfolio);
  const drawdown = maxDrawdown(portfolio);
  const volatility = annualisedVolatility(portfolio);
  const versus = benchmarkComparison(portfolio, benchmark);
  const corr = correlation(portfolio, benchmark);
  const allocationSlices =
    allocations.length > 0 ? normaliseAllocation(allocations) : inferAllocationSlices();

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">Performance &amp; Risk</h2>
        <p className="text-xs text-neutral-500">{portfolio.periodLabel}</p>
      </div>
      <p className="mt-1 text-sm text-amber-700">{portfolio.dataBasis}</p>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Metric
          label="Historical return (period)"
          value={`${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`}
          tone={returnPct >= 0 ? "positive" : "negative"}
        />
        <Metric
          label="Max drawdown"
          value={`-${drawdown.maxDrawdownPercent.toFixed(2)}%`}
          tone="negative"
        />
        <Metric label="Annualised volatility" value={`${volatility.toFixed(2)}%`} tone="neutral" />
        <Metric
          label="Vs. benchmark"
          value={`${versus.excessPct >= 0 ? "+" : ""}${versus.excessPct.toFixed(2)} pp`}
          tone={versus.excessPct >= 0 ? "positive" : "negative"}
        />
        <Metric
          label="Correlation w/ benchmark"
          value={corr == null ? "n/a" : corr.toFixed(2)}
          tone="neutral"
        />
        <Metric
          label="Drawdown recovery"
          value={
            drawdown.recoveryPeriods == null
              ? "Open / not yet"
              : `${drawdown.recoveryPeriods} months`
          }
          tone="neutral"
        />
      </div>

      <details className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        <summary className="cursor-pointer font-medium text-neutral-800">
          Methodology &amp; attribution
        </summary>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Return, max drawdown, volatility, and correlation are computed purely from the demo
            series shown above over the stated period.
          </li>
          <li>
            Volatility is the sample standard deviation of periodic returns, annualised at{" "}
            {portfolio.periodsPerYear ?? 12} periods per year.
          </li>
          <li>
            Drawdown recovery counts months from the deepest trough back to the prior peak; “Open”
            means not yet recovered within the series.
          </li>
          <li>
            Allocation below is normalised to 100%. The demo series is frozen seed data, not live or
            guaranteed results.
          </li>
        </ul>
      </details>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Allocation</h3>
          <ul className="mt-3 space-y-2">
            {allocationSlices.map((slice) => (
              <li key={slice.label} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm text-neutral-600">
                  {slice.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${slice.weight}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-medium text-neutral-700">
                  {slice.weight.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold text-neutral-800">Benchmark comparison</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row
              label={portfolio.label}
              value={`${versus.seriesReturnPct >= 0 ? "+" : ""}${versus.seriesReturnPct.toFixed(2)}%`}
            />
            <Row
              label={benchmark.label}
              value={`${versus.benchmarkReturnPct >= 0 ? "+" : ""}${versus.benchmarkReturnPct.toFixed(2)}%`}
            />
            <Row
              label="Excess return"
              value={`${versus.excessPct >= 0 ? "+" : ""}${versus.excessPct.toFixed(2)} pp`}
            />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-red-600"
        : "text-neutral-900";
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

/**
 * Fallback allocation when the portfolio has no strategy allocations: a
 * neutral, clearly-labelled demo split so the panel is never empty.
 */
function inferAllocationSlices() {
  return normaliseAllocation([
    { label: "Demo growth", weight: 60 },
    { label: "Demo bonds", weight: 30 },
    { label: "Demo cash", weight: 10 },
  ]);
}
