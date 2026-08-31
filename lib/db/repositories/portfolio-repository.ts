/**
 * MIRROR — Paper portfolio repository (server-only).
 *
 * Owns persistence for PaperPortfolio, PaperPortfolioStrategy, and
 * PortfolioEvent. Portfolios are scoped to the authenticated user and every
 * operation verifies ownership at the data boundary before reading or mutating
 * (preventing IDOR).
 *
 * All performance figures are deterministic and illustrative: the "current
 * value" is the simulated starting capital scaled by a frozen, clearly-labelled
 * model return. Nothing here is real-market data or an execution.
 */

import "server-only";
import { prisma } from "@/lib/db";
import type { PaperPortfolio, Prisma, Strategy } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  assertAllocationTotal,
  blendedAnnualReturn,
  portfolioReturn,
  SAMPLE_BENCHMARK,
  type NormalizedPortfolio,
  type NormalizedDecision,
  type NormalizedAllocation,
} from "@/lib/services/portfolio-rules";

/** Map a strategy's risk to an illustrative deterministic return bucket. */
function bucketForRisk(risk: Strategy["riskProfile"] | null): string {
  if (risk === "HIGH") return "Aggressive Bucket";
  if (risk === "MODERATE") return "Moderate Bucket";
  return "Conservative Bucket";
}

/** The shape returned by `getOwned`: a portfolio with strategies→strategy, positions, and events. */
type OwnedPortfolioDetail = Prisma.PaperPortfolioGetPayload<{
  include: {
    strategies: { include: { strategy: true } };
    positions: true;
    events: { orderBy: { createdAt: "desc" } };
  };
}>;

async function ownedPortfolio(id: string, userId: string) {
  const portfolio = await prisma.paperPortfolio.findUnique({
    where: { id },
    include: { strategies: true, positions: true },
  });
  if (!portfolio) {
    throw new NotFoundError("Portfolio not found");
  }
  if (portfolio.userId !== userId) {
    throw new ForbiddenError("You do not own this portfolio");
  }
  return portfolio;
}

