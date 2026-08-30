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
import { prisma } from "@/lib/db";
import type { StrategyStatus, Strategy, StrategyUpdate } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  validateStrategy,
  validateAllocation,
  validateStrategyUpdate,
  assertTransition,
  type StrategyInput,
  type AllocationInput,
  type StrategyUpdateInput,
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
    const strategy = await ownedStrategy(id, creatorId);
    assertTransition(strategy.status as StrategyStatus, to);
    return prisma.strategy.update({
      where: { id },
      data: {
        status: to,
        publishedAt: to === "PUBLISHED" ? new Date() : strategy.publishedAt,
      },
    });
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
        effectiveDate: data.effectiveDate as Date,
      },
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
            creatorProfile: { select: { bio: true, investmentPhilosophy: true } },
          },
        },
        allocations: { orderBy: { targetWeight: "desc" } },
        updates: {
          where: { effectiveDate: { lte: new Date() } },
          orderBy: { effectiveDate: "desc" },
          take: 5,
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
        creator: { select: { firstName: true, lastName: true } },
      },
    });
  }
}

export const strategyRepository = new StrategyRepository();
