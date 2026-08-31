/**
 * MIRROR — Performance & Risk demo series (Phase 11).
 *
 * This module provides a clearly-labelled SEED / DEMO value series used only
 * in development. It is NOT real historical market data: it is a deterministic,
 * frozen teaching series used to exercise the pure metrics engine and to show
 * the learner how the metrics are presented. This honours Phase 11's rule:
 * "Do not fabricate historical market data. If no real data provider is
 * configured, use clearly marked seed/demo data only in development."
 *
 * Every series carries an explicit `periodLabel` and `dataBasis` so the UI can
 * always state the relevant period and data provenance.
 */

import type { ValueSeries } from "@/lib/services/performance-rules";

/** The stated period the demo series covers. */
export const DEMO_SERIES_PERIOD_LABEL = "Feb 2025 – Jan 2026";

/** Honest provenance statement shown alongside every metric. */
export const DEMO_SERIES_DATA_BASIS =
  "Seed/demo series for education only — not real or guaranteed historical data.";

/**
 * The demo portfolio value series (monthly points) used for hypothetical
 * performance and risk metrics. Deliberately shows a drawdown followed by
 * recovery so the metrics are instructive.
 */
export const DEMO_PORTFOLIO_SERIES: ValueSeries = {
  label: "Demo paper portfolio",
  periodLabel: DEMO_SERIES_PERIOD_LABEL,
  dataBasis: DEMO_SERIES_DATA_BASIS,
  periodsPerYear: 12,
  points: [
    { date: "2025-02", value: 10000 },
    { date: "2025-03", value: 10320 },
    { date: "2025-04", value: 10110 },
    { date: "2025-05", value: 10640 },
    { date: "2025-06", value: 11020 },
    { date: "2025-07", value: 11580 },
    { date: "2025-08", value: 10910 },
    { date: "2025-09", value: 10240 },
    { date: "2025-10", value: 9950 },
    { date: "2025-11", value: 10330 },
    { date: "2025-12", value: 10890 },
    { date: "2026-01", value: 11300 },
  ],
};

/** The demo benchmark series (same period, same points-per-year) for comparison. */
export const DEMO_BENCHMARK_SERIES: ValueSeries = {
  label: "Demo benchmark index",
  periodLabel: DEMO_SERIES_PERIOD_LABEL,
  dataBasis: DEMO_SERIES_DATA_BASIS,
  periodsPerYear: 12,
  points: [
    { date: "2025-02", value: 10000 },
    { date: "2025-03", value: 10150 },
    { date: "2025-04", value: 10080 },
    { date: "2025-05", value: 10240 },
    { date: "2025-06", value: 10420 },
    { date: "2025-07", value: 10610 },
    { date: "2025-08", value: 10480 },
    { date: "2025-09", value: 10310 },
    { date: "2025-10", value: 10170 },
    { date: "2025-11", value: 10340 },
    { date: "2025-12", value: 10510 },
    { date: "2026-01", value: 10700 },
  ],
};
