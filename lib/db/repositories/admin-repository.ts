import "server-only";
import type { ReportStatus, StrategyStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import {
  lockReport,
  lockStrategy,
  lockUser,
  moderationTransactionOptions,
  requireAdminTransaction,
} from "@/lib/db/moderation-locks";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import {
  assertAdminStrategyTransition,
  assertFresh,
  assertReportTransition,
  reportStatus,
  reviewReason,
  strategyStatus,
  userRole,
} from "@/lib/services/moderation-rules";

export interface RoleChange {
  role: UserRole;
  expectedRole: UserRole;
  reason: string;
}
export interface StrategyModeration {
  status: StrategyStatus;
  expectedStatus: StrategyStatus;
  reason: string;
  reportId?: string;
}
export interface ReportReview {
  status: ReportStatus;
  expectedStatus: ReportStatus;
  reason: string;
}
export interface CreatorVerification {
  verified: boolean;
  expectedVerified: boolean;
  reason: string;
}

export class AdminRepository {
  async listUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { strategies: true } } },
    });
  }

  async listCreators() {
    return prisma.user.findMany({
      where: { role: "CREATOR" },
      orderBy: { createdAt: "desc" },
      include: { creatorProfile: true, _count: { select: { strategies: true } } },
    });
  }

  async listStrategies(status?: StrategyStatus) {
    return prisma.strategy.findMany({
      where: status ? { status } : {},
      orderBy: { updatedAt: "desc" },
      include: { creator: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async listReports(status?: ReportStatus) {
    const reports = await prisma.report.findMany({
      where: status ? { status } : {},
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
      include: {
        reporter: { select: { firstName: true, lastName: true, email: true } },
        moderationActions: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 10 },
      },
    });
    // Batch the polymorphic audit lookup instead of one query per report.
    const history = reports.length
      ? await prisma.auditLog.findMany({
          where: { resourceType: "REPORT", targetId: { in: reports.map((r) => r.id) } },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 200,
          select: { id: true, targetId: true, action: true, changes: true, createdAt: true },
        })
      : [];
    const strategyIds = reports
      .filter((report) => report.resourceType === "STRATEGY")
      .map((report) => report.resourceId);
    const strategies = strategyIds.length
      ? await prisma.strategy.findMany({
          where: { id: { in: strategyIds } },
          select: { id: true, name: true, status: true },
        })
      : [];
    const byId = new Map(strategies.map((strategy) => [strategy.id, strategy]));
    return reports.map((report) => ({
      ...report,
      history: history.filter((entry) => entry.targetId === report.id),
      strategy: report.resourceType === "STRATEGY" ? (byId.get(report.resourceId) ?? null) : null,
    }));
  }

  async listAuditLogs() {
    return prisma.auditLog.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        targetId: true,
        changes: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async changeRole(actorId: string, targetId: string, input: RoleChange) {
    const role = userRole(input.role);
    const expectedRole = userRole(input.expectedRole);
    const reason = reviewReason(input.reason);
    return prisma.$transaction(async (tx) => {
      await requireAdminTransaction(tx, actorId, true);
      await lockUser(tx, targetId);
      const target = await tx.user.findUniqueOrThrow({
        where: { id: targetId },
        select: { role: true },
      });
      assertFresh(target.role, expectedRole);
      if (target.role === role) throw new BusinessRuleError("Choose a different role");
      if (targetId === actorId && role !== "ADMIN")
        throw new BusinessRuleError("You cannot remove your own admin access");
      if (
        target.role === "ADMIN" &&
        role !== "ADMIN" &&
        (await tx.user.count({ where: { role: "ADMIN" } })) <= 1
      ) {
        throw new BusinessRuleError("The final administrator cannot be demoted");
      }
      const updated = await tx.user.update({ where: { id: targetId }, data: { role } });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "ADMIN_USER_ROLE",
          resourceType: "USER",
          targetId,
          changes: JSON.stringify({ from: target.role, to: role, reason }),
        },
      });
      return updated;
    }, moderationTransactionOptions);
  }

  async moderateStrategy(actorId: string, strategyId: string, input: StrategyModeration) {
    const to = strategyStatus(input.status);
    const expected = strategyStatus(input.expectedStatus);
    const reason = reviewReason(input.reason);
    return prisma.$transaction(async (tx) => {
      await requireAdminTransaction(tx, actorId);
      await lockStrategy(tx, strategyId);
      const strategy = await tx.strategy.findUniqueOrThrow({
        where: { id: strategyId },
        select: { status: true, publishedAt: true, name: true, riskProfile: true },
      });
      assertFresh(strategy.status, expected);
      assertAdminStrategyTransition(strategy.status, to, {
        name: strategy.name,
        riskProfile: strategy.riskProfile ?? "",
      });
      if (input.reportId) {
        const report = await tx.report.findUnique({
          where: { id: input.reportId },
          select: { resourceType: true, resourceId: true },
        });
        if (!report || report.resourceType !== "STRATEGY" || report.resourceId !== strategyId) {
          throw new NotFoundError("This report does not refer to the strategy");
        }
      }
      const updated = await tx.strategy.update({
        where: { id: strategyId },
        data: {
          status: to,
          publishedAt:
            to === "PUBLISHED" ? new Date() : to === "DRAFT" ? null : strategy.publishedAt,
        },
      });
      if (to === "ARCHIVED" || (strategy.status === "ARCHIVED" && to === "DRAFT")) {
        await tx.moderationAction.create({
          data: {
            adminId: actorId,
            reportId: input.reportId ?? null,
            resourceType: "STRATEGY",
            resourceId: strategyId,
            action: to === "ARCHIVED" ? "SUSPEND" : "RESTORE",
            reason,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "ADMIN_STRATEGY_STATUS",
          resourceType: "STRATEGY",
          resourceId: strategyId,
          targetId: strategyId,
          changes: JSON.stringify({
            from: strategy.status,
            to,
            reason,
            reportId: input.reportId ?? null,
          }),
        },
      });
      return updated;
    }, moderationTransactionOptions);
  }

  async resolveReport(actorId: string, reportId: string, input: ReportReview) {
    const to = reportStatus(input.status);
    const expected = reportStatus(input.expectedStatus);
    const reason = reviewReason(input.reason);
    return prisma.$transaction(async (tx) => {
      await requireAdminTransaction(tx, actorId);
      const initial = await tx.report.findUnique({
        where: { id: reportId },
        select: { reporterId: true },
      });
      if (!initial) throw new NotFoundError("Report not found");
      // Same user-before-report order as submission protects reopens from duplicates.
      await lockUser(tx, initial.reporterId);
      await lockReport(tx, reportId);
      const report = await tx.report.findUniqueOrThrow({ where: { id: reportId } });
      assertFresh(report.status, expected);
      assertReportTransition(report.status, to);
      if (to === "OPEN") {
        const duplicate = await tx.report.findFirst({
          where: {
            id: { not: report.id },
            reporterId: report.reporterId,
            resourceType: report.resourceType,
            resourceId: report.resourceId,
            status: { in: ["OPEN", "INVESTIGATING"] },
          },
          select: { id: true },
        });
        if (duplicate)
          throw new BusinessRuleError(
            "Another open report already covers this reporter and content"
          );
      }
      const updated = await tx.report.update({ where: { id: reportId }, data: { status: to } });
      // Case review is audit history, not a warning/restoration or a content mutation.
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "ADMIN_REPORT_STATUS",
          resourceType: "REPORT",
          targetId: reportId,
          changes: JSON.stringify({ from: report.status, to, reason }),
        },
      });
      return updated;
    }, moderationTransactionOptions);
  }

  async verifyCreator(actorId: string, userId: string, input: CreatorVerification) {
    const reason = reviewReason(input.reason);
    if (typeof input.verified !== "boolean" || typeof input.expectedVerified !== "boolean")
      throw new BusinessRuleError("Choose a verification change");
    return prisma.$transaction(async (tx) => {
      await requireAdminTransaction(tx, actorId);
      await lockUser(tx, userId);
      const creator = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { role: true, creatorProfile: { select: { id: true, isVerified: true } } },
      });
      if (creator.role !== "CREATOR" || !creator.creatorProfile)
        throw new BusinessRuleError("A creator account with a profile is required");
      const profile = creator.creatorProfile;
      assertFresh(profile.isVerified, input.expectedVerified);
      if (profile.isVerified === input.verified)
        throw new BusinessRuleError("Choose a different verification state");
      const updated = await tx.creatorProfile.update({
        where: { id: profile.id },
        data: { isVerified: input.verified },
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "ADMIN_CREATOR_VERIFICATION",
          resourceType: "USER",
          targetId: userId,
          changes: JSON.stringify({ from: profile.isVerified, to: input.verified, reason }),
        },
      });
      return updated;
    }, moderationTransactionOptions);
  }
}

export const adminRepository = new AdminRepository();
