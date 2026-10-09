import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import { validateRebalanceInput } from "@/lib/services/portfolio-maturity";

const mocks = vi.hoisted(() => ({
  root: {
    paperPortfolio: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
  tx: {
    $queryRaw: vi.fn(),
    paperPortfolio: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    strategy: { findFirst: vi.fn() },
    paperPortfolioStrategy: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    portfolioEvent: { create: vi.fn() },
  },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: mocks.root }));
import { PortfolioRepository, type OwnedPortfolioDetail } from "./portfolio-repository";

const repository = new PortfolioRepository();
function fixture(): OwnedPortfolioDetail {
  const timestamp = new Date("2026-10-07T12:00:00Z");
  return {
    id: "mine",
    userId: "owner",
    name: "Learning",
    description: null,
    status: "ACTIVE",
    startingCapital: 1000,
    currentValue: 999999,
    cashBalance: 1000,
    createdAt: timestamp,
    updatedAt: timestamp,
    positions: [],
    events: [],
    strategies: [
      {
        id: "link-growth",
        portfolioId: "mine",
        strategyId: "growth",
        allocationPercentage: 40,
        createdAt: timestamp,
        strategy: {
          id: "growth",
          name: "Growth snapshot",
          status: "PUBLISHED",
          riskProfile: "HIGH",
        },
      },
      {
        id: "link-bonds",
        portfolioId: "mine",
        strategyId: "bonds",
        allocationPercentage: 40,
        createdAt: timestamp,
        strategy: { id: "bonds", name: "Bonds", status: "PUBLISHED", riskProfile: "MODERATE" },
      },
    ],
  };
}
const rebalanceInput = () =>
  validateRebalanceInput({
    reasoning: "Reduce concentration",
    changes: [
      { strategyId: "growth", expectedPercentage: 40, allocationPercentage: 30 },
      { strategyId: "bonds", expectedPercentage: 40, allocationPercentage: 50 },
    ],
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.root.$transaction.mockImplementation(
    async (callback: (tx: typeof mocks.tx) => Promise<unknown>) => callback(mocks.tx)
  );
  mocks.tx.$queryRaw.mockResolvedValue([{ id: "mine" }]);
  mocks.tx.paperPortfolio.findFirst.mockResolvedValue(fixture());
  mocks.tx.paperPortfolioStrategy.update.mockImplementation(async ({ where, data }) => ({
    ...fixture().strategies.find(
      (s) => s.id === where.id || s.strategyId === where.portfolioId_strategyId?.strategyId
    ),
    ...data,
  }));
  mocks.tx.portfolioEvent.create.mockResolvedValue({ id: "event" });
  mocks.tx.strategy.findFirst.mockResolvedValue(fixture().strategies[0]!.strategy);
});

describe("Portfolio allocation persistence", () => {
  it("locks the owned parent using bound parameters before reading weights", async () => {
    await repository.rebalance("mine", "owner", rebalanceInput());
    const query = mocks.tx.$queryRaw.mock.calls[0]![0] as Prisma.Sql;
    expect(query.values).toEqual(["mine", "owner"]);
    expect(query.sql).toContain("FOR UPDATE");
    expect(mocks.tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.tx.paperPortfolio.findFirst.mock.invocationCallOrder[0]!
    );
    expect(mocks.root.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "ReadCommitted",
      timeout: 10000,
    });
  });

  it("commits all weights, their authoritative snapshots, explanation, and valuation in one transaction", async () => {
    await repository.rebalance("mine", "owner", rebalanceInput());
    expect(mocks.root.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.paperPortfolioStrategy.update).toHaveBeenCalledTimes(2);
    expect(mocks.tx.portfolioEvent.create).toHaveBeenCalledWith({
      data: {
        portfolioId: "mine",
        eventType: "REBALANCE",
        description: "Rebalanced 2 simulated strategy allocations.",
        reasoning: "Reduce concentration",
        allocatedBefore: 80,
        allocatedAfter: 80,
        allocationDeltas: {
          create: [
            {
              strategyId: "growth",
              strategyName: "Growth snapshot",
              beforePercentage: 40,
              afterPercentage: 30,
            },
            {
              strategyId: "bonds",
              strategyName: "Bonds",
              beforePercentage: 40,
              afterPercentage: 50,
            },
          ],
        },
      },
    });
    expect(mocks.tx.paperPortfolio.update).toHaveBeenCalledWith({
      where: { id: "mine" },
      data: { currentValue: 1060 },
    });
  });

  it("rejects foreign/missing portfolios at the lock before loading data or writing", async () => {
    mocks.tx.$queryRaw.mockResolvedValue([]);
    for (const action of [
      () => repository.rebalance("foreign", "owner", rebalanceInput()),
      () =>
        repository.addStrategyAllocation("foreign", "owner", {
          strategyId: "growth",
          allocationPercentage: 30,
        }),
      () => repository.removeStrategyAllocation("foreign", "owner", "growth"),
      () => repository.recordDecision("foreign", "owner", { summary: "Review", description: null }),
      () => repository.delete("foreign", "owner"),
    ])
      await expect(action()).rejects.toThrow(NotFoundError);
    expect(mocks.tx.paperPortfolio.findFirst).not.toHaveBeenCalled();
    expect(mocks.tx.paperPortfolioStrategy.update).not.toHaveBeenCalled();
    expect(mocks.tx.portfolioEvent.create).not.toHaveBeenCalled();
  });

  it("rejects stale forms and archived portfolios before mutating", async () => {
    const stale = fixture();
    stale.strategies[0]!.allocationPercentage = 45;
    mocks.tx.paperPortfolio.findFirst.mockResolvedValue(stale);
    await expect(repository.rebalance("mine", "owner", rebalanceInput())).rejects.toThrow(
      /Refresh/
    );
    mocks.tx.paperPortfolio.findFirst.mockResolvedValue({ ...fixture(), status: "ARCHIVED" });
    await expect(repository.rebalance("mine", "owner", rebalanceInput())).rejects.toThrow(
      BusinessRuleError
    );
    expect(mocks.tx.paperPortfolioStrategy.update).not.toHaveBeenCalled();
    expect(mocks.tx.portfolioEvent.create).not.toHaveBeenCalled();
  });

  it("lets persistence errors escape the transaction so Prisma rolls back the whole rebalance", async () => {
    mocks.tx.portfolioEvent.create.mockRejectedValue(new Error("History insert failed"));
    await expect(repository.rebalance("mine", "owner", rebalanceInput())).rejects.toThrow(
      "History insert failed"
    );
    expect(mocks.tx.paperPortfolioStrategy.update).toHaveBeenCalledTimes(2);
    expect(mocks.tx.paperPortfolio.update).not.toHaveBeenCalled();
  });

  it("captures an existing weight edit instead of silently overwriting its history", async () => {
    await repository.addStrategyAllocation("mine", "owner", {
      strategyId: "growth",
      allocationPercentage: 30,
      reasoning: "Reduce concentration",
    });
    expect(mocks.tx.portfolioEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "REBALANCE",
          allocatedBefore: 80,
          allocatedAfter: 70,
          allocationDeltas: {
            create: [
              {
                strategyId: "growth",
                strategyName: "Growth snapshot",
                beforePercentage: 40,
                afterPercentage: 30,
              },
            ],
          },
        }),
      })
    );
  });

  it("requires an explanation on the legacy single-weight update path too", async () => {
    await expect(
      repository.addStrategyAllocation("mine", "owner", {
        strategyId: "growth",
        allocationPercentage: 30,
      })
    ).rejects.toThrow(/Explain/);
    expect(mocks.tx.paperPortfolioStrategy.update).not.toHaveBeenCalled();
    expect(mocks.tx.portfolioEvent.create).not.toHaveBeenCalled();
  });

  it("keeps the portfolio list consistent with unknown recorded prices", async () => {
    const portfolio = fixture();
    portfolio.positions = [
      {
        id: "p",
        portfolioId: "mine",
        strategyId: null,
        symbol: "TEST",
        quantity: 10,
        entryPrice: 20,
        currentPrice: null,
        currentValue: 500,
        percentOfPortfolio: 50,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.createdAt,
      },
    ];
    mocks.root.paperPortfolio.findMany.mockResolvedValue([portfolio]);
    expect((await repository.listForUser("owner"))[0]?.simulatedValue).toBeNull();
    expect(mocks.root.paperPortfolio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "owner" } })
    );
  });

  it("captures added and removed allocations with null endpoints and historical names", async () => {
    const link = {
      id: "new",
      portfolioId: "mine",
      strategyId: "new-strategy",
      allocationPercentage: 10,
      createdAt: new Date(),
    };
    mocks.tx.strategy.findFirst.mockResolvedValue({
      id: "new-strategy",
      name: "Original name",
      riskProfile: "LOW",
      status: "PUBLISHED",
    });
    mocks.tx.paperPortfolioStrategy.create.mockResolvedValue(link);
    await repository.addStrategyAllocation("mine", "owner", {
      strategyId: "new-strategy",
      allocationPercentage: 10,
    });
    expect(mocks.tx.portfolioEvent.create.mock.calls[0]![0].data.allocationDeltas.create).toEqual([
      {
        strategyId: "new-strategy",
        strategyName: "Original name",
        beforePercentage: null,
        afterPercentage: 10,
      },
    ]);
    await repository.removeStrategyAllocation("mine", "owner", "growth", "Reconsidering risks");
    expect(mocks.tx.portfolioEvent.create.mock.calls[1]![0].data.allocationDeltas.create).toEqual([
      {
        strategyId: "growth",
        strategyName: "Growth snapshot",
        beforePercentage: 40,
        afterPercentage: null,
      },
    ]);
  });

  it("rejects over-allocation and unpublished additions; identical weights produce no event", async () => {
    await expect(
      repository.addStrategyAllocation("mine", "owner", {
        strategyId: "third",
        allocationPercentage: 30,
      })
    ).rejects.toThrow(/exceed 100/);
    mocks.tx.strategy.findFirst.mockResolvedValue(null);
    await expect(
      repository.addStrategyAllocation("mine", "owner", {
        strategyId: "third",
        allocationPercentage: 10,
      })
    ).rejects.toThrow(NotFoundError);
    mocks.tx.strategy.findFirst.mockResolvedValue(fixture().strategies[0]!.strategy);
    await repository.addStrategyAllocation("mine", "owner", {
      strategyId: "growth",
      allocationPercentage: 40,
    });
    expect(mocks.tx.paperPortfolioStrategy.create).not.toHaveBeenCalled();
    expect(mocks.tx.paperPortfolioStrategy.update).not.toHaveBeenCalled();
    expect(mocks.tx.portfolioEvent.create).not.toHaveBeenCalled();
  });

  it("records a decision note without changing weights or creating false snapshots", async () => {
    await repository.recordDecision("mine", "owner", {
      summary: "Review",
      description: "No change yet",
    });
    expect(mocks.tx.portfolioEvent.create).toHaveBeenCalledWith({
      data: {
        portfolioId: "mine",
        eventType: "REBALANCE",
        description: "Manual decision: Review — No change yet",
      },
    });
    expect(mocks.tx.paperPortfolioStrategy.update).not.toHaveBeenCalled();
  });

  it("scopes history reads in the database query", async () => {
    mocks.root.paperPortfolio.findFirst.mockResolvedValue(null);
    await expect(repository.getOwned("foreign", "owner")).rejects.toThrow(NotFoundError);
    expect(mocks.root.paperPortfolio.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "foreign", userId: "owner" } })
    );
  });

  it("does not display a stale cache as the current holding value", async () => {
    const portfolio = fixture();
    portfolio.positions = [
      {
        id: "p",
        portfolioId: "mine",
        strategyId: null,
        symbol: "TEST",
        quantity: 10,
        entryPrice: 20,
        currentPrice: null,
        currentValue: 500,
        percentOfPortfolio: 50,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.createdAt,
      },
    ];
    expect((await repository.performanceSummary(portfolio)).currentValue).toBeNull();
    portfolio.positions[0]!.currentPrice = 25;
    expect((await repository.performanceSummary(portfolio)).currentValue).toBe(1250);
  });
});