export class PortfolioRepository {
  /** Create a new ACTIVE paper portfolio for the user with simulated capital. */
  async create(userId: string, data: NormalizedPortfolio): Promise<PaperPortfolio> {
    return prisma.paperPortfolio.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        startingCapital: data.startingCapital,
        currentValue: data.startingCapital,
        cashBalance: data.startingCapital,
        status: "ACTIVE",
      },
    });
  }

  /** List the user's portfolios (newest first). */
  async listForUser(userId: string) {
    return prisma.paperPortfolio.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { strategies: true },
    });
  }

  /** Get one of the user's portfolios with allocations, positions, and events. */
  async getOwned(id: string, userId: string): Promise<OwnedPortfolioDetail> {
    const portfolio = await prisma.paperPortfolio.findUnique({
      where: { id },
      include: {
        strategies: { include: { strategy: true } },
        positions: true,
        events: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!portfolio) {
      throw new NotFoundError("Portfolio not found");
    }
    if (portfolio.userId !== userId) {
      throw new ForbiddenError("You do not own this portfolio");
    }
    return portfolio;
  }

  /** Delete the user's portfolio (ownership-checked). */
  async delete(id: string, userId: string): Promise<void> {
    await ownedPortfolio(id, userId);
    await prisma.paperPortfolio.delete({ where: { id } });
  }

  /**
   * Add (or update) a strategy allocation to a portfolio. Enforces the 100%
   * total relative to the portfolio's current allocations (ownership-checked),
   * and only allows published strategies. Records a STRATEGY_ADDED event.
   */
  async addStrategyAllocation(id: string, userId: string, input: NormalizedAllocation) {
    const portfolio = await ownedPortfolio(id, userId);
    const currentTotal = portfolio.strategies.reduce(
      (sum, s) => sum + (s.allocationPercentage ?? 0),
      0
    );
    const existing = portfolio.strategies.find((s) => s.strategyId === input.strategyId);
    const existingWeight = existing?.allocationPercentage ?? 0;
    assertAllocationTotal(
      [{ allocationPercentage: input.allocationPercentage }],
      currentTotal,
      existingWeight
    );

    const strategy = await prisma.strategy.findFirst({
      where: { id: input.strategyId, status: "PUBLISHED" },
    });
    if (!strategy) {
      throw new NotFoundError("Strategy not found");
    }

    if (existing) {
      await prisma.paperPortfolioStrategy.update({
        where: { id: existing.id },
        data: { allocationPercentage: input.allocationPercentage },
      });
    } else {
      await prisma.paperPortfolioStrategy.create({
        data: {
          portfolioId: id,
          strategyId: input.strategyId,
          allocationPercentage: input.allocationPercentage,
        },
      });
      await prisma.portfolioEvent.create({
        data: {
          portfolioId: id,
          eventType: "STRATEGY_ADDED",
          description: `Added ${strategy.name} (${input.allocationPercentage}%) to the paper portfolio.`,
        },
      });
    }

    await this.recompute(id);
    return prisma.paperPortfolioStrategy.findFirstOrThrow({
      where: { portfolioId: id, strategyId: input.strategyId },
    });
  }

  /** Remove a strategy allocation (ownership-checked). Records STRATEGY_REMOVED. */
  async removeStrategyAllocation(id: string, userId: string, strategyId: string): Promise<void> {
    const portfolio = await ownedPortfolio(id, userId);
    const link = portfolio.strategies.find((s) => s.strategyId === strategyId);
    if (!link) {
      throw new NotFoundError("That strategy is not in this portfolio");
    }
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
      select: { name: true },
    });
    await prisma.paperPortfolioStrategy.delete({ where: { id: link.id } });
    await prisma.portfolioEvent.create({
      data: {
        portfolioId: id,
        eventType: "STRATEGY_REMOVED",
        description: `Removed ${strategy?.name ?? "a strategy"} from the paper portfolio.`,
      },
    });
    await this.recompute(id);
  }

  /**
   * Record a manual portfolio decision as a portfolio event (ownership-checked).
   * A summary is required; freeform decisions are stored as REBALANCE events
   * carrying the decision text (see portfolio-rules for validation).
   */
  async recordDecision(id: string, userId: string, data: NormalizedDecision) {
    await ownedPortfolio(id, userId);
    return prisma.portfolioEvent.create({
      data: {
        portfolioId: id,
        eventType: "REBALANCE",
        description: `Manual decision: ${data.summary}${data.description ? ` — ${data.description}` : ""}`,
      },
    });
  }

  /**
   * Deterministically recompute the hypothetical current value and return
   * summary from the strategy allocations. Never represents a real result.
   */
  async recompute(id: string): Promise<void> {
    const portfolio = await prisma.paperPortfolio.findUnique({
      where: { id },
      include: {
        strategies: { include: { strategy: true } },
        positions: { select: { quantity: true, currentPrice: true } },
      },
    });
    if (!portfolio) return;

    const allocations = portfolio.strategies.map((s) => ({
      allocationPercentage: s.allocationPercentage ?? 0,
      risk: s.strategy.riskProfile,
    }));
    const invested = portfolio.positions.reduce(
      (sum, p) => sum + p.quantity * (p.currentPrice ?? 0),
      0
    );
    const cashBalance = portfolio.cashBalance;
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocationPercentage, 0);

    // Deterministic illustrative current value: allocated portion grows at the
    // frozen model blended return; unallocated cash stays flat.
    const blended =
      totalAllocated > 0 ? blendedAnnualReturn(allocations, (a) => bucketForRisk(a.risk)) : 0;
    const allocatedCapital = Math.min(cashBalance + invested, portfolio.startingCapital);
    const illustrativeValue =
      allocatedCapital * (totalAllocated > 0 ? 1 + blended / 100 : 1) +
      (portfolio.startingCapital - allocatedCapital);

    // If positions exist, prefer the cash + invested deterministic valuation.
    const currentValue =
      portfolio.positions.length > 0 ? cashBalance + invested : illustrativeValue;

    await prisma.paperPortfolio.update({
      where: { id },
      data: { currentValue, cashBalance },
    });
  }

  /**
   * Deterministic performance summary presented to the learner (hypothetical).
   *
   * Accepts the already-loaded owned portfolio (from `getOwned`, which includes
   * strategies + their strategy rows) so the detail page does not run the same
   * heavy ownership query twice per render.
   */
  async performanceSummary(portfolio: OwnedPortfolioDetail) {
    const returnPct = portfolioReturn(portfolio.currentValue, portfolio.startingCapital);
    const blended = blendedAnnualReturn(
      portfolio.strategies.map((s) => ({
        allocationPercentage: s.allocationPercentage ?? 0,
        risk: s.strategy.riskProfile,
      })),
      (a) => bucketForRisk(a.risk)
    );
    return {
      currentValue: portfolio.currentValue,
      startingCapital: portfolio.startingCapital,
      returnPct,
      blendedAnnualReturn: blended,
      benchmark: SAMPLE_BENCHMARK,
      hypothetical: true,
    };
  }
}

export const portfolioRepository = new PortfolioRepository();
