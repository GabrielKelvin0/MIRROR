/**
 * MIRROR — Strategy repository (server-only).
 *
 * Owns all persistence for Strategy, StrategyAllocation, and StrategyUpdate.
 * Enforces OWNERSHIP at the data boundary: every creator-scoped operation
 * verifies that the authenticated local user is the strategy's owner before
 * reading or mutating an owned resource (preventing IDOR).
 *
 * Public reads are strictly filtered to PUBLISHED strategies and never return
 * drafts, editorial fields, or unpublished content to non-owner callers.
 */

import "server-only";
import { prisma } from "@/lib/db/client";
import {
  lockMembership,
  lockStrategy,
  moderationTransactionOptions,
} from "@/lib/db/moderation-locks";
import type { StrategyStatus, Strategy, StrategyUpdate } from "@prisma/client";
import { BusinessRuleError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  validateStrategy,
  validateAllocation,
  validateStrategyUpdate,
  validateStructuredDecision,
  validateResultingAllocationTotal,
  assertTransition,
  isPublishable,
  type StrategyInput,
  type AllocationInput,
  type StrategyUpdateInput,
  type StructuredDecisionInput,
} from "@/lib/services/strategy-rules";

type OwnedStrategy = Strategy;

/**
 * Fetch a strategy by id and assert the caller owns it.
 * Returns the row or throws NotFound/Forbidden.
 */
async function ownedStrategy(id: string, creatorId: string): Promise<OwnedStrategy> {
  const strategy = await prisma.strategy.findUnique({ where: { id } });
  if (!strategy) {
    throw new NotFoundError("Strategy not found");
  }
  if (strategy.creatorId !== creatorId) {
    throw new ForbiddenError("You do not own this strategy");
  }
  return strategy;
}

/** Check whether a user has a CreatorProfile; create a minimal one if absent. */
export async function ensureCreatorProfile(userId: string) {
  const existing = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.creatorProfile.create({
    data: { userId },
  });
}

export class StrategyRepository {
  /** Create a new DRAFT strategy owned by creator. */
  async createDraft(creatorId: string, input: StrategyInput) {
    const data = validateStrategy(input);
    return prisma.strategy.create({
      data: {
        creatorId,
        status: "DRAFT",
        name: data.name as string,
        description: data.description,
        philosophy: data.philosophy,
        objective: data.objective,
        riskProfile: data.riskProfile ?? null,
        timeHorizon: data.timeHorizon,
        thesis: data.thesis,
        decisionRules: data.decisionRules,
        rebalancePolicy: data.rebalancePolicy,
        exitConditions: data.exitConditions,
        invalidatingConditions: data.invalidatingConditions,
      },
    });
  }

  /** List all strategies owned by the creator (drafts, published, archived). */
  async listByCreator(creatorId: string) {
    return prisma.strategy.findMany({
      where: { creatorId },
      orderBy: { updatedAt: "desc" },
      include: { allocations: true, _count: { select: { updates: true } } },
    });
  }

  /** Get one of the caller's strategies by id (ownership-checked). */
  async getOwned(id: string, creatorId: string): Promise<OwnedStrategy> {
    return ownedStrategy(id, creatorId);
  }

  /**
   * Get one of the caller's strategies (ownership-checked) with its allocations
   * and updates in a single query. Keeps the creator edit page to one ownership
   * query instead of re-checking ownership once per collection (N+1 avoidance).
   */
  async getOwnedDetail(id: string, creatorId: string) {
    const strategy = await prisma.strategy.findUnique({
      where: { id },
      include: {
        allocations: true,
        updates: {
          orderBy: { effectiveDate: "desc" },
          include: { allocationDeltas: { orderBy: { createdAt: "asc" } } },
        },
      },
    });
    if (!strategy) {
      throw new NotFoundError("Strategy not found");
    }
    if (strategy.creatorId !== creatorId) {
      throw new ForbiddenError("You do not own this strategy");
    }
    return strategy;
  }

  /** Edit strategy fields (ownership-checked). */
  async update(id: string, creatorId: string, input: StrategyInput) {
    await ownedStrategy(id, creatorId);
    const data = validateStrategy(input);
    return prisma.strategy.update({
      where: { id },
      data: {
        name: data.name as string,
        description: data.description,
        philosophy: data.philosophy,
        objective: data.objective,
        riskProfile: data.riskProfile ?? null,
        timeHorizon: data.timeHorizon,
        thesis: data.thesis,
        decisionRules: data.decisionRules,
        rebalancePolicy: data.rebalancePolicy,
        exitConditions: data.exitConditions,
        invalidatingConditions: data.invalidatingConditions,
      },
    });
  }

