/**
 * MIRROR — Product entitlement rules (pure, deterministic, testable).
 *
 * This is the FIRST of three separated concerns required by Phase 12:
 *
 *   1. PRODUCT ENTITLEMENT  — what a plan/tier may access (this module).
 *   2. SUBSCRIPTION STATE   — the user's stored plan/status (DB repository).
 *   3. PAYMENT PROVIDER     — how payments are executed/collected (lib/payments).
 *
 * This module contains ONLY pure functions that map a plan (and, for paid
 * strategies, a strategy's pricing) to a set of granted features/access. It has
 * no database, no I/O, and no payment-provider dependency, so every decision is
 * deterministic and unit-testable in isolation.
 *
 * IMPORTANT (financial-safety boundary): these rules govern product access for
 * education/entitlement only. Nothing here executes a payment, and no
 * entitlement implies a financial guarantee or future return.
 *
 * Business logic MUST live here (or in another rules module), never inside a
 * payment-provider implementation. Providers only execute/settle the payment.
 */

import { BusinessRuleError } from "@/lib/errors";

/* ------------------------------------------------------------------ */
/* Plans and features                                                   */
/* ------------------------------------------------------------------ */

/** The supported subscription plans (mirrors Prisma SubscriptionPlan). */
export type SubscriptionPlan = "FREE" | "PRO_LEARNER" | "PREMIUM_CREATOR";

/**
 * Named product features a plan can grant. Add capabilities here (the
 * "product entitlement" catalog) rather than bolting logic onto providers.
 */
export const FEATURES = {
  /** Follow published strategies (free capability). */
  FOLLOW_STRATEGIES: "follow_strategies",
  /** Create unlimited paper portfolios (free capability). */
  PAPER_PORTFOLIO: "paper_portfolio",
  /** Academy access (free capability). */
  ACADEMY: "academy",
  /** Performance & risk metrics on paper portfolios (Pro). */
  PERFORMANCE_RISK: "performance_risk",
  /** Access to PRO-only strategies (Pro / Creator). */
  PRO_STRATEGIES: "pro_strategies",
  /** Publish strategies to the marketplace (Creator). */
  PUBLISH_STRATEGIES: "publish_strategies",
  /** Premium creator tooling. */
  CREATOR_INSIGHTS: "creator_insights",
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * The feature matrix: which plan grants which feature. This is the single
 * source of truth for product entitlement. Deterministic and easily tested.
 *
 * Base features are granted to all plans; paid tiers add more.
 */
const FEATURE_MATRIX: Record<Feature, SubscriptionPlan[]> = {
  [FEATURES.FOLLOW_STRATEGIES]: ["FREE", "PRO_LEARNER", "PREMIUM_CREATOR"],
  [FEATURES.PAPER_PORTFOLIO]: ["FREE", "PRO_LEARNER", "PREMIUM_CREATOR"],
  [FEATURES.ACADEMY]: ["FREE", "PRO_LEARNER", "PREMIUM_CREATOR"],
  [FEATURES.PERFORMANCE_RISK]: ["PRO_LEARNER", "PREMIUM_CREATOR"],
  [FEATURES.PRO_STRATEGIES]: ["PRO_LEARNER", "PREMIUM_CREATOR"],
  [FEATURES.PUBLISH_STRATEGIES]: ["PREMIUM_CREATOR"],
  [FEATURES.CREATOR_INSIGHTS]: ["PREMIUM_CREATOR"],
};

/** Deterministic feature rank used to compare tiers. */
const PLAN_RANK: Record<SubscriptionPlan, number> = {
  FREE: 0,
  PRO_LEARNER: 1,
  PREMIUM_CREATOR: 2,
};

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Whether a plan grants a given feature. Deterministic.
 */
export function isPlanEntitled(plan: SubscriptionPlan, feature: Feature): boolean {
  return FEATURE_MATRIX[feature].includes(plan);
}

/** The set of features a plan grants, deterministically ordered. */
export function featuresForPlan(plan: SubscriptionPlan): Feature[] {
  return (Object.values(FEATURES) as Feature[]).filter((f) => isPlanEntitled(plan, f));
}

/**
 * Whether one plan is at least as privileged as another (for tier logic).
 * Deterministic.
 */
export function isAtLeast(plan: SubscriptionPlan, minPlan: SubscriptionPlan): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[minPlan];
}

/* ------------------------------------------------------------------ */
/* Valid plans                                                         */
/* ------------------------------------------------------------------ */

/** All known plans (used for validation). */
export const KNOWN_PLANS: SubscriptionPlan[] = ["FREE", "PRO_LEARNER", "PREMIUM_CREATOR"];

/**
 * Validate that a value is a known plan. Throws a business-rule error
 * otherwise, so callers never store an unknown plan.
 */
export function assertKnownPlan(plan: string | undefined): asserts plan is SubscriptionPlan {
  if (!plan || !KNOWN_PLANS.includes(plan as SubscriptionPlan)) {
    throw new BusinessRuleError("Unknown subscription plan");
  }
}

/* ------------------------------------------------------------------ */
/* Paid strategy access                                                 */
/* ------------------------------------------------------------------ */

/**
 * Pricing of a strategy for entitlement purposes.
 * A "free" strategy (no price) is accessible to any plan.
 */
export interface StrategyPricing {
  /** Price in a minor currency unit (e.g. cents), when the strategy is paid. */
  priceMinor?: number | null;
  /**
   * Whether the strategy is a PRO-only strategy that requires a paid plan
   * (beyond holding the strategy subscription itself). Defaults to false.
   */
  requiresProPlan?: boolean;
}

/* The three separated concerns, applied to a single strategy grant. */
export interface StrategyAccessContext {
  /** Concern 1: product entitlement — the user's plan. */
  plan: SubscriptionPlan;
  /** Concern 2: subscription state — does the user hold an active sub for this strategy? */
  holdsStrategySubscription: boolean;
  /** Concern 3: pricing config from the strategy itself. */
  strategy: StrategyPricing;
}

export type StrategyAccessDecision =
  | { allowed: true; gatingFeature: Feature | null }
  | {
      allowed: false;
      reason: "requires_pro_plan" | "requires_strategy_subscription";
      gatingFeature: Feature | null;
    };

/**
 * Decide whether a learner may access a strategy given their plan, whether they
 * hold an active strategy subscription, and the strategy's pricing.
 *
 * Deterministic and provider-agnostic: it never touches a payment provider, it
 * only reasons about the three concerns above.
 */
export function strategyAccess(ctx: StrategyAccessContext): StrategyAccessDecision {
  const { plan, holdsStrategySubscription, strategy } = ctx;

  const isPaid = !!strategy.priceMinor && strategy.priceMinor > 0;

  if (!isPaid) {
    return { allowed: true, gatingFeature: null };
  }

  // Paid strategy, but PRO-only requiring a paid plan.
  if (strategy.requiresProPlan && !isAtLeast(plan, "PRO_LEARNER")) {
    return { allowed: false, reason: "requires_pro_plan", gatingFeature: FEATURES.PRO_STRATEGIES };
  }

  // Paid strategy: the user must hold an active subscription for it.
  if (!holdsStrategySubscription) {
    return {
      allowed: false,
      reason: "requires_strategy_subscription",
      gatingFeature: FEATURES.PRO_STRATEGIES,
    };
  }

  return { allowed: true, gatingFeature: FEATURES.PRO_STRATEGIES };
}
