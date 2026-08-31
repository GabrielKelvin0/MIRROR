import { describe, it, expect } from "vitest";
import {
  FEATURES,
  isPlanEntitled,
  featuresForPlan,
  isAtLeast,
  assertKnownPlan,
  strategyAccess,
  type StrategyAccessContext,
} from "./entitlement-rules";
import { BusinessRuleError } from "@/lib/errors";

/**
 * Deterministic unit tests for the Phase 12 product-entitlement rules
 * (lib/services/entitlement-rules.ts). These confirm the feature matrix and
 * paid-strategy access logic without any database or provider dependency.
 */

describe("isPlanEntitled / feature matrix", () => {
  it("grants free features to the FREE plan", () => {
    expect(isPlanEntitled("FREE", FEATURES.FOLLOW_STRATEGIES)).toBe(true);
    expect(isPlanEntitled("FREE", FEATURES.PAPER_PORTFOLIO)).toBe(true);
    expect(isPlanEntitled("FREE", FEATURES.ACADEMY)).toBe(true);
  });

  it("does not grant free-tier users the Pro-only features", () => {
    expect(isPlanEntitled("FREE", FEATURES.PERFORMANCE_RISK)).toBe(false);
    expect(isPlanEntitled("FREE", FEATURES.PRO_STRATEGIES)).toBe(false);
    expect(isPlanEntitled("FREE", FEATURES.PUBLISH_STRATEGIES)).toBe(false);
  });

  it("grants Pro features to the Pro and Creator plans", () => {
    expect(isPlanEntitled("PRO_LEARNER", FEATURES.PERFORMANCE_RISK)).toBe(true);
    expect(isPlanEntitled("PRO_LEARNER", FEATURES.PRO_STRATEGIES)).toBe(true);
    expect(isPlanEntitled("PREMIUM_CREATOR", FEATURES.PRO_STRATEGIES)).toBe(true);
  });

  it("only grants creator tooling to the creator plan", () => {
    expect(isPlanEntitled("PRO_LEARNER", FEATURES.PUBLISH_STRATEGIES)).toBe(false);
    expect(isPlanEntitled("PREMIUM_CREATOR", FEATURES.PUBLISH_STRATEGIES)).toBe(true);
    expect(isPlanEntitled("PREMIUM_CREATOR", FEATURES.CREATOR_INSIGHTS)).toBe(true);
  });
});

describe("featuresForPlan", () => {
  it("returns a deterministic, ordered list per plan", () => {
    const free = featuresForPlan("FREE");
    expect(free).toContain(FEATURES.ACADEMY);
    expect(free).not.toContain(FEATURES.PERFORMANCE_RISK);
    // Same input, same order every time.
    expect(featuresForPlan("FREE")).toEqual(free);
  });

  it("is a superset as plans get more privileged", () => {
    const free = new Set(featuresForPlan("FREE"));
    const pro = new Set(featuresForPlan("PRO_LEARNER"));
    expect([...free].every((f) => pro.has(f))).toBe(true);
  });
});

describe("isAtLeast", () => {
  it("orders plans by privilege", () => {
    expect(isAtLeast("FREE", "FREE")).toBe(true);
    expect(isAtLeast("PRO_LEARNER", "FREE")).toBe(true);
    expect(isAtLeast("PREMIUM_CREATOR", "PRO_LEARNER")).toBe(true);
    expect(isAtLeast("FREE", "PRO_LEARNER")).toBe(false);
    expect(isAtLeast("PRO_LEARNER", "PREMIUM_CREATOR")).toBe(false);
  });
});

describe("assertKnownPlan", () => {
  it("accepts known plans and rejects unknown ones", () => {
    expect(() => assertKnownPlan("PRO_LEARNER")).not.toThrow();
    expect(() => assertKnownPlan("NOT_A_PLAN")).toThrow(BusinessRuleError);
    expect(() => assertKnownPlan(undefined)).toThrow(BusinessRuleError);
  });
});

describe("strategyAccess", () => {
  const base: StrategyAccessContext = {
    plan: "FREE",
    holdsStrategySubscription: false,
    strategy: { priceMinor: null },
  };

  it("allows free (unpriced) strategies to any plan", () => {
    expect(strategyAccess(base)).toEqual({ allowed: true, gatingFeature: null });
  });

  it("allows a paid strategy when the user holds an active subscription", () => {
    const ctx: StrategyAccessContext = {
      plan: "FREE",
      holdsStrategySubscription: true,
      strategy: { priceMinor: 999 },
    };
    expect(strategyAccess(ctx).allowed).toBe(true);
  });

  it("blocks a paid strategy without an active subscription", () => {
    const ctx: StrategyAccessContext = {
      plan: "FREE",
      holdsStrategySubscription: false,
      strategy: { priceMinor: 999 },
    };
    const decision = strategyAccess(ctx);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("requires_strategy_subscription");
    }
  });

  it("blocks a PRO-only paid strategy for free users even with a subscription", () => {
    // Contract: holding a strategy subscription does not bypass the plan gate.
    const ctx: StrategyAccessContext = {
      plan: "FREE",
      holdsStrategySubscription: true,
      strategy: { priceMinor: 999, requiresProPlan: true },
    };
    const decision = strategyAccess(ctx);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("requires_pro_plan");
    }
  });

  it("allows a PRO-only paid strategy to Pro learners who subscribe", () => {
    const ctx: StrategyAccessContext = {
      plan: "PRO_LEARNER",
      holdsStrategySubscription: true,
      strategy: { priceMinor: 999, requiresProPlan: true },
    };
    expect(strategyAccess(ctx).allowed).toBe(true);
  });

  it("treats a zero price as free", () => {
    const ctx: StrategyAccessContext = { ...base, strategy: { priceMinor: 0 } };
    expect(strategyAccess(ctx).allowed).toBe(true);
  });

  it("denies a paid strategy to even the highest tier without a subscription", () => {
    // Contract: subscription state is independent of plan tier. A
    // PREMIUM_CREATOR still must hold the strategy subscription to view a
    // paid strategy — no plan entitlement bypasses the subscription gate.
    const ctx: StrategyAccessContext = {
      plan: "PREMIUM_CREATOR",
      holdsStrategySubscription: false,
      strategy: { priceMinor: 999, requiresProPlan: true },
    };
    const decision = strategyAccess(ctx);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("requires_strategy_subscription");
    }
  });

  it("treats an undefined price as a free strategy", () => {
    const ctx: StrategyAccessContext = { ...base, strategy: {} };
    expect(strategyAccess(ctx).allowed).toBe(true);
  });

  it("does not apply the pro-plan gate when requiresProPlan is falsy", () => {
    const ctx: StrategyAccessContext = {
      plan: "FREE",
      holdsStrategySubscription: true,
      strategy: { priceMinor: 999 },
    };
    expect(strategyAccess(ctx).allowed).toBe(true);
  });
});
