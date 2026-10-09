/** Ownership-scoped paper portfolios. All figures are educational simulations. */
import "server-only";
import { prisma } from "@/lib/db/client";
import { Prisma, type PaperPortfolio } from "@prisma/client";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import {
  assertAllocationTotal,
  blendedAnnualReturn,
  portfolioReturn,
  SAMPLE_BENCHMARK,
  validateAllocationInput,
  validateDecision,
  type NormalizedPortfolio,
  type NormalizedDecision,
  type NormalizedAllocation,
} from "@/lib/services/portfolio-rules";
import {
  allocationTotal,
  planRebalance,
  recordedHoldingsValue,
  validateAllocationReason,
  validateRebalanceInput,
  type NormalizedRebalance,
} from "@/lib/services/portfolio-maturity";

const strategyInclude = {
  strategy: { select: { id: true, name: true, riskProfile: true, status: true } },
} as const;

const mutableInclude = {
  strategies: { include: strategyInclude, orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
  positions: true,
} as const satisfies Prisma.PaperPortfolioInclude;
const transactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  timeout: 10000,
} as const;
type MutablePortfolio = Prisma.PaperPortfolioGetPayload<{ include: typeof mutableInclude }>;
type SimulatedPortfolio = Pick<PaperPortfolio, "cashBalance" | "startingCapital"> & {
  strategies: Array<{ allocationPercentage: number; strategy: { riskProfile: string | null } }>;
  positions: Array<{ quantity: number; entryPrice: number; currentPrice: number | null }>;
};

const detailInclude = {
  ...mutableInclude,
  events: {
    take: 100,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { allocationDeltas: { orderBy: { strategyName: "asc" } } },
  },
} as const satisfies Prisma.PaperPortfolioInclude;
export type OwnedPortfolioDetail = Prisma.PaperPortfolioGetPayload<{
  include: typeof detailInclude;
}>;

function bucketForRisk(risk: string | null): string {
  if (risk === "HIGH") return "Aggressive Bucket";
  if (risk === "MODERATE") return "Moderate Bucket";
  return "Conservative Bucket";
}

function illustrativeBlend(allocations: SimulatedPortfolio["strategies"]) {
  return blendedAnnualReturn(allocations, (a) => bucketForRisk(a.strategy.riskProfile));
}

function simulatedValue(portfolio: SimulatedPortfolio) {
  if (portfolio.positions.length > 0) {
    return recordedHoldingsValue(portfolio.cashBalance, portfolio.positions);
  }
  const capital = Math.min(portfolio.cashBalance, portfolio.startingCapital);
  const value =
    capital * (1 + illustrativeBlend(portfolio.strategies) / 100) +
    (portfolio.startingCapital - capital);
  return Number.isFinite(value) ? value : null;
}

