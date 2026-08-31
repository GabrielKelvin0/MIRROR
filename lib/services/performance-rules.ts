/**
 * MIRROR — Performance and Risk metrics (pure, deterministic, testable).
 *
 * This module contains ONLY pure functions that compute investment
 * performance and risk metrics from a time series of value points:
 *
 *   - historical / period return
 *   - maximum drawdown and recovery time
 *   - annualised volatility (sample-standard-deviation estimate)
 *   - benchmark comparison
 *   - allocation breakdown
 *   - correlation between two series (where the data supports it)
 *
 * It has no database or I/O dependency and no clock, so every result is
 * deterministic and can be unit-tested in isolation.
 *
 * FINANCIAL-SAFETY BOUNDARY (non-negotiable): these are mathematics over a
 * supplied series. Nothing here is a claim of real market data, a forecast, a
 * guarantee, or investment advice. The phase requirement "performance
 * calculations must state the relevant period and data basis" is honoured by
 * the `periodLabel` and `dataBasis` fields that every caller must attach and
 * that the UI must display.
 *
 * NOTE ON VOLATILITY: the annualised standard deviation below is a descriptive
 * estimate over the supplied (clearly-marked demo/seed) series. It uses the
 * sample standard deviation (n−1) of periodic returns, annualised by a stated
 * periods-per-year factor. It is a measure of dispersion, not a prediction.
 */

import { ValidationError } from "@/lib/errors";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** A single point on a value series, chronological order. */
export interface SeriesPoint {
  /** ISO date label (e.g. "2024-01"). Used only for display/counting. */
  date: string;
  value: number;
}

