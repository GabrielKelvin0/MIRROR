import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReportInput } from "@/lib/services/moderation-rules";

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    user: { findUniqueOrThrow: vi.fn(), findFirst: vi.fn() },
    strategy: { findFirst: vi.fn() },
    report: { findFirst: vi.fn(), count: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  return { tx, transaction: vi.fn(), list: vi.fn() };
});
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({
  prisma: { $transaction: mocks.transaction, report: { findMany: mocks.list } },
}));
import { reportRepository } from "./report-repository";

const input: ReportInput = {
  resourceType: "STRATEGY",
  resourceId: "strategy",
  reason: "Missing risk information",
  description: "Review drawdown claims",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation((fn: (tx: typeof mocks.tx) => unknown) => fn(mocks.tx));
  mocks.tx.$queryRaw.mockResolvedValue([{ id: "reporter" }]);
  mocks.tx.user.findUniqueOrThrow.mockResolvedValue({ role: "LEARNER" });
  mocks.tx.strategy.findFirst.mockResolvedValue({ name: "Public strategy" });
  mocks.tx.user.findFirst.mockResolvedValue({ firstName: "Public", lastName: "Creator" });
  mocks.tx.report.findFirst.mockResolvedValue(null);
  mocks.tx.report.count.mockResolvedValue(0);
  mocks.tx.report.create.mockResolvedValue({ id: "new-report" });
});
describe("Private report submission", () => {
  it("locks the authenticated reporter and captures the public name with an atomic audit", async () => {
    await reportRepository.submit("session-user", input);
    expect(mocks.tx.$queryRaw.mock.calls[0]?.[0].values).toContain("session-user");
    expect(mocks.tx.strategy.findFirst).toHaveBeenCalledWith({
      where: { id: "strategy", status: "PUBLISHED" },
      select: { name: true },
    });
    expect(mocks.tx.report.create).toHaveBeenCalledWith({
      data: { ...input, reporterId: "session-user", resourceName: "Public strategy" },
    });
    expect(mocks.tx.auditLog.create.mock.calls[0]?.[0].data).toMatchObject({
      userId: "session-user",
      resourceType: "REPORT",
      targetId: "new-report",
    });
  });
  it("allows creators to report public creator identities without reading private account data", async () => {
    mocks.tx.user.findUniqueOrThrow.mockResolvedValue({ role: "CREATOR" });
    await reportRepository.submit("reporter", {
      ...input,
      resourceType: "USER",
      resourceId: "creator",
    });
    expect(mocks.tx.user.findFirst).toHaveBeenCalledWith({
      where: { id: "creator", role: "CREATOR" },
      select: { firstName: true, lastName: true },
    });
    expect(mocks.tx.report.create.mock.calls[0]?.[0].data.resourceName).toBe("Public Creator");
  });
  it("rechecks the reporting role after the user lock", async () => {
    mocks.tx.user.findUniqueOrThrow.mockResolvedValue({ role: "ADMIN" });
    await expect(reportRepository.submit("reporter", input)).rejects.toThrow(
      /learners and creators/
    );
    expect(mocks.tx.strategy.findFirst).not.toHaveBeenCalled();
    expect(mocks.tx.report.create).not.toHaveBeenCalled();
  });
  it.each(["STRATEGY", "USER"] as const)(
    "rejects unavailable %s content before creating a report",
    async (type) => {
      mocks.tx.strategy.findFirst.mockResolvedValue(null);
      mocks.tx.user.findFirst.mockResolvedValue(null);
      await expect(
        reportRepository.submit("reporter", { ...input, resourceType: type })
      ).rejects.toThrow(/not available/);
      expect(mocks.tx.report.create).not.toHaveBeenCalled();
    }
  );
  it("rejects repeated open reports and bounds submission rate for the same actor", async () => {
    mocks.tx.report.findFirst.mockResolvedValue({ id: "existing" });
    await expect(reportRepository.submit("reporter", input)).rejects.toThrow(/already have/);
    mocks.tx.report.findFirst.mockResolvedValue(null);
    mocks.tx.report.count.mockResolvedValue(5);
    await expect(reportRepository.submit("reporter", input)).rejects.toThrow(
      /five reports per hour/
    );
    expect(mocks.tx.report.create).not.toHaveBeenCalled();
  });
  it("does not expose success if history fails and never accepts unsupported target types", async () => {
    mocks.tx.auditLog.create.mockRejectedValue(new Error("audit failed"));
    await expect(reportRepository.submit("reporter", input)).rejects.toThrow("audit failed");
    mocks.transaction.mockClear();
    await expect(
      reportRepository.submit("reporter", {
        ...input,
        resourceType: "COMMENT",
      } as unknown as ReportInput)
    ).rejects.toThrow();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("returns only the authenticated reporter's bounded history with no moderator or account details", async () => {
    mocks.list.mockResolvedValue([]);
    await reportRepository.listOwned("session-user");
    const query = mocks.list.mock.calls[0]?.[0];
    expect(query.where).toEqual({ reporterId: "session-user" });
    expect(query.take).toBe(50);
    expect(query.select.reporter).toBeUndefined();
    expect(query.select.moderationActions).toBeUndefined();
    expect(query.select.auditLog).toBeUndefined();
  });
});
