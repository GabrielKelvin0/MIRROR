/**
 * MIRROR — Strategy business rules (pure, testable).
 *
 * This module contains ONLY pure functions: input validation and strategy
 * status/state logic. It has no database or I/O dependency, so it can be
 * unit-tested in isolation.
 */

import type { StrategyStatus, StrategyUpdateKind } from "@prisma/client";
import { ValidationError, BusinessRuleError } from "@/lib/errors";

export const RISK_PROFILES = ["LOW", "MODERATE", "HIGH"] as const;
export type RiskProfile = (typeof RISK_PROFILES)[number];

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
  evidence?: string;
  assumptionChanges?: string;
  kind?: StrategyUpdateKind;
}

export interface AllocationDeltaInput {
  assetClass?: string;
  beforePercentage?: number | null;
  afterPercentage?: number | null;
}

export interface StructuredDecisionInput extends StrategyUpdateInput {
  kind?: "DECISION";
  allocationChanges?: AllocationDeltaInput[];
}

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

export interface NormalizedStrategyUpdate {
  title: string;
  description: string;
  changesSummary: string | null;
  reasoning: string | null;
  riskAssessment: string | null;
  evidence: string | null;
  assumptionChanges: string | null;
  effectiveDate: Date;
  kind: StrategyUpdateKind;
}

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

function isFinitePercentage(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function isPublishable(input: StrategyInput): boolean {
  return isNonEmpty(input.name) && isRiskProfile(input.riskProfile);
}

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
    evidence: text(input.evidence),
    assumptionChanges: text(input.assumptionChanges),
    effectiveDate: input.effectiveDate,
    kind: input.kind ?? "UPDATE",
  };
}

export function validateStructuredDecision(
  input: StructuredDecisionInput
): NormalizedStrategyUpdate & { allocationChanges: AllocationDeltaInput[] } {
  const base = validateStrategyUpdate(input);

  if (!isNonEmpty(input.changesSummary)) {
    throw new ValidationError("What changed is required for a structured decision", {
      changesSummary: "required",
    });
  }
  if (!isNonEmpty(input.reasoning)) {
    throw new ValidationError("Why it changed is required for a structured decision", {
      reasoning: "required",
    });
  }
  if (!isNonEmpty(input.evidence)) {
    throw new ValidationError("Evidence is required for a structured decision", {
      evidence: "required",
    });
  }
  if (!isNonEmpty(input.riskAssessment)) {
    throw new ValidationError("Risk assessment is required for a structured decision", {
      riskAssessment: "required",
    });
  }
  if (input.kind && input.kind !== "DECISION") {
    throw new ValidationError("Decision kind must be DECISION", { kind: "invalid" });
  }

  const allocationChanges = input.allocationChanges ?? [];
  const seen = new Set<string>();
  for (const change of allocationChanges) {
    if (!isNonEmpty(change.assetClass)) {
      throw new ValidationError("Allocation asset class is required", { assetClass: "required" });
    }
    const normalizedAsset = change.assetClass!.trim();
    if (seen.has(normalizedAsset)) {
      throw new ValidationError(`Duplicate allocation change for ${normalizedAsset}`, {
        assetClass: "duplicate",
      });
    }
    seen.add(normalizedAsset);

    if (!isFinitePercentage(change.afterPercentage)) {
      throw new ValidationError("Allocation after-value must be between 0 and 100", {
        targetWeight: "invalid",
      });
    }
    if (change.beforePercentage != null && !isFinitePercentage(change.beforePercentage)) {
      throw new ValidationError("Allocation before-value must be between 0 and 100", {
        targetWeight: "invalid",
      });
    }
    if (
      change.beforePercentage != null &&
      change.afterPercentage != null &&
      change.beforePercentage === change.afterPercentage
    ) {
      throw new ValidationError("Allocation before and after values cannot be identical", {
        targetWeight: "no-change",
      });
    }
  }

  return {
    ...base,
    kind: "DECISION",
    allocationChanges,
  };
}

export function assertTransition(from: StrategyStatus, to: StrategyStatus): void {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BusinessRuleError(`Cannot change a ${from} strategy to ${to} status`);
  }
}
