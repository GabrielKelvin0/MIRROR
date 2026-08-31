import { describe, it, expect } from "vitest";
import {
  validatePortfolioInput,
  validateDecision,
  validatePosition,
  validateAllocationInput,
  positionCurrentValue,
  portfolioValue,
  portfolioReturn,
  blendedAnnualReturn,
  assertAllocationTotal,
  SAMPLE_BENCHMARK,
} from "./portfolio-rules";
import { ValidationError } from "@/lib/errors";

/**
 * These tests exercise the pure, deterministic paper-portfolio business rules
 * (lib/services/portfolio-rules.ts): input validation, valuation/return math,
 * the illustrative blended-return model, and allocation-total enforcement.
 *
 * Everything here is hypothetical and deterministic — no I/O, no clock.
 */

describe("validatePortfolioInput", () => {
  it("accepts a valid portfolio, trimming the name", () => {
    const out = validatePortfolioInput({ name: "  Growth  ", startingCapital: 10000 });
    expect(out.name).toBe("Growth");
    expect(out.startingCapital).toBe(10000);
    expect(out.description).toBeNull();
  });

  it("rejects a blank name", () => {
    expect(() => validatePortfolioInput({ name: "   ", startingCapital: 1 })).toThrow(
      ValidationError
    );
  });

  it("rejects missing, non-numeric, or non-positive starting capital", () => {
    expect(() => validatePortfolioInput({ name: "X" })).toThrow(ValidationError);
    expect(() => validatePortfolioInput({ name: "X", startingCapital: 0 })).toThrow(
      ValidationError
    );
    expect(() => validatePortfolioInput({ name: "X", startingCapital: Number.NaN })).toThrow(
      ValidationError
    );
  });
});

describe("validateDecision", () => {
  it("accepts a decision with a summary", () => {
    expect(validateDecision({ summary: "Stayed the course" }).summary).toBe("Stayed the course");
  });

  it("rejects a blank summary", () => {
    expect(() => validateDecision({ summary: "" })).toThrow(ValidationError);
    expect(() => validateDecision({})).toThrow(ValidationError);
  });
});

describe("validatePosition", () => {
  it("accepts a valid position, uppercasing and trimming the symbol", () => {
    const out = validatePosition({
      symbol: " aapl ",
      quantity: 10,
      entryPrice: 100,
      currentPrice: 110,
    });
    expect(out.symbol).toBe("AAPL");
    expect(out.currentPrice).toBe(110);
  });

  it("rejects a blank symbol or non-positive quantities/prices", () => {
    expect(() => validatePosition({ quantity: 1, entryPrice: 1, currentPrice: 1 })).toThrow(
      ValidationError
    );
    expect(() =>
      validatePosition({ symbol: "A", quantity: 0, entryPrice: 1, currentPrice: 1 })
    ).toThrow(ValidationError);
    expect(() =>
      validatePosition({ symbol: "A", quantity: 1, entryPrice: 0, currentPrice: 1 })
    ).toThrow(ValidationError);
  });
});

describe("validateAllocationInput", () => {
  it("accepts a valid allocation", () => {
    const out = validateAllocationInput({ strategyId: "s_1", allocationPercentage: 40 });
    expect(out.strategyId).toBe("s_1");
    expect(out.allocationPercentage).toBe(40);
  });

  it("rejects a missing strategy or out-of-range percentage", () => {
    expect(() => validateAllocationInput({ allocationPercentage: 40 })).toThrow(ValidationError);
    expect(() => validateAllocationInput({ strategyId: "s_1", allocationPercentage: 101 })).toThrow(
      ValidationError
    );
    expect(() => validateAllocationInput({ strategyId: "s_1", allocationPercentage: -1 })).toThrow(
      ValidationError
    );
  });
});

describe("positionCurrentValue / portfolioValue", () => {
  it("computes a single position value deterministically", () => {
    expect(positionCurrentValue({ quantity: 10, currentPrice: 123.4 })).toBe(1234);
  });

  it("adds cash plus all position values into portfolio value", () => {
    const value = portfolioValue(2000, [
      { quantity: 10, currentPrice: 100 },
      { quantity: 5, currentPrice: 60 },
    ]);
    // 2000 + (1000 + 300) = 3300
    expect(value).toBe(3300);
  });
});

