/**
 * MIRROR — Strategy business rules (pure, testable).
 *
 * This module contains ONLY pure functions: input validation and strategy
 * status/state logic. It has no database or I/O dependency, so it can be
 * unit-tested in isolation (see strategy-rules.test.ts).
 *
 * Server-side authorization and ownership are enforced in the repository and
 * server actions, not here. These functions validate shape, not identity.
 */

import type { StrategyStatus } from "@prisma/client";
import { ValidationError, BusinessRuleError } from "@/lib/errors";

/** Risk profiles accepted on a Strategy record. */
export const RISK_PROFILES = ["LOW", "MODERATE", "HIGH"] as const;
export type RiskProfile = (typeof RISK_PROFILES)[number];

/** Allowed status transitions (source -> target). */
export const ALLOWED_TRANSITIONS: Record<StrategyStatus, StrategyStatus[]> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

export interface StrategyInput {
  name?: string;
  description?: string;
  philosophy?: string;
  objective?: string;
  riskProfile?: string;
  timeHorizon?: string;
  thesis?: string;
  decisionRules?: string;
  rebalancePolicy?: string;
  exitConditions?: string;
  invalidatingConditions?: string;
}

/** Normalized (validated) strategy fields. Blank text is stored as null. */
export interface NormalizedStrategyData {
  name: string;
  description: string | null;
  philosophy: string | null;
  objective: string | null;
  riskProfile: string | null;
  timeHorizon: string | null;
  thesis: string | null;
  decisionRules: string | null;
  rebalancePolicy: string | null;
  exitConditions: string | null;
  invalidatingConditions: string | null;
}

export interface AllocationInput {
  assetClass?: string;
  targetWeight?: number;
  reasoning?: string;
}

export interface StrategyUpdateInput {
  title?: string;
  description?: string;
  changesSummary?: string;
  reasoning?: string;
  riskAssessment?: string;
  effectiveDate?: Date;
}

/** Normalized (validated) strategy update fields. Blank text is stored as null. */
export interface NormalizedStrategyUpdate {
  title: string;
  description: string;
  changesSummary: string | null;
  reasoning: string | null;
  riskAssessment: string | null;
  effectiveDate: Date;
}

/** Trim and normalize a single text input, or return null when blank. */
function text(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isNonEmpty(value: string | null | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function isRiskProfile(value: string | null | undefined): boolean {
  return value != null && (RISK_PROFILES as readonly string[]).includes(value.trim().toUpperCase());
}

/** Is a strategy publishable? A name and a risk profile are required. */
export function isPublishable(input: StrategyInput): boolean {
  return isNonEmpty(input.name) && isRiskProfile(input.riskProfile);
}

/** Validate and normalize a StrategyInput. Throws ValidationError on bad input. */
export function validateStrategy(input: StrategyInput): NormalizedStrategyData {
  const name = text(input.name);
  if (!name) {
    throw new ValidationError("Strategy name is required", { name: "required" });
  }

  const riskProfile = text(input.riskProfile)?.toUpperCase();
  if (riskProfile && !isRiskProfile(riskProfile)) {
    throw new ValidationError("Risk profile must be LOW, MODERATE or HIGH", {
      riskProfile: "invalid",
    });
  }

  return {
    name,
    description: text(input.description),
    philosophy: text(input.philosophy),
    objective: text(input.objective),
    riskProfile: riskProfile ?? null,
    timeHorizon: text(input.timeHorizon),
    thesis: text(input.thesis),
    decisionRules: text(input.decisionRules),
    rebalancePolicy: text(input.rebalancePolicy),
    exitConditions: text(input.exitConditions),
    invalidatingConditions: text(input.invalidatingConditions),
  };
}

/** Validate an allocation input. Weights must be 0–100 and total 100 across a strategy. */
export function validateAllocation(
  input: AllocationInput,
  currentTotal: number,
  existingWeight: number = 0
): void {
  if (!isNonEmpty(input.assetClass)) {
    throw new ValidationError("Asset class is required", { assetClass: "required" });
  }
  if (input.targetWeight == null) {
    throw new ValidationError("Target weight is required", { targetWeight: "required" });
  }
  if (typeof input.targetWeight !== "number" || Number.isNaN(input.targetWeight)) {
    throw new ValidationError("Target weight must be a number", { targetWeight: "invalid" });
  }
  if (input.targetWeight < 0 || input.targetWeight > 100) {
    throw new ValidationError("Target weight must be between 0 and 100", {
      targetWeight: "range",
    });
  }
  const nextTotal = currentTotal - existingWeight + input.targetWeight;
  if (nextTotal > 100) {
    throw new ValidationError(`Allocations total ${nextTotal}% — they cannot exceed 100%`, {
      targetWeight: "total",
    });
  }
}

/** Validate a strategy update input. Title and effective date are required. */
export function validateStrategyUpdate(input: StrategyUpdateInput): NormalizedStrategyUpdate {
  if (!isNonEmpty(input.title)) {
    throw new ValidationError("Update title is required", { title: "required" });
  }
  if (!isNonEmpty(input.description)) {
    throw new ValidationError("Update description is required", { description: "required" });
  }
  if (input.effectiveDate == null || Number.isNaN(input.effectiveDate.getTime())) {
    throw new ValidationError("Effective date is required", { effectiveDate: "required" });
  }
  return {
    title: text(input.title) as string,
    description: text(input.description) as string,
    changesSummary: text(input.changesSummary),
    reasoning: text(input.reasoning),
    riskAssessment: text(input.riskAssessment),
    effectiveDate: input.effectiveDate,
  };
}

/** Throw BusinessRuleError if `from -> to` is not an allowed transition. */
export function assertTransition(from: StrategyStatus, to: StrategyStatus): void {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BusinessRuleError(`Cannot change a ${from} strategy to ${to} status`);
  }
}
