import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  tx: {
    $queryRaw: vi.fn(),
    user: { findUnique: vi.fn() },
    strategy: { findFirst: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { $transaction: mocks.transaction } }));
import { strategyRepository } from "./strategy-repository";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation((fn: (tx: typeof mocks.tx) => unknown) => fn(mocks.tx));
  mocks.tx.$queryRaw.mockResolvedValue([{ id: "strategy", locked: 1 }]);
  mocks.tx.user.findUnique.mockResolvedValue({ role: "CREATOR" });
  mocks.tx.strategy.findFirst.mockResolvedValue({
    status: "DRAFT",
    name: "Strategy",
    riskProfile: "LOW",
    publishedAt: null,
  });
});
describe("Creator publishing against moderation", () => {
  it("reads ownership and current state under the same parent lock as moderation", async () => {
    await strategyRepository.setStatus("strategy", "session-creator", "PUBLISHED");
    expect(mocks.tx.$queryRaw.mock.calls[0]?.[0].sql).toContain("pg_advisory_xact_lock_shared");
    expect(mocks.tx.$queryRaw.mock.calls[1]?.[0].sql).toContain("FOR UPDATE");
    expect(mocks.tx.strategy.findFirst).toHaveBeenCalledWith({
      where: { id: "strategy", creatorId: "session-creator" },
    });
    expect(mocks.tx.strategy.update.mock.calls[0]?.[0].data.status).toBe("PUBLISHED");
  });
  it("cannot publish content an admin already archived even if the browser showed a draft", async () => {
    mocks.tx.strategy.findFirst.mockResolvedValue({
      status: "ARCHIVED",
      name: "Strategy",
      riskProfile: "LOW",
      publishedAt: null,
    });
    await expect(strategyRepository.setStatus("strategy", "creator", "PUBLISHED")).rejects.toThrow(
      /Cannot change/
    );
    await expect(strategyRepository.setStatus("strategy", "creator", "DRAFT")).rejects.toThrow(
      /Cannot change/
    );
    expect(mocks.tx.strategy.update).not.toHaveBeenCalled();
  });
  it("rejects a revoked creator or another creator's content without a write", async () => {
    mocks.tx.user.findUnique.mockResolvedValue({ role: "LEARNER" });
    await expect(strategyRepository.setStatus("strategy", "creator", "PUBLISHED")).rejects.toThrow(
      /Creator access/
    );
    mocks.tx.user.findUnique.mockResolvedValue({ role: "CREATOR" });
    mocks.tx.strategy.findFirst.mockResolvedValue(null);
    await expect(strategyRepository.setStatus("strategy", "creator", "PUBLISHED")).rejects.toThrow(
      /do not own/
    );
    expect(mocks.tx.strategy.update).not.toHaveBeenCalled();
  });
  it("enforces the existing name and risk requirement before publication", async () => {
    mocks.tx.strategy.findFirst.mockResolvedValue({
      status: "DRAFT",
      name: "Strategy",
      riskProfile: null,
      publishedAt: null,
    });
    await expect(strategyRepository.setStatus("strategy", "creator", "PUBLISHED")).rejects.toThrow(
      /risk profile/
    );
    expect(mocks.tx.strategy.update).not.toHaveBeenCalled();
  });
});
