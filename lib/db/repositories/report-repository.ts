import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { lockUser, moderationTransactionOptions } from "@/lib/db/moderation-locks";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import {
  assertReporterRole,
  REPORT_LIMIT_PER_HOUR,
  validateReport,
  type ReportInput,
} from "@/lib/services/moderation-rules";

async function publicTarget(
  db: Pick<Prisma.TransactionClient, "strategy" | "user">,
  type: ReportInput["resourceType"],
  id: string
) {
  if (type === "STRATEGY") {
    const strategy = await db.strategy.findFirst({
      where: { id, status: "PUBLISHED" },
      select: { name: true },
    });
    return strategy
      ? {
          name: strategy.name,
          href: "/strategies/" + encodeURIComponent(id),
          type: "Published strategy",
        }
      : null;
  }
  const creator = await db.user.findFirst({
    where: { id, role: "CREATOR" },
    select: { firstName: true, lastName: true },
  });
  return creator
    ? {
        name: [creator.firstName, creator.lastName].filter(Boolean).join(" ") || "Creator",
        href: "/creators/" + encodeURIComponent(id),
        type: "Public creator",
      }
    : null;
}

export class ReportRepository {
  async getPublicTarget(type: ReportInput["resourceType"], id: string) {
    const target = await publicTarget(prisma, type, id);
    if (!target) throw new NotFoundError("Content is not available to report");
    return target;
  }

  async listOwned(reporterId: string) {
    return prisma.report.findMany({
      where: { reporterId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      select: {
        id: true,
        resourceType: true,
        resourceId: true,
        resourceName: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async submit(reporterId: string, input: ReportInput) {
    const data = validateReport(input);
    return prisma.$transaction(async (tx) => {
      // Serializes submissions/reopens for one reporter without rewriting old duplicates.
      await lockUser(tx, reporterId);
      const reporter = await tx.user.findUniqueOrThrow({
        where: { id: reporterId },
        select: { role: true },
      });
      assertReporterRole(reporter.role);
      const target = await publicTarget(tx, data.resourceType, data.resourceId);
      if (!target) throw new NotFoundError("Content is not available to report");
      const existing = await tx.report.findFirst({
        where: {
          reporterId,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          status: { in: ["OPEN", "INVESTIGATING"] },
        },
        select: { id: true },
      });
      if (existing)
        throw new BusinessRuleError(
          "You already have an open report for this content. Check My reports."
        );
      const recent = await tx.report.count({
        where: { reporterId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      });
      if (recent >= REPORT_LIMIT_PER_HOUR)
        throw new BusinessRuleError(
          "You can submit up to five reports per hour. Please try again later."
        );
      const report = await tx.report.create({
        data: { ...data, reporterId, resourceName: target.name },
      });
      await tx.auditLog.create({
        data: {
          userId: reporterId,
          action: "REPORT_SUBMITTED",
          resourceType: "REPORT",
          targetId: report.id,
          changes: JSON.stringify({ to: "OPEN", reason: data.reason }),
        },
      });
      return report;
    }, moderationTransactionOptions);
  }
}

export const reportRepository = new ReportRepository();