  /** Transition a strategy's status (ownership + transition-checked). */
  async setStatus(id: string, creatorId: string, to: StrategyStatus) {
    return prisma.$transaction(async (tx) => {
      await lockMembership(tx);
      const creator = await tx.user.findUnique({
        where: { id: creatorId },
        select: { role: true },
      });
      if (creator?.role !== "CREATOR") throw new ForbiddenError("Creator access is required");
      await lockStrategy(tx, id);
      const strategy = await tx.strategy.findFirst({ where: { id, creatorId } });
      if (!strategy) throw new ForbiddenError("You do not own this strategy");
      assertTransition(strategy.status, to);
      if (
        to === "PUBLISHED" &&
        !isPublishable({ name: strategy.name, riskProfile: strategy.riskProfile ?? "" })
      ) {
        throw new BusinessRuleError("A name and valid risk profile are required before publishing");
      }
      return tx.strategy.update({
        where: { id },
        data: { status: to, publishedAt: to === "PUBLISHED" ? new Date() : strategy.publishedAt },
      });
    }, moderationTransactionOptions);
  }

  /** Allocations for one of the caller's strategies (ownership-checked). */
  async listAllocations(id: string, creatorId: string) {
    await ownedStrategy(id, creatorId);
    return prisma.strategyAllocation.findMany({ where: { strategyId: id } });
  }

  /**
   * Add an allocation, enforcing the 100% total cap relative to the
   * strategy's current allocations (ownership-checked).
   */
  async addAllocation(strategyId: string, creatorId: string, input: AllocationInput) {
    await ownedStrategy(strategyId, creatorId);
    const current = await prisma.strategyAllocation.aggregate({
      where: { strategyId },
      _sum: { targetWeight: true },
    });
    const total = current._sum.targetWeight ?? 0;
    validateAllocation(input, total, 0);
    return prisma.strategyAllocation.create({
      data: {
        strategyId,
        assetClass: (input.assetClass as string).trim(),
        targetWeight: input.targetWeight as number,
        reasoning: input.reasoning?.trim() || null,
      },
    });
  }

  /** Update an allocation (ownership via strategy + allocation exists-check). */
  async updateAllocation(
    strategyId: string,
    creatorId: string,
    allocationId: string,
    input: AllocationInput
  ) {
    await ownedStrategy(strategyId, creatorId);
    const allocation = await prisma.strategyAllocation.findFirst({
      where: { id: allocationId, strategyId },
    });
    if (!allocation) {
      throw new NotFoundError("Allocation not found");
    }
    const current = await prisma.strategyAllocation.aggregate({
      where: { strategyId },
      _sum: { targetWeight: true },
    });
    const total = current._sum.targetWeight ?? 0;
    validateAllocation(input, total, allocation.targetWeight);
    return prisma.strategyAllocation.update({
      where: { id: allocationId },
      data: {
        assetClass: (input.assetClass as string).trim(),
        targetWeight: input.targetWeight as number,
        reasoning: input.reasoning?.trim() || null,
      },
    });
  }

  /** Remove an allocation (ownership-checked). */
  async deleteAllocation(strategyId: string, creatorId: string, allocationId: string) {
    await ownedStrategy(strategyId, creatorId);
    const allocation = await prisma.strategyAllocation.findFirst({
      where: { id: allocationId, strategyId },
    });
    if (!allocation) {
      throw new NotFoundError("Allocation not found");
    }
    return prisma.strategyAllocation.delete({ where: { id: allocationId } });
  }

  /** List updates for one of the caller's strategies (ownership-checked). */
  async listUpdates(id: string, creatorId: string) {
    const strategy = await ownedStrategy(id, creatorId);
    return prisma.strategyUpdate.findMany({
      where: { strategyId: strategy.id },
      orderBy: { effectiveDate: "desc" },
      include: { allocationDeltas: { orderBy: { createdAt: "asc" } } },
    });
  }

  /** Publish a strategy update (ownership-checked; updates belong to the creator). */
  async addUpdate(
    strategyId: string,
    creatorId: string,
    input: StrategyUpdateInput
  ): Promise<StrategyUpdate> {
    await ownedStrategy(strategyId, creatorId);
    const data = validateStrategyUpdate(input);
    return prisma.strategyUpdate.create({
      data: {
        strategyId,
        title: data.title as string,
        description: data.description as string,
        changesSummary: data.changesSummary,
        reasoning: data.reasoning,
        riskAssessment: data.riskAssessment,
        evidence: null,
        assumptionChanges: null,
        kind: "UPDATE",
        effectiveDate: data.effectiveDate as Date,
      },
    });
  }

