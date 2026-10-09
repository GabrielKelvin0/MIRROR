import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    user: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), count: vi.fn(), update: vi.fn() },
    strategy: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    report: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    creatorProfile: { update: vi.fn() },
    auditLog: { create: vi.fn() },
    moderationAction: { create: vi.fn() },
  };
  return { tx, transaction: vi.fn() };
});
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { $transaction: mocks.transaction } }));
import { adminRepository } from "./admin-repository";

const roleChange = {
  role: "CREATOR" as const,
  expectedRole: "LEARNER" as const,
  reason: "Reviewed access",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation((fn: (tx: typeof mocks.tx) => unknown) => fn(mocks.tx));
  mocks.tx.$queryRaw.mockResolvedValue([{ id: "target", locked: 1 }]);
  mocks.tx.user.findUnique.mockResolvedValue({ role: "ADMIN" });
  mocks.tx.user.findUniqueOrThrow.mockResolvedValue({ role: "LEARNER" });
  mocks.tx.user.count.mockResolvedValue(2);
  mocks.tx.strategy.findUniqueOrThrow.mockResolvedValue({
    status: "PUBLISHED",
    publishedAt: new Date("2026-09-01"),
    name: "Strategy",
    riskProfile: "LOW",
  });
  mocks.tx.report.findUnique.mockResolvedValue({
    reporterId: "reporter",
    resourceType: "STRATEGY",
    resourceId: "strategy",
  });
  mocks.tx.report.findUniqueOrThrow.mockResolvedValue({
    id: "report",
    reporterId: "reporter",
    resourceType: "STRATEGY",
    resourceId: "strategy",
    status: "OPEN",
  });
  mocks.tx.report.findFirst.mockResolvedValue(null);
});

