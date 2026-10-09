import { describe, expect, it } from "vitest";
import {
  allocationTotal,
  holdingSnapshot,
  planRebalance,
  recordedHoldingsValue,
  validateRebalanceInput,
} from "./portfolio-maturity";

const current = [
  {
    strategyId: "growth",
    strategyName: "Growth at the time",
    status: "PUBLISHED",
    allocationPercentage: 40,
  },
  { strategyId: "bonds", strategyName: "Bonds", status: "PUBLISHED", allocationPercentage: 40 },
];
const changes = [
  { strategyId: "growth", expectedPercentage: 40, allocationPercentage: 30 },
  { strategyId: "bonds", expectedPercentage: 40, allocationPercentage: 50 },
];
const input = () => validateRebalanceInput({ changes, reasoning: " Reduce growth concentration " });

describe("Simulated rebalance planning", () => {
  it("derives immutable names and before values from authoritative state and retains the reserve", () => {
    expect(planRebalance(current, input())).toEqual({
      allocatedBefore: 80,
      allocatedAfter: 80,
      deltas: [
        {
          strategyId: "growth",
          strategyName: "Growth at the time",
          beforePercentage: 40,
          afterPercentage: 30,
        },
        { strategyId: "bonds", strategyName: "Bonds", beforePercentage: 40, afterPercentage: 50 },
      ],
    });
    expect(input().reasoning).toBe("Reduce growth concentration");
  });

  it("rejects stale before values instead of using them as history", () => {
    expect(() =>
      planRebalance([{ ...current[0]!, allocationPercentage: 45 }, current[1]!], input())
    ).toThrow(/Refresh/);
  });

  it("rejects a changed strategy set, including a newly added allocation", () => {
    expect(() => planRebalance(current.slice(1), input())).toThrow(/Refresh/);
    expect(() =>
      planRebalance(
        [...current, { ...current[0]!, strategyId: "extra", allocationPercentage: 5 }],
        input()
      )
    ).toThrow(/Refresh/);
  });

  it("rejects a no-op rebalance without inventing an event", () => {
    const data = validateRebalanceInput({
      changes: changes.map((c) => ({ ...c, allocationPercentage: 40 })),
      reasoning: "Review",
    });
    expect(() => planRebalance(current, data)).toThrow(/Change at least one/);
  });

  it("allows a decrease of an unpublished allocation, but never an increase", () => {
    const rows = [{ ...current[0]!, status: "ARCHIVED" }, current[1]!];
    expect(planRebalance(rows, input()).deltas[0]?.afterPercentage).toBe(30);
    const data = validateRebalanceInput({
      changes: [{ ...changes[0]!, allocationPercentage: 45 }, changes[1]!],
      reasoning: "Review",
    });
    expect(() => planRebalance(rows, data)).toThrow(/only be reduced/);
  });

  it.each([NaN, Infinity, -1, 101, "30", null])("rejects non-percentage weights: %s", (value) => {
    expect(() =>
      validateRebalanceInput({
        changes: [{ ...changes[0], allocationPercentage: value }],
        reasoning: "Review",
      })
    ).toThrow();
  });

  it("rejects duplicate IDs, more than 100 rows, missing explanations, and totals above 100", () => {
    expect(() =>
      validateRebalanceInput({ changes: [changes[0], changes[0]], reasoning: "Review" })
    ).toThrow(/exactly once/);
    expect(() =>
      validateRebalanceInput({
        changes: Array.from({ length: 101 }, (_, i) => ({ ...changes[0], strategyId: `s${i}` })),
        reasoning: "Review",
      })
    ).toThrow(/100/);
    expect(() => validateRebalanceInput({ changes, reasoning: "  " })).toThrow(/Explain/);
    expect(() =>
      validateRebalanceInput({
        changes: changes.map((c) => ({ ...c, allocationPercentage: 60 })),
        reasoning: "Review",
      })
    ).toThrow(/exceed 100/);
  });

  it("handles decimal totals without a false overflow", () => {
    expect(
      allocationTotal([
        { allocationPercentage: 33.3 },
        { allocationPercentage: 33.3 },
        { allocationPercentage: 33.4 },
      ])
    ).toBe(100);
  });
});

describe("Recorded paper holding values", () => {
  it("calculates cost, value, and gain only from recorded quantity and prices", () => {
    expect(holdingSnapshot({ quantity: 10, entryPrice: 20, currentPrice: 25 })).toEqual({
      costBasis: 200,
      currentValue: 250,
      profitLoss: 50,
      profitLossPercentage: 25,
    });
    expect(recordedHoldingsValue(100, [{ quantity: 10, entryPrice: 20, currentPrice: 25 }])).toBe(
      350
    );
  });

  it("does not treat a missing price as zero or reuse cached valuations", () => {
    expect(holdingSnapshot({ quantity: 10, entryPrice: 20, currentPrice: null })).toEqual({
      costBasis: 200,
      currentValue: null,
      profitLoss: null,
      profitLossPercentage: null,
    });
    expect(
      recordedHoldingsValue(100, [{ quantity: 10, entryPrice: 20, currentPrice: null }])
    ).toBeNull();
  });

  it("distinguishes a recorded zero price from an unknown price", () => {
    expect(holdingSnapshot({ quantity: 10, entryPrice: 20, currentPrice: 0 })).toEqual({
      costBasis: 200,
      currentValue: 0,
      profitLoss: -200,
      profitLossPercentage: -100,
    });
  });

  it("keeps invalid or overflowing legacy values unavailable", () => {
    expect(
      holdingSnapshot({ quantity: Infinity, entryPrice: 20, currentPrice: 25 }).currentValue
    ).toBeNull();
    expect(
      holdingSnapshot({ quantity: 1e300, entryPrice: 1e300, currentPrice: 1e300 }).currentValue
    ).toBeNull();
    expect(recordedHoldingsValue(NaN, [])).toBeNull();
  });
});