  /**
   * Publish a first-class structured decision for an owned PUBLISHED strategy.
   *
   * Any allocation changes are derived from authoritative database state and
   * applied in the same transaction as the decision and immutable delta
   * snapshots. A validation or persistence failure rolls the whole operation
   * back.
   */
  async addStructuredDecision(
    strategyId: string,
    creatorId: string,
    input: StructuredDecisionInput
  ) {
    const data = validateStructuredDecision(input);

    return prisma.$transaction(async (tx) => {
      const strategy = await tx.strategy.findUnique({
        where: { id: strategyId },
        select: { id: true, creatorId: true, status: true },
      });

      if (!strategy) {
        throw new NotFoundError("Strategy not found");
      }
      if (strategy.creatorId !== creatorId) {
        throw new ForbiddenError("You do not own this strategy");
      }
      if (strategy.status !== "PUBLISHED") {
        throw new BusinessRuleError(
          "Structured decisions can only be published for PUBLISHED strategies"
        );
      }

      const allocations = await tx.strategyAllocation.findMany({
        where: { strategyId },
        orderBy: { createdAt: "asc" },
      });
      const allocationById = new Map(
        allocations.map((allocation) => [allocation.id, allocation] as const)
      );

      const deltaPlans = data.allocationChanges.map((change) => {
        const allocation = allocationById.get(change.allocationId);
        if (!allocation) {
          throw new NotFoundError("Allocation not found");
        }

        const beforePercentage = allocation.targetWeight;
        const afterPercentage = change.afterPercentage;

        if (afterPercentage !== null && beforePercentage === afterPercentage) {
          throw new ValidationError("Allocation before and after values cannot be identical", {
            afterPercentage: "no-change",
          });
        }

        return {
          allocationId: allocation.id,
          assetClass: allocation.assetClass,
          beforePercentage,
          afterPercentage,
        };
      });

      const planByAllocation = new Map<string, number | null>(
        deltaPlans.map((plan) => [plan.allocationId, plan.afterPercentage] as const)
      );
      const resultingWeights = allocations.flatMap((allocation) => {
        if (!planByAllocation.has(allocation.id)) {
          return [allocation.targetWeight];
        }
        const after = planByAllocation.get(allocation.id);
        return after === null || after === undefined ? [] : [after];
      });
      validateResultingAllocationTotal(resultingWeights);

      const update = await tx.strategyUpdate.create({
        data: {
          strategyId,
          kind: "DECISION",
          title: data.title,
          description: data.description,
          changesSummary: data.changesSummary,
          reasoning: data.reasoning,
          riskAssessment: data.riskAssessment,
          evidence: data.evidence,
          assumptionChanges: data.assumptionChanges,
          effectiveDate: data.effectiveDate,
        },
      });

      for (const plan of deltaPlans) {
        if (plan.afterPercentage === null) {
          await tx.strategyAllocation.delete({ where: { id: plan.allocationId } });
        } else {
          await tx.strategyAllocation.update({
            where: { id: plan.allocationId },
            data: { targetWeight: plan.afterPercentage },
          });
        }
      }

      if (deltaPlans.length > 0) {
        await tx.strategyUpdateAllocationDelta.createMany({
          data: deltaPlans.map((plan) => ({
            strategyUpdateId: update.id,
            assetClass: plan.assetClass,
            beforePercentage: plan.beforePercentage,
            afterPercentage: plan.afterPercentage,
          })),
        });
      }

      return tx.strategyUpdate.findUniqueOrThrow({
        where: { id: update.id },
        include: { allocationDeltas: { orderBy: { createdAt: "asc" } } },
      });
    });
  }

  /**
   * Public read: return a PUBLISHED strategy with creator context, or null.
   * Never returns drafts, archived, or unpublished content to public callers.
   */
  async getPublished(id: string) {
    return prisma.strategy.findFirst({
      where: { id, status: "PUBLISHED" },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            creatorProfile: {
              select: {
                bio: true,
                investmentPhilosophy: true,
                isVerified: true,
                yearsOfExperience: true,
              },
            },
          },
        },
        allocations: { orderBy: { targetWeight: "desc" } },
        updates: {
          where: { effectiveDate: { lte: new Date() } },
          orderBy: { effectiveDate: "desc" },
          take: 10,
          include: { allocationDeltas: { orderBy: { createdAt: "asc" } } },
        },
      },
    });
  }

  /** Public read: list PUBLISHED strategies only. */
  async listPublished() {
    return prisma.strategy.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            creatorProfile: { select: { isVerified: true } },
          },
        },
      },
    });
  }
}

/**
 * Public (PUBLISHED-only) strategy detail row returned by getPublished.
 */
export type PublishedStrategyDetail = NonNullable<
  Awaited<ReturnType<StrategyRepository["getPublished"]>>
>;

/**
 * Public (PUBLISHED-only) strategy summary row returned by listPublished.
 */
export type PublishedStrategySummary = Awaited<
  ReturnType<StrategyRepository["listPublished"]>
>[number];

export const strategyRepository = new StrategyRepository();