/** A full time series plus its declared provenance. */
export interface ValueSeries {
  label: string;
  points: SeriesPoint[];
  /** Human-readable period, e.g. "Jan 2024 – Dec 2024". Must be shown in UI. */
  periodLabel: string;
  /** Honest provenance for the data, e.g. "Seed demo series — not real market data". */
  dataBasis: string;
  /** Periodic returns per year for annualising volatility (e.g. 12 or 52). */
  periodsPerYear?: number;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function requireSeries(series: ValueSeries): void {
  const count = series.points.length;
  if (count < 2) {
    throw new ValidationError("At least two points are required to compute metrics", {
      series: "too-short",
    });
  }
  for (const point of series.points) {
    if (typeof point.value !== "number" || !Number.isFinite(point.value) || point.value < 0) {
      throw new ValidationError("Series values must be finite, non-negative numbers", {
        series: "invalid-value",
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Returns                                                             */
/* ------------------------------------------------------------------ */

/**
 * Simple period return (%) from first to last value of a series.
 * Deterministic given its inputs.
 */
export function periodReturn(series: ValueSeries): number {
  requireSeries(series);
  const first = series.points[0]!.value;
  const last = series.points[series.points.length - 1]!.value;
  if (first === 0) {
    throw new ValidationError("Cannot compute return from a zero starting value", {
      series: "zero-start",
    });
  }
  return ((last - first) / first) * 100;
}

/* ------------------------------------------------------------------ */
/* Maximum drawdown and recovery                                       */
/* ------------------------------------------------------------------ */

export interface DrawdownResult {
  /** The greatest peak-to-trough decline as a positive percentage (e.g. 18.5 means −18.5%). */
  maxDrawdownPercent: number;
  /** The series date label at the drawdown trough. */
  troughDate: string;
  /** The series date label at the prior peak. */
  peakDate: string;
  /**
   * Recovery time in the number of series periods from trough back up to (and
   * beyond) the prior peak, or null when not yet recovered within the series.
   */
  recoveryPeriods: number | null;
}

/**
 * Compute the maximum drawdown (largest peak-to-trough decline) and, where
 * calculable, the recovery time back to the prior peak.
 *
 * Recovery is "not yet recovered" (recoveryPeriods === null) when the series
 * ends below its running peak — i.e. the drawdown is still open.
 */
/**
 * Compute the maximum drawdown (largest peak-to-trough decline) and, where
 * calculable, the recovery time back to the prior peak.
 *
 * Recovery is "not yet recovered" (recoveryPeriods === null) when the drawdown
 * is still open — i.e. the series never climbs back to the pre-trough peak.
 * Where the data supports it, recoveryPeriods is the number of series periods
 * from the trough until the value reaches (or exceeds) the pre-trough peak.
 */
export function maxDrawdown(series: ValueSeries): DrawdownResult {
  requireSeries(series);

  let runningPeak = series.points[0]!.value;
  let runningPeakDate = series.points[0]!.date;
  let maxDropPct = 0;
  let troughDate = series.points[0]!.date;
  let dropPeakDate = series.points[0]!.date;
  let dropPeakValue = series.points[0]!.value;

  // Pass 1: find the deepest peak-to-trough decline.
  for (const point of series.points) {
    if (point.value > runningPeak) {
      runningPeak = point.value;
      runningPeakDate = point.date;
    } else {
      const dropPct = runningPeak === 0 ? 0 : ((runningPeak - point.value) / runningPeak) * 100;
      if (dropPct > maxDropPct) {
        maxDropPct = dropPct;
        troughDate = point.date;
        dropPeakDate = runningPeakDate;
        dropPeakValue = runningPeak;
      }
    }
  }

  // Pass 2: count periods from the trough until the value recovers to the
  // pre-trough peak, if it ever does within the series.
  let recoveryPeriods: number | null = null;
  if (maxDropPct > 0) {
    let periods = 0;
    let atTrough = false;
    for (const point of series.points) {
      if (point.date === troughDate) {
        atTrough = true;
      }
      if (atTrough) {
        if (point.value >= dropPeakValue) {
          recoveryPeriods = periods;
          break;
        }
        periods += 1;
      }
    }
  }

  return {
    maxDrawdownPercent: maxDropPct,
    troughDate,
    peakDate: dropPeakDate,
    recoveryPeriods,
  };
}

/* ------------------------------------------------------------------ */
/* Volatility                                                          */
/* ------------------------------------------------------------------ */

/**
 * Annualised volatility (%) as the sample standard deviation of the periodic
 * returns, scaled by the stated periods-per-year. Deterministic.
 *
 * Uses the sample std-dev (n−1) of successive periodic returns. A
 * periods-per-year of e.g. 12 annualises monthly returns.
 */
export function annualisedVolatility(series: ValueSeries): number {
  requireSeries(series);
  const returns: number[] = [];
  for (let i = 1; i < series.points.length; i++) {
    const prev = series.points[i - 1]!.value;
    const curr = series.points[i]!.value;
    if (prev === 0) continue;
    returns.push((curr - prev) / prev);
  }
  if (returns.length < 2) {
    throw new ValidationError("At least two periodic returns are required for volatility", {
      series: "too-few-returns",
    });
  }
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) * (r - mean), 0) / (returns.length - 1);
  const sampleStdev = Math.sqrt(variance);
  const ppy = series.periodsPerYear && series.periodsPerYear > 0 ? series.periodsPerYear : 12;
  return sampleStdev * Math.sqrt(ppy) * 100;
}

/* ------------------------------------------------------------------ */
/* Benchmark comparison                                                */
/* ------------------------------------------------------------------ */

export interface BenchmarkComparisonResult {
  seriesLabel: string;
  benchmarkLabel: string;
  seriesReturnPct: number;
  benchmarkReturnPct: number;
  /** series − benchmark, in percentage points. Positive = outperformed. */
  excessPct: number;
}

/**
 * Compare the period return of a series against a benchmark series.
 * Both series may have differing point counts (each brought to period return).
 */
export function benchmarkComparison(
  series: ValueSeries,
  benchmark: ValueSeries
): BenchmarkComparisonResult {
  const seriesRet = periodReturn(series);
  const benchRet = periodReturn(benchmark);
  return {
    seriesLabel: series.label,
    benchmarkLabel: benchmark.label,
    seriesReturnPct: seriesRet,
    benchmarkReturnPct: benchRet,
    excessPct: seriesRet - benchRet,
  };
}

/* ------------------------------------------------------------------ */
/* Correlation                                                         */
/* ------------------------------------------------------------------ */

/**
 * Pearson correlation between two series of equal length, matched
 * positionally (assumes aligned, same-start series) and filtered to pairs
 * where both values are finite. Returns a value in [−1, 1], or null when
 * there are fewer than two comparable points or a denominator is zero (i.e.
 * the data does not support a correlation).
 */
export function correlation(a: ValueSeries, b: ValueSeries): number | null {
  const count = Math.min(a.points.length, b.points.length);
  const ax: number[] = [];
  const by: number[] = [];
  for (let i = 0; i < count; i++) {
    const av = a.points[i]!.value;
    const bv = b.points[i]!.value;
    if (Number.isFinite(av) && Number.isFinite(bv)) {
      ax.push(av);
      by.push(bv);
    }
  }
  if (ax.length < 2) return null;
  const n = ax.length;
  const meanX = ax.reduce((s, v) => s + v, 0) / n;
  const meanY = by.reduce((s, v) => s + v, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = ax[i]! - meanX;
    const dy = by[i]! - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) return null;
  return cov / Math.sqrt(varX * varY);
}

/* ------------------------------------------------------------------ */
/* Allocation                                                          */
/* ------------------------------------------------------------------ */

export interface AllocationSlice {
  label: string;
  /** Weight 0–100. */
  weight: number;
}

/**
 * Normalise a set of allocation weights to sum to 100%. Throws if there are
 * no slices or any weight is negative. Deterministic.
 */
export function normaliseAllocation(
  slices: Array<{ label: string; weight: number }>
): AllocationSlice[] {
  const total = slices.reduce((sum, s) => sum + s.weight, 0);
  if (slices.length === 0 || total <= 0) {
    throw new ValidationError("Allocation needs at least one positive slice", {
      allocation: "empty",
    });
  }
  for (const slice of slices) {
    if (slice.weight < 0 || !Number.isFinite(slice.weight)) {
      throw new ValidationError("Allocation weights must be non-negative", {
        allocation: "invalid-weight",
      });
    }
  }
  return slices.map((s) => ({ label: s.label, weight: (s.weight / total) * 100 }));
}
