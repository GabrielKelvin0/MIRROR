/**
 * MIRROR — Subscription repository (server-only).
 *
 * This is the SEPARATE "subscription state" boundary (Phase 12, concern 2 of 3).
 * It owns persistence of a user's subscription row and its entitlement rows,
 * plus "paid strategy subscription" state. It does NOT decide WHAT a plan may
 * access (that's concern 1, lib/services/entitlement-rules.ts) and it does NOT
 * execute payments (that's concern 3, lib/payments/provider.ts).
 *
 * Strategy-subscription STATE is recorded as an Entitlement whose feature key is
 * "strategy:<strategyId>" on the user's own active subscription. The pure rule
 * `strategyAccess` then combines this state with the user's plan and the
 * strategy's pricing to decide access. This keeps a per-strategy paid
 * subscription inside the existing schema without a fabricated model.
 */

import "server-only";
import { prisma } from "@/lib/db";
import {
  featuresForPlan,
  assertKnownPlan,
  strategyAccess,
  type StrategyAccessContext,
  type SubscriptionPlan,
  type StrategyPricing,
} from "@/lib/services/entitlement-rules";
import { BusinessRuleError } from "@/lib/errors";

/** Entitlement feature key used to represent a held strategy subscription. */
function strategyFeature(strategyId: string): string {
  return `strategy:${strategyId}`;
}

export class SubscriptionRepository {
  /** Get the user's active plan, materialising a FREE/ACTIVE row if absent. */
  async planForUser(userId: string) {
    const existing = await prisma.subscription.findUnique({ where: { userId } });
    if (existing) return existing;
    return prisma.subscription.create({ data: { userId, plan: "FREE", status: "ACTIVE" } });
  }

  /**
   * Apply a subscription plan to a user: set the plan + status and sync the
   * entitlement rows derived from the pure feature matrix. This changes
   * subscription STATE only; it never charges anyone.
   */
  async applyPlan(userId: string, planInput: string, statusInput: string = "ACTIVE") {
    assertKnownPlan(planInput);
    const plan: SubscriptionPlan = planInput;
    const status = statusInput === "ACTIVE" ? "ACTIVE" : "CANCELLED";

    const subscription = await this.planForUser(userId);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { plan, status },
    });

    // Rebuild entitlements to match the pure feature matrix for this plan.
    const features = featuresForPlan(plan);
    await prisma.entitlement.deleteMany({ where: { subscriptionId: subscription.id } });
    if (features.length > 0) {
      await prisma.entitlement.createMany({
        data: features.map((feature) => ({ subscriptionId: subscription.id, feature })),
        skipDuplicates: true,
      });
    }
    return subscription;
  }

  /** Whether the user currently holds an active subscription for a strategy. */
  async holdsStrategySubscription(userId: string, strategyId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription || subscription.status !== "ACTIVE") return false;
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        subscriptionId_feature: {
          subscriptionId: subscription.id,
          feature: strategyFeature(strategyId),
        },
      },
    });
    return entitlement != null;
  }

  /** Record (or revoke) a held strategy subscription for a user. State only. */
  async setStrategySubscription(
    userId: string,
    strategyId: string,
    active: boolean
  ): Promise<void> {
    const subscription = await this.planForUser(userId);
    if (active) {
      await prisma.entitlement.upsert({
        where: {
          subscriptionId_feature: {
            subscriptionId: subscription.id,
            feature: strategyFeature(strategyId),
          },
        },
        update: {},
        create: { subscriptionId: subscription.id, feature: strategyFeature(strategyId) },
      });
    } else {
      await prisma.entitlement.deleteMany({
        where: { subscriptionId: subscription.id, feature: strategyFeature(strategyId) },
      });
    }
  }

  /**
   * Compute a full entitlement summary for a learner: their active plan, the
   * features that plan grants, and per-strategy access decisions computed by
   * the pure `strategyAccess` rule.
   *
   * This must be called with the authenticated user's id (identity is never
   * supplied by the client).
   */
  async learnerEntitlementSummary(
    userId: string,
    strategies: Array<{ id: string; pricing: StrategyPricing }>
  ) {
    const subscription = await this.planForUser(userId);
    const plan = (subscription.plan ?? "FREE") as SubscriptionPlan;

    const strategyDecisions = await Promise.all(
      strategies.map(async (s) => {
        const holds = await this.holdsStrategySubscription(userId, s.id);
        const context: StrategyAccessContext = {
          plan,
          holdsStrategySubscription: holds,
          strategy: s.pricing,
        };
        return { strategyId: s.id, decision: strategyAccess(context) };
      })
    );

    return {
      plan,
      status: subscription.status ?? "ACTIVE",
      features: featuresForPlan(plan),
      strategyDecisions,
    };
  }

  /**
   * Access gate used by server actions when a learner opens a paid strategy:
   * throws unless the pure rule grants access. Not a payment — a permission check.
   */
  async assertCanAccessStrategy(userId: string, strategyId: string, pricing: StrategyPricing) {
    const subscription = await this.planForUser(userId);
    const plan = (subscription.plan ?? "FREE") as SubscriptionPlan;
    const holds = await this.holdsStrategySubscription(userId, strategyId);
    const decision = strategyAccess({ plan, holdsStrategySubscription: holds, strategy: pricing });
    if (!decision.allowed) {
      throw new BusinessRuleError("You do not have access to this strategy");
    }
    return decision;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
