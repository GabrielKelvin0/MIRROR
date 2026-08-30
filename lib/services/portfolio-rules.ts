/**
 * MIRROR — Paper portfolio business rules (pure, deterministic, testable).
 *
 * This module contains ONLY pure functions: hypothetical portfolio valuation,
 * performance and return math, allocation validation, and manual-decision
 * validation. It has no database or I/O dependency and no clock, so every
 * result is deterministic and can be unit-tested in isolation.
 *
 * IMPORTANT (financial-safety boundary): none of these figures represent real
 * investment results or executions. Everything here is hypothetical/simulated
 * and is only ever displayed with a clear "hypothetical" label.
 *
 * Server-side authorization and ownership are enforced in the repository and
 * server actions, not here. These functions validate shape, not identity.
 */

import { ValidationError } from "@/lib/errors";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface PaperPositionInput {
  symbol?: string;
  quantity?: number;
  entryPrice?: number;
  currentPrice?: number;
}

/** A normalized (validated) position entry. */
export interface NormalizedPosition {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
}

export interface PortfolioInput {
  name?: string | undefined;
  description?: string | undefined;
  startingCapital?: number;
}

/** Normalized (validated) portfolio fields. */
export interface NormalizedPortfolio {
  name: string;
  description: string | null;
  startingCapital: number;
}

export interface AllocationInput {
  strategyId?: string;
  allocationPercentage?: number;
}

/** Normalized (validated) strategy allocation. */
export interface NormalizedAllocation {
  strategyId: string;
  allocationPercentage: number;
}

export interface DecisionInput {
  summary?: string | undefined;
  description?: string | undefined;
}

/** Normalized (validated) manual portfolio decision. */
export interface NormalizedDecision {
  summary: string;
  description: string | null;
}

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

