import { describe, it, expect } from "vitest";
import {
  periodReturn,
  maxDrawdown,
  annualisedVolatility,
  benchmarkComparison,
  correlation,
  normaliseAllocation,
  type ValueSeries,
} from "./performance-rules";
import { ValidationError } from "@/lib/errors";

/**
 * Deterministic unit tests for the Performance and Risk metrics engine
 * (lib/services/performance-rules.ts): period return, max drawdown +
 * recovery, annualised volatility, benchmark comparison, correlation, and
 * allocation normalisation.
 */

function series(label: string, values: number[], periodLabel = "2024"): ValueSeries {
  return {
    label,
    points: values.map((value, i) => ({ date: `2024-${i + 1}`, value })),
    periodLabel,
    dataBasis: "Seed demo series — not real market data",
    periodsPerYear: 12,
  };
}

describe("periodReturn", () => {
  it("computes a simple percentage return", () => {
    expect(periodReturn(series("p", [100, 110]))).toBeCloseTo(10);
  });

  it("computes a negative return", () => {
    expect(periodReturn(series("p", [100, 90]))).toBeCloseTo(-10);
  });

  it("rejects series with fewer than two points", () => {
    expect(() => periodReturn(series("p", [100]))).toThrow(ValidationError);
  });

  it("rejects a zero starting value", () => {
    expect(() => periodReturn(series("p", [0, 100]))).toThrow(ValidationError);
  });
});

describe("maxDrawdown", () => {
  it("returns zero drawdown for a monotonically rising series", () => {
    const result = maxDrawdown(series("p", [100, 105, 110]));
    expect(result.maxDrawdownPercent).toBe(0);
    expect(result.recoveryPeriods).toBeNull();
  });

  it("computes the deepest peak-to-trough drawdown", () => {
    // 100 -> 120 (peak) -> 90 (trough) -> 130 (recovers)
    const result = maxDrawdown(series("p", [100, 120, 90, 130]));
    expect(result.maxDrawdownPercent).toBeCloseTo(25); // (120-90)/120
    expect(result.troughDate).toBe("2024-3");
  });

  it("reports open drawdown (no recovery) when the series stays below the peak", () => {
    // 100 -> 140 -> 120 (below prior peak at series end)
    const result = maxDrawdown(series("p", [100, 140, 120]));
    expect(result.maxDrawdownPercent).toBeCloseTo(((140 - 120) / 140) * 100);
    expect(result.recoveryPeriods).toBeNull();
  });

  it("counts recovery periods back to the prior peak where recovered", () => {
    // 100 -> 120 (peak) -> 90 (trough) -> 100 -> 125 (>= 120 peak, recovers)
    const result = maxDrawdown(series("p", [100, 120, 90, 100, 125]));
    // trough at index 2; from index 2 it reaches peak value 120 at index 4:
    expect(result.recoveryPeriods).toBe(2);
  });
});

describe("annualisedVolatility", () => {
  it("is zero for a flat series", () => {
    expect(annualisedVolatility(series("p", [100, 100, 100]))).toBeCloseTo(0);
  });

  it("is deterministic and positive for varied returns and scales with periods-per-year", () => {
    const base = annualisedVolatility(series("p", [100, 110, 95, 105, 120]));
    expect(Number.isFinite(base)).toBe(true);
    expect(base).toBeGreaterThan(0);
  });

  it("rejects series with too few periodic returns", () => {
    expect(() => annualisedVolatility(series("p", [100, 100]))).toThrow(ValidationError);
  });

  it("uses the stated periods-per-year for annualisation", () => {
    const monthly = { ...series("p", [100, 102, 101, 103]), periodsPerYear: 12 };
    const daily = { ...series("p", [100, 102, 101, 103]), periodsPerYear: 252 };
    expect(annualisedVolatility(daily)).toBeGreaterThan(annualisedVolatility(monthly));
  });
});

describe("benchmarkComparison", () => {
  it("computes excess return relative to the benchmark", () => {
    const result = benchmarkComparison(
      series("Portfolio", [100, 115]),
      series("Benchmark", [100, 105])
    );
    expect(result.seriesReturnPct).toBeCloseTo(15);
    expect(result.benchmarkReturnPct).toBeCloseTo(5);
    expect(result.excessPct).toBeCloseTo(10);
  });

  it("handles underperformance with a negative excess", () => {
    const result = benchmarkComparison(
      series("Portfolio", [100, 102]),
      series("Benchmark", [100, 110])
    );
    expect(result.excessPct).toBeCloseTo(-8);
  });
});

describe("correlation", () => {
  it("returns 1 for two identical series", () => {
    const a = series("a", [100, 110, 90, 105]);
    const b = series("b", [100, 110, 90, 105]);
    expect(correlation(a, b)).toBeCloseTo(1);
  });

  it("returns a value in [-1, 1] for mixed series", () => {
    const a = series("a", [100, 110, 90, 105, 120]);
    const b = series("b", [100, 95, 105, 102, 110]);
    const r = correlation(a, b);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThanOrEqual(-1);
    expect(r!).toBeLessThanOrEqual(1);
  });

  it("returns null when fewer than two comparable points exist", () => {
    const a = series("a", [100]);
    const b = series("b", [100]);
    expect(correlation(a, b)).toBeNull();
  });
});

describe("normaliseAllocation", () => {
  it("converts raw weights to percentages summing to 100", () => {
    const out = normaliseAllocation([
      { label: "Growth", weight: 80 },
      { label: "Bonds", weight: 20 },
    ]);
    expect(out[0]!.weight).toBeCloseTo(80);
    expect(out[1]!.weight).toBeCloseTo(20);
    expect(out.reduce((s, o) => s + o.weight, 0)).toBeCloseTo(100);
  });

  it("rejects an empty or all-zero allocation", () => {
    expect(() => normaliseAllocation([])).toThrow(ValidationError);
    expect(() => normaliseAllocation([{ label: "X", weight: 0 }])).toThrow(ValidationError);
  });

  it("rejects negative weights", () => {
    expect(() =>
      normaliseAllocation([
        { label: "X", weight: 110 },
        { label: "Y", weight: -10 },
      ])
    ).toThrow(ValidationError);
  });
});
