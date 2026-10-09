/** Pure planning and valuation rules. No market feed, recommendations, or execution. */
import { ValidationError } from "@/lib/errors";
import { assertAllocationTotal } from "./portfolio-rules";

export type RebalanceChange = {
  strategyId: string;
  expectedPercentage: number;
  allocationPercentage: number;
};

export type NormalizedRebalance = {
  changes: RebalanceChange[];
  reasoning: string;
};

export type AllocationState = {
  strategyId: string;
  strategyName: string;
  status: string;
  allocationPercentage: number;
};

export type AllocationDelta = {
  strategyId: string;
  strategyName: string;
  beforePercentage: number | null;
  afterPercentage: number | null;
};

export function validateAllocationReason(value: string | null | undefined, required = false) {
  const reasoning = value?.trim() || null;
  if (required && !reasoning) {
    throw new ValidationError("Explain why you are changing this simulated allocation");
  }
  if ((reasoning?.length ?? 0) > 5000) {
    throw new ValidationError("Keep the explanation within 5000 characters");
  }
  return reasoning;
}

export function allocationTotal(allocations: Array<{ allocationPercentage: number }>) {
  assertAllocationTotal(allocations);
  return Math.round(allocations.reduce((sum, a) => sum + a.allocationPercentage, 0) * 1e10) / 1e10;
}

/** Expected weights detect stale forms; history always uses the database weights. */
export function validateRebalanceInput(input: {
  changes: unknown;
  reasoning?: string | null | undefined;
}): NormalizedRebalance {
  if (!Array.isArray(input.changes) || input.changes.length < 1 || input.changes.length > 100) {
    throw new ValidationError("A rebalance must contain between 1 and 100 strategy allocations");
  }
  const seen = new Set<string>();
  const changes = input.changes.map((value: unknown): RebalanceChange => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new ValidationError("Invalid rebalance allocation");
    }
    const row = value as Record<string, unknown>;
    const id = row["strategyId"];
    const before = row["expectedPercentage"];
    const after = row["allocationPercentage"];
    if (typeof id !== "string" || !id.trim() || id.length > 255 || seen.has(id.trim())) {
      throw new ValidationError("Each strategy must appear exactly once in the rebalance");
    }
    for (const percentage of [before, after]) {
      if (
        typeof percentage !== "number" ||
        !Number.isFinite(percentage) ||
        percentage < 0 ||
        percentage > 100
      ) {
        throw new ValidationError("Allocation must be a finite percentage between 0 and 100");
      }
    }
    seen.add(id.trim());
    return {
      strategyId: id.trim(),
      expectedPercentage: before as number,
      allocationPercentage: after as number,
    };
  });
  allocationTotal(changes);
  return { changes, reasoning: validateAllocationReason(input.reasoning, true)! };
}

export function planRebalance(current: AllocationState[], input: NormalizedRebalance) {
  const changes = new Map(input.changes.map((c) => [c.strategyId, c]));
  if (current.length !== changes.size || current.some((row) => !changes.has(row.strategyId))) {
    throw new ValidationError("Allocations changed since this page opened. Refresh and try again");
  }
  const deltas: AllocationDelta[] = [];
  for (const row of current) {
    const change = changes.get(row.strategyId)!;
    if (row.allocationPercentage !== change.expectedPercentage) {
      throw new ValidationError(
        "Allocations changed since this page opened. Refresh and try again"
      );
    }
    if (row.status !== "PUBLISHED" && change.allocationPercentage > row.allocationPercentage) {
      throw new ValidationError("Unpublished strategies can only be reduced or removed");
    }
    if (row.allocationPercentage !== change.allocationPercentage) {
      deltas.push({
        strategyId: row.strategyId,
        strategyName: row.strategyName,
        beforePercentage: row.allocationPercentage,
        afterPercentage: change.allocationPercentage,
      });
    }
  }
  if (deltas.length === 0) {
    throw new ValidationError("Change at least one allocation before recording a rebalance");
  }
  return {
    deltas,
    allocatedBefore: allocationTotal(current),
    allocatedAfter: allocationTotal(input.changes),
  };
}

export type PositionPrices = { quantity: number; entryPrice: number; currentPrice: number | null };

/** Ignore stale cached position values. A missing price is unknown, not zero. */
export function holdingSnapshot(position: PositionPrices) {
  const { quantity, entryPrice, currentPrice } = position;
  const product = (price: number | null) => {
    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      price === null ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return null;
    }
    const value = quantity * price;
    return Number.isFinite(value) ? value : null;
  };
  const costBasis = product(entryPrice);
  const currentValue = product(currentPrice);
  const difference = costBasis !== null && currentValue !== null ? currentValue - costBasis : null;
  const profitLoss = difference !== null && Number.isFinite(difference) ? difference : null;
  const ratio =
    costBasis !== null && costBasis > 0 && profitLoss !== null
      ? (profitLoss / costBasis) * 100
      : null;
  const profitLossPercentage = ratio !== null && Number.isFinite(ratio) ? ratio : null;
  return { costBasis, currentValue, profitLoss, profitLossPercentage };
}

export function recordedHoldingsValue(cashBalance: number, positions: PositionPrices[]) {
  if (!Number.isFinite(cashBalance) || cashBalance < 0) return null;
  let value = cashBalance;
  for (const position of positions) {
    const holding = holdingSnapshot(position);
    if (holding.currentValue === null) return null;
    value += holding.currentValue;
  }
  return Number.isFinite(value) ? value : null;
}