function isNonEmpty(value: string | null | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function text(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validate and normalize a portfolio input.
 * A name is required and starting capital must be a positive number.
 */
export function validatePortfolioInput(input: PortfolioInput): NormalizedPortfolio {
  if (!isNonEmpty(input.name)) {
    throw new ValidationError("Portfolio name is required", { name: "required" });
  }
  const startingCapital = input.startingCapital;
  if (
    typeof startingCapital !== "number" ||
    Number.isNaN(startingCapital) ||
    startingCapital <= 0
  ) {
    throw new ValidationError("Starting capital must be a positive number", {
      startingCapital: "invalid",
    });
  }
  return {
    name: input.name!.trim(),
    description: text(input.description),
    startingCapital,
  };
}

/** Validate and normalize a manual portfolio decision. */
export function validateDecision(input: DecisionInput): NormalizedDecision {
  if (!isNonEmpty(input.summary)) {
    throw new ValidationError("Decision summary is required", { summary: "required" });
  }
  return { summary: input.summary!.trim(), description: text(input.description) };
}

/** Validate a position: symbol, and positive numeric quantity/prices. */
export function validatePosition(input: PaperPositionInput): NormalizedPosition {
  if (!isNonEmpty(input.symbol)) {
    throw new ValidationError("Asset symbol is required", { symbol: "required" });
  }
  const quantity = input.quantity;
  const entryPrice = input.entryPrice;
  const currentPrice = input.currentPrice;
  if (typeof quantity !== "number" || Number.isNaN(quantity) || quantity <= 0) {
    throw new ValidationError("Quantity must be a positive number", { quantity: "invalid" });
  }
  if (typeof entryPrice !== "number" || Number.isNaN(entryPrice) || entryPrice <= 0) {
    throw new ValidationError("Entry price must be a positive number", { entryPrice: "invalid" });
  }
  if (typeof currentPrice !== "number" || Number.isNaN(currentPrice) || currentPrice <= 0) {
    throw new ValidationError("Current price must be a positive number", {
      currentPrice: "invalid",
    });
  }
  return {
    symbol: input.symbol!.trim().toUpperCase(),
    quantity,
    entryPrice,
    currentPrice,
  };
}

/* ------------------------------------------------------------------ */
/* Allocation validation                                               */
/* ------------------------------------------------------------------ */

/** Validate a strategy allocation: non-empty strategy id, weight 0–100. */
export function validateAllocationInput(input: {
  strategyId?: string | undefined;
  allocationPercentage?: number;
}): NormalizedAllocation {
  if (!isNonEmpty(input.strategyId)) {
    throw new ValidationError("Strategy is required", { strategyId: "required" });
  }
  const pct = input.allocationPercentage;
  if (typeof pct !== "number" || Number.isNaN(pct) || pct < 0 || pct > 100) {
    throw new ValidationError("Allocation must be between 0 and 100", {
      allocationPercentage: "range",
    });
  }
  return { strategyId: input.strategyId!.trim(), allocationPercentage: pct };
}

/* ------------------------------------------------------------------ */
/* Deterministic valuation & performance math                          */
/* ------------------------------------------------------------------ */

/**
 * Current value of a single position: quantity × current price.
 * Deterministic given its inputs.
 */
export function positionCurrentValue(position: { quantity: number; currentPrice: number }): number {
  return position.quantity * position.currentPrice;
}

/**
 * Total portfolio value: cash balance plus the sum of all current position
 * values. Deterministic given its inputs.
 */
export function portfolioValue(
  cashBalance: number,
  positions: Array<{ quantity: number; currentPrice: number }>
): number {
  const invested = positions.reduce((sum, position) => sum + positionCurrentValue(position), 0);
  return cashBalance + invested;
}

/**
 * Simple percentage return versus the simulated starting capital. Deterministic.
 */
export function portfolioReturn(currentValue: number, startingCapital: number): number {
  if (!Number.isFinite(startingCapital) || startingCapital <= 0) {
    throw new ValidationError("Starting capital must be positive to compute return", {
      startingCapital: "invalid",
    });
  }
  return ((currentValue - startingCapital) / startingCapital) * 100;
}

/* ------------------------------------------------------------------ */
/* Deterministic illustrative benchmark/return model                    */
/* ------------------------------------------------------------------ */

/**
 * Deterministic illustrative annualised return by "asset class" bucket.
 * These are frozen, educational model assumptions — never real market data and
 * never a promise of future results. They are deliberately static so that all
 * portfolio math is deterministic and reproducible.
 */
export const ILLUSTRATIVE_ASSET_RETURNS: Record<string, number> = {
  "Conservative Bucket": 3.5,
  "Moderate Bucket": 6.0,
  "Growth Bucket": 8.5,
  "Aggressive Bucket": 10.0,
  "Sample Benchmark Index": 6.0,
};

/**
 * The benchmark used for "compare with benchmarks": a single, clearly-labelled,
 * hypothetical model index with deterministic returns. Not a real index.
 */
export const SAMPLE_BENCHMARK = {
  name: "MIRROR Model Benchmark Index",
  annualReturn: ILLUSTRATIVE_ASSET_RETURNS["Sample Benchmark Index"] ?? 0,
  note: "A clearly-hypothetical sample benchmark for education only.",
} as const;

/**
 * Blended deterministic annualised return from a set of strategy allocations,
 * each mapped to an illustrative asset-class return bucket.
 *
 * Returns a percentage figure (e.g. 6.0). Deterministic given its inputs.
 */
export function blendedAnnualReturn<T extends { allocationPercentage: number }>(
  allocations: T[],
  bucketFor: (allocation: T) => string
): number {
  const total = allocations.reduce((sum, a) => sum + a.allocationPercentage, 0);
  if (total <= 0) return 0;
  const weighted = allocations.reduce((sum, a) => {
    const bucket = bucketFor(a);
    const rate = ILLUSTRATIVE_ASSET_RETURNS[bucket] ?? 0;
    return sum + (a.allocationPercentage / 100) * rate;
  }, 0);
  return weighted;
}

/** Validate allocation weights: each 0–100 and the total must not exceed 100%. */
export function assertAllocationTotal(
  allocations: Array<{ allocationPercentage: number }>,
  existingWeight: number = 0,
  replacingWeight: number = 0
): void {
  for (const allocation of allocations) {
    if (
      typeof allocation.allocationPercentage !== "number" ||
      Number.isNaN(allocation.allocationPercentage) ||
      allocation.allocationPercentage < 0 ||
      allocation.allocationPercentage > 100
    ) {
      throw new ValidationError("Allocation must be between 0 and 100", {
        allocation: "range",
      });
    }
  }
  const total = allocations.reduce((sum, a) => sum + a.allocationPercentage, 0);
  const nextTotal = existingWeight - replacingWeight + total;
  if (nextTotal > 100) {
    throw new ValidationError(`Allocations total ${nextTotal}% — they cannot exceed 100%`, {
      allocation: "total",
    });
  }
}