describe("Admin mutation authorization and atomic history", () => {
  it("rejects a revoked administrator at the database boundary before target writes", async () => {
    mocks.tx.user.findUnique.mockResolvedValue({ role: "LEARNER" });
    await expect(
      adminRepository.moderateStrategy("actor", "strategy", {
        status: "ARCHIVED",
        expectedStatus: "PUBLISHED",
        reason: "Review",
      })
    ).rejects.toThrow(/Administrator/);
    expect(mocks.tx.strategy.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mocks.tx.strategy.update).not.toHaveBeenCalled();
    expect(mocks.tx.auditLog.create).not.toHaveBeenCalled();
  });
  it("serializes role changes and stores the actual prior role and explanation", async () => {
    await adminRepository.changeRole("actor", "target", roleChange);
    const lock = mocks.tx.$queryRaw.mock.calls[0]?.[0] as Prisma.Sql;
    expect(lock.sql).toContain("pg_advisory_xact_lock(23023, 1)");
    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: "target" },
      data: { role: "CREATOR" },
    });
    const data = mocks.tx.auditLog.create.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({ userId: "actor", resourceType: "USER", targetId: "target" });
    expect(JSON.parse(data.changes)).toEqual({
      from: "LEARNER",
      to: "CREATOR",
      reason: "Reviewed access",
    });
    expect(mocks.transaction.mock.calls[0]?.[1]).toMatchObject({ isolationLevel: "ReadCommitted" });
  });
  it("rejects stale roles, self-demotion and loss of the last administrator", async () => {
    mocks.tx.user.findUniqueOrThrow.mockResolvedValue({ role: "ADMIN" });
    await expect(adminRepository.changeRole("actor", "target", roleChange)).rejects.toThrow(
      /changed/
    );
    await expect(
      adminRepository.changeRole("actor", "actor", { ...roleChange, expectedRole: "ADMIN" })
    ).rejects.toThrow(/own admin/);
    mocks.tx.user.count.mockResolvedValue(1);
    await expect(
      adminRepository.changeRole("actor", "target", { ...roleChange, expectedRole: "ADMIN" })
    ).rejects.toThrow(/final administrator/);
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
  });
  it("does not report success if the atomic audit write fails", async () => {
    mocks.tx.auditLog.create.mockRejectedValue(new Error("audit failed"));
    await expect(adminRepository.changeRole("actor", "target", roleChange)).rejects.toThrow(
      "audit failed"
    );
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
  it("archives content with a real suspension record linked to its report", async () => {
    await adminRepository.moderateStrategy("actor", "strategy", {
      status: "ARCHIVED",
      expectedStatus: "PUBLISHED",
      reason: "Unsupported claims",
      reportId: "report",
    });
    expect(mocks.tx.moderationAction.create).toHaveBeenCalledWith({
      data: {
        adminId: "actor",
        reportId: "report",
        resourceType: "STRATEGY",
        resourceId: "strategy",
        action: "SUSPEND",
        reason: "Unsupported claims",
      },
    });
    const lock = mocks.tx.$queryRaw.mock.calls[0]?.[0] as Prisma.Sql;
    expect(lock.sql).toContain("pg_advisory_xact_lock_shared");
    expect(mocks.tx.strategy.update.mock.calls[0]?.[0].data.status).toBe("ARCHIVED");
  });
  it("restores an archived strategy to private draft without auto-publishing", async () => {
    mocks.tx.strategy.findUniqueOrThrow.mockResolvedValue({
      status: "ARCHIVED",
      publishedAt: new Date(),
      name: "Strategy",
      riskProfile: "LOW",
    });
    await adminRepository.moderateStrategy("actor", "strategy", {
      status: "DRAFT",
      expectedStatus: "ARCHIVED",
      reason: "Changes reviewed",
    });
    expect(mocks.tx.strategy.update).toHaveBeenCalledWith({
      where: { id: "strategy" },
      data: { status: "DRAFT", publishedAt: null },
    });
    expect(mocks.tx.moderationAction.create.mock.calls[0]?.[0].data.action).toBe("RESTORE");
  });
  it("rejects stale strategy views and reports pointing at different content", async () => {
    await expect(
      adminRepository.moderateStrategy("actor", "strategy", {
        status: "ARCHIVED",
        expectedStatus: "DRAFT",
        reason: "Review",
      })
    ).rejects.toThrow(/changed/);
    mocks.tx.report.findUnique.mockResolvedValue({ resourceType: "USER", resourceId: "strategy" });
    await expect(
      adminRepository.moderateStrategy("actor", "strategy", {
        status: "ARCHIVED",
        expectedStatus: "PUBLISHED",
        reason: "Review",
        reportId: "other",
      })
    ).rejects.toThrow(/does not refer/);
    expect(mocks.tx.strategy.update).not.toHaveBeenCalled();
  });
  it("checks the same publishing requirements for admins", async () => {
    mocks.tx.strategy.findUniqueOrThrow.mockResolvedValue({
      status: "DRAFT",
      name: "Strategy",
      riskProfile: null,
    });
    await expect(
      adminRepository.moderateStrategy("actor", "strategy", {
        status: "PUBLISHED",
        expectedStatus: "DRAFT",
        reason: "Review",
      })
    ).rejects.toThrow(/risk profile/);
    expect(mocks.tx.strategy.update).not.toHaveBeenCalled();
  });
  it("records report review without inventing a warning or restoring content", async () => {
    await adminRepository.resolveReport("actor", "report", {
      status: "RESOLVED",
      expectedStatus: "OPEN",
      reason: "Reviewed evidence",
    });
    expect(mocks.tx.report.update).toHaveBeenCalledWith({
      where: { id: "report" },
      data: { status: "RESOLVED" },
    });
    expect(mocks.tx.moderationAction.create).not.toHaveBeenCalled();
    expect(mocks.tx.strategy.update).not.toHaveBeenCalled();
    const data = mocks.tx.auditLog.create.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({ resourceType: "REPORT", targetId: "report" });
    expect(JSON.parse(data.changes)).toEqual({
      from: "OPEN",
      to: "RESOLVED",
      reason: "Reviewed evidence",
    });
  });
  it("rejects stale case decisions and duplicate active reports when reopening", async () => {
    mocks.tx.report.findUniqueOrThrow.mockResolvedValue({
      id: "report",
      reporterId: "reporter",
      resourceType: "STRATEGY",
      resourceId: "strategy",
      status: "DISMISSED",
    });
    await expect(
      adminRepository.resolveReport("actor", "report", {
        status: "RESOLVED",
        expectedStatus: "OPEN",
        reason: "Review",
      })
    ).rejects.toThrow(/changed/);
    mocks.tx.report.findFirst.mockResolvedValue({ id: "another-active-report" });
    await expect(
      adminRepository.resolveReport("actor", "report", {
        status: "OPEN",
        expectedStatus: "DISMISSED",
        reason: "New evidence",
      })
    ).rejects.toThrow(/Another open/);
    expect(mocks.tx.report.update).not.toHaveBeenCalled();
  });
  it("verifies a current creator profile and stores the reviewed identity rationale", async () => {
    mocks.tx.user.findUniqueOrThrow.mockResolvedValue({
      role: "CREATOR",
      creatorProfile: { id: "profile", isVerified: false },
    });
    await adminRepository.verifyCreator("actor", "creator", {
      verified: true,
      expectedVerified: false,
      reason: "Identity evidence reviewed",
    });
    expect(mocks.tx.creatorProfile.update).toHaveBeenCalledWith({
      where: { id: "profile" },
      data: { isVerified: true },
    });
    expect(mocks.tx.auditLog.create.mock.calls[0]?.[0].data).toMatchObject({
      userId: "actor",
      resourceType: "USER",
      targetId: "creator",
    });
  });
  it.each([
    { role: "LEARNER", creatorProfile: { id: "p", isVerified: false } },
    { role: "CREATOR", creatorProfile: null },
  ])("rejects verification without a creator profile", async (target) => {
    mocks.tx.user.findUniqueOrThrow.mockResolvedValue(target);
    await expect(
      adminRepository.verifyCreator("actor", "creator", {
        verified: true,
        expectedVerified: false,
        reason: "Review",
      })
    ).rejects.toThrow(/creator account/);
    expect(mocks.tx.creatorProfile.update).not.toHaveBeenCalled();
  });
  it("rejects stale verification before any profile or audit write", async () => {
    mocks.tx.user.findUniqueOrThrow.mockResolvedValue({
      role: "CREATOR",
      creatorProfile: { id: "p", isVerified: true },
    });
    await expect(
      adminRepository.verifyCreator("actor", "creator", {
        verified: false,
        expectedVerified: false,
        reason: "Review",
      })
    ).rejects.toThrow(/changed/);
    expect(mocks.tx.creatorProfile.update).not.toHaveBeenCalled();
    expect(mocks.tx.auditLog.create).not.toHaveBeenCalled();
  });
});