describe("portfolioReturn", () => {
  it("computes the percentage return versus starting capital", () => {
    expect(portfolioReturn(11000, 10000)).toBeCloseTo(10);
    expect(portfolioReturn(9000, 10000)).toBeCloseTo(-10);
  });

  it("rejects non-positive starting capital", () => {
    expect(() => portfolioReturn(100, 0)).toThrow(ValidationError);
    expect(() => portfolioReturn(100, -1)).toThrow(ValidationError);
  });
});

describe("blendedAnnualReturn (illustrative, deterministic)", () => {
  it("blends allocation weights against illustrative return buckets", () => {
    const bucketFor = () => "Moderate Bucket"; // 6.0%
    // 100% in the 6% bucket => 6.0
    const out = blendedAnnualReturn([{ allocationPercentage: 100 }], bucketFor);
    expect(out).toBeCloseTo(6.0);
  });

  it("blends across buckets by weight", () => {
    const bucketFor = (a: { allocationPercentage: number }) =>
      a.allocationPercentage >= 50 ? "Growth Bucket" : "Conservative Bucket";
    // 60% * 8.5 + 40% * 3.5 = 5.1 + 1.4 = 6.5
    const out = blendedAnnualReturn(
      [{ allocationPercentage: 60 }, { allocationPercentage: 40 }],
      bucketFor
    );
    expect(out).toBeCloseTo(6.5);
  });

  it("returns 0 when there are no allocations", () => {
    expect(blendedAnnualReturn([], () => "Moderate Bucket")).toBe(0);
  });
});

describe("assertAllocationTotal", () => {
  it("rejects weights outside 0–100", () => {
    expect(() => assertAllocationTotal([{ allocationPercentage: 101 }])).toThrow(ValidationError);
    expect(() => assertAllocationTotal([{ allocationPercentage: -1 }])).toThrow(ValidationError);
  });

  it("rejects a total that would exceed 100%", () => {
    // 70 already allocated; adding a 40% line totals 110
    expect(() => assertAllocationTotal([{ allocationPercentage: 40 }], 70, 0)).toThrow(
      ValidationError
    );
  });

  it("allows a total up to and including 100%", () => {
    expect(() => assertAllocationTotal([{ allocationPercentage: 30 }], 70, 0)).not.toThrow();
  });
});

describe("SAMPLE_BENCHMARK", () => {
  it("is clearly labelled as hypothetical with a deterministic return", () => {
    expect(SAMPLE_BENCHMARK.name).toContain("Model Benchmark");
    expect(SAMPLE_BENCHMARK.annualReturn).toBe(6.0);
  });
});

describe("validation edge cases", () => {
  it("rejects NaN quantity, entry price, and current price on a position", () => {
    // NaN must never propagate into portfolio valuations silently.
    expect(() =>
      validatePosition({ symbol: "AAPL", quantity: Number.NaN, entryPrice: 10, currentPrice: 12 })
    ).toThrow(ValidationError);
    expect(() =>
      validatePosition({ symbol: "AAPL", quantity: 1, entryPrice: Number.NaN, currentPrice: 12 })
    ).toThrow(ValidationError);
    expect(() =>
      validatePosition({ symbol: "AAPL", quantity: 1, entryPrice: 10, currentPrice: Number.NaN })
    ).toThrow(ValidationError);
  });

  it("rejects a NaN allocation percentage", () => {
    expect(() =>
      validateAllocationInput({ strategyId: "s1", allocationPercentage: Number.NaN })
    ).toThrow(ValidationError);
  });
});

describe("portfolio return math", () => {
  it("returns 0% when current value equals starting capital", () => {
    expect(portfolioReturn(1000, 1000)).toBe(0);
  });

  it("handles an empty positions list", () => {
    expect(portfolioValue(500, [])).toBe(500);
  });

  it("sums cash and position values", () => {
    expect(portfolioValue(200, [{ quantity: 3, currentPrice: 100 }])).toBe(500);
  });
});

describe("assertAllocationTotal", () => {
  it("accepts allocations that total exactly 100%", () => {
    expect(() =>
      assertAllocationTotal([{ allocationPercentage: 50 }, { allocationPercentage: 50 }])
    ).not.toThrow();
  });

  it("rejects a total that exceeds 100%", () => {
    expect(() =>
      assertAllocationTotal([{ allocationPercentage: 60 }, { allocationPercentage: 50 }])
    ).toThrow(ValidationError);
  });

  it("treats the empty allocation list as valid", () => {
    expect(() => assertAllocationTotal([])).not.toThrow();
  });

  it("rejects a NaN allocation percentage", () => {
    expect(() => assertAllocationTotal([{ allocationPercentage: Number.NaN }])).toThrow(
      ValidationError
    );
  });
});