/** Every allocation mutation locks the same owned parent before reading weights. */
async function lockOwnedPortfolio(
  tx: Prisma.TransactionClient,
  id: string,
  userId: string,
  active = true
) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id" FROM "PaperPortfolio"
    WHERE "id" = ${id} AND "userId" = ${userId} FOR UPDATE
  `);
  if (rows.length === 0) throw new NotFoundError("Portfolio not found");
  const portfolio = await tx.paperPortfolio.findFirst({
    where: { id, userId },
    include: mutableInclude,
  });
  if (!portfolio) throw new NotFoundError("Portfolio not found");
  if (active && portfolio.status !== "ACTIVE") {
    throw new BusinessRuleError("Archived portfolios cannot be changed");
  }
  return portfolio;
}

async function recompute(tx: Prisma.TransactionClient, portfolio: MutablePortfolio) {
  const currentValue = simulatedValue(portfolio);
  // Unknown recorded prices must not silently become zero or overwrite the cache.
  await tx.paperPortfolio.update({
    where: { id: portfolio.id },
    data: currentValue === null ? { updatedAt: new Date() } : { currentValue },
  });
}

export class PortfolioRepository {
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

  async listForUser(userId: string) {
    const portfolios = await prisma.paperPortfolio.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        strategies: {
          select: { allocationPercentage: true, strategy: { select: { riskProfile: true } } },
        },
        positions: { select: { quantity: true, entryPrice: true, currentPrice: true } },
      },
    });
    return portfolios.map((portfolio) => ({
      ...portfolio,
      simulatedValue: simulatedValue(portfolio),
    }));
  }

  async getOwned(id: string, userId: string): Promise<OwnedPortfolioDetail> {
    const portfolio = await prisma.paperPortfolio.findFirst({
      where: { id, userId },
      include: detailInclude,
    });
    if (!portfolio) throw new NotFoundError("Portfolio not found");
    return portfolio;
  }

  async delete(id: string, userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await lockOwnedPortfolio(tx, id, userId, false);
      await tx.paperPortfolio.delete({ where: { id } });
    }, transactionOptions);
  }

  /** Add/update, value, and immutable history commit or roll back together. */
  async addStrategyAllocation(id: string, userId: string, input: NormalizedAllocation) {
    const data = validateAllocationInput(input);
    return prisma.$transaction(async (tx) => {
      const portfolio = await lockOwnedPortfolio(tx, id, userId);
      const before = allocationTotal(portfolio.strategies);
      const existing = portfolio.strategies.find((s) => s.strategyId === data.strategyId);
      assertAllocationTotal([data], before, existing?.allocationPercentage ?? 0);
      const strategy = await tx.strategy.findFirst({
        where: { id: data.strategyId, status: "PUBLISHED" },
        select: { id: true, name: true, riskProfile: true, status: true },
      });
      if (!strategy) throw new NotFoundError("Strategy not found");
      if (existing?.allocationPercentage === data.allocationPercentage) return existing;
      const reasoning = existing
        ? validateAllocationReason(data.reasoning, true)
        : (data.reasoning ?? null);
      const link = existing
        ? await tx.paperPortfolioStrategy.update({
            where: { id: existing.id },
            data: { allocationPercentage: data.allocationPercentage },
          })
        : await tx.paperPortfolioStrategy.create({
            data: {
              portfolioId: id,
              strategyId: data.strategyId,
              allocationPercentage: data.allocationPercentage,
            },
          });
      const strategies = [
        ...portfolio.strategies.filter((s) => s.strategyId !== data.strategyId),
        { ...link, strategy },
      ];
      await tx.portfolioEvent.create({
        data: {
          portfolioId: id,
          eventType: existing ? "REBALANCE" : "STRATEGY_ADDED",
          description: `${existing ? "Updated" : "Added"} ${strategy.name} in the simulated allocation plan.`,
          reasoning,
          allocatedBefore: before,
          allocatedAfter: allocationTotal(strategies),
          allocationDeltas: {
            create: [
              {
                strategyId: strategy.id,
                strategyName: strategy.name,
                beforePercentage: existing?.allocationPercentage ?? null,
                afterPercentage: data.allocationPercentage,
              },
            ],
          },
        },
      });
      await recompute(tx, { ...portfolio, strategies });
      return link;
    }, transactionOptions);
  }

  async removeStrategyAllocation(
    id: string,
    userId: string,
    strategyId: string,
    reasoning?: string | null
  ): Promise<void> {
    const explanation = validateAllocationReason(reasoning);
    await prisma.$transaction(async (tx) => {
      const portfolio = await lockOwnedPortfolio(tx, id, userId);
      const link = portfolio.strategies.find((s) => s.strategyId === strategyId);
      if (!link) throw new NotFoundError("That strategy is not in this portfolio");
      const strategies = portfolio.strategies.filter((s) => s.strategyId !== strategyId);
      await tx.paperPortfolioStrategy.delete({ where: { id: link.id } });
      await tx.portfolioEvent.create({
        data: {
          portfolioId: id,
          eventType: "STRATEGY_REMOVED",
          description: `Removed ${link.strategy.name} from the simulated allocation plan.`,
          reasoning: explanation,
          allocatedBefore: allocationTotal(portfolio.strategies),
          allocatedAfter: allocationTotal(strategies),
          allocationDeltas: {
            create: [
              {
                strategyId,
                strategyName: link.strategy.name,
                beforePercentage: link.allocationPercentage,
                afterPercentage: null,
              },
            ],
          },
        },
      });
      await recompute(tx, { ...portfolio, strategies });
    }, transactionOptions);
  }

  /** Rebalance existing targets only; paper positions and recorded cash are untouched. */
  async rebalance(id: string, userId: string, input: NormalizedRebalance) {
    const data = validateRebalanceInput(input);
    return prisma.$transaction(async (tx) => {
      const portfolio = await lockOwnedPortfolio(tx, id, userId);
      const plan = planRebalance(
        portfolio.strategies.map((s) => ({
          strategyId: s.strategyId,
          strategyName: s.strategy.name,
          status: s.strategy.status,
          allocationPercentage: s.allocationPercentage,
        })),
        data
      );
      for (const delta of plan.deltas) {
        await tx.paperPortfolioStrategy.update({
          where: { portfolioId_strategyId: { portfolioId: id, strategyId: delta.strategyId } },
          data: { allocationPercentage: delta.afterPercentage! },
        });
      }
      const event = await tx.portfolioEvent.create({
        data: {
          portfolioId: id,
          eventType: "REBALANCE",
          description: `Rebalanced ${plan.deltas.length} simulated strategy allocation${plan.deltas.length === 1 ? "" : "s"}.`,
          reasoning: data.reasoning,
          allocatedBefore: plan.allocatedBefore,
          allocatedAfter: plan.allocatedAfter,
          allocationDeltas: { create: plan.deltas },
        },
      });
      const weights = new Map(data.changes.map((c) => [c.strategyId, c.allocationPercentage]));
      await recompute(tx, {
        ...portfolio,
        strategies: portfolio.strategies.map((s) => ({
          ...s,
          allocationPercentage: weights.get(s.strategyId)!,
        })),
      });
      return event;
    }, transactionOptions);
  }

  /** A note never changes allocations and is never presented as an executed rebalance. */
  async recordDecision(id: string, userId: string, input: NormalizedDecision) {
    const data = validateDecision({
      summary: input.summary,
      description: input.description ?? undefined,
    });
    return prisma.$transaction(async (tx) => {
      await lockOwnedPortfolio(tx, id, userId);
      return tx.portfolioEvent.create({
        data: {
          portfolioId: id,
          eventType: "REBALANCE",
          description: `Manual decision: ${data.summary}${data.description ? ` — ${data.description}` : ""}`,
        },
      });
    }, transactionOptions);
  }

  async performanceSummary(portfolio: OwnedPortfolioDetail) {
    const currentValue = simulatedValue(portfolio);
    return {
      currentValue,
      startingCapital: portfolio.startingCapital,
      returnPct:
        currentValue === null ? null : portfolioReturn(currentValue, portfolio.startingCapital),
      blendedAnnualReturn: illustrativeBlend(portfolio.strategies),
      benchmark: SAMPLE_BENCHMARK,
      hypothetical: true,
      basis:
        portfolio.positions.length > 0
          ? ("recorded-prices" as const)
          : ("illustrative-model" as const),
    };
  }
}

export const portfolioRepository = new PortfolioRepository();
