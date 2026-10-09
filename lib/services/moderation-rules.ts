import type { ReportStatus, ResourceType, StrategyStatus, UserRole } from "@prisma/client";
import { BusinessRuleError, ForbiddenError, ValidationError } from "@/lib/errors";
import { assertTransition, isPublishable, type StrategyInput } from "@/lib/services/strategy-rules";

export const REPORT_REASONS = [
  "Misleading or unsupported claims",
  "Missing risk information",
  "Spam or promotion",
  "Abusive content",
  "Other concern",
] as const;
export const REPORT_LIMIT_PER_HOUR = 5;
export const REPORT_STATUSES = ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"] as const;
export const USER_ROLES = ["LEARNER", "CREATOR", "ADMIN"] as const;
export const STRATEGY_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export interface ModerationFormState {
  error?: string;
  success?: string;
}

export function resourceId(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 255) {
    throw new ValidationError("Choose content to report");
  }
  return value.trim();
}

export function reportResourceType(value: unknown): "STRATEGY" | "USER" {
  if (value !== "STRATEGY" && value !== "USER") {
    throw new ValidationError("Only published strategies and public creators can be reported");
  }
  return value;
}

export function reviewReason(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 5000) {
    throw new ValidationError("A review reason of up to 5,000 characters is required");
  }
  return value.trim();
}

export function assertReporterRole(role: UserRole): void {
  if (role !== "LEARNER" && role !== "CREATOR") {
    throw new ForbiddenError("Reporting is available to learners and creators");
  }
}

export interface ReportInput {
  resourceType: "STRATEGY" | "USER";
  resourceId: string;
  reason: string;
  description: string | null;
}

export function validateReport(input: {
  resourceType: unknown;
  resourceId: unknown;
  reason: unknown;
  description: unknown;
}): ReportInput {
  if (
    typeof input.reason !== "string" ||
    !(REPORT_REASONS as readonly string[]).includes(input.reason)
  ) {
    throw new ValidationError("Choose a report reason");
  }
  if (input.description != null && typeof input.description !== "string") {
    throw new ValidationError("Report details must be text");
  }
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (description.length > 5000)
    throw new ValidationError("Report details must be at most 5,000 characters");
  if (input.reason === "Other concern" && !description) {
    throw new ValidationError("Describe your concern so it can be reviewed");
  }
  return {
    resourceType: reportResourceType(input.resourceType),
    resourceId: resourceId(input.resourceId),
    reason: input.reason,
    description: description || null,
  };
}

export function userRole(value: unknown): UserRole {
  if (typeof value !== "string" || !(USER_ROLES as readonly string[]).includes(value)) {
    throw new ValidationError("Choose a valid user role");
  }
  return value as UserRole;
}

export function strategyStatus(value: unknown): StrategyStatus {
  if (typeof value !== "string" || !(STRATEGY_STATUSES as readonly string[]).includes(value)) {
    throw new ValidationError("Choose a valid strategy status");
  }
  return value as StrategyStatus;
}

export function reportStatus(value: unknown): ReportStatus {
  if (typeof value !== "string" || !(REPORT_STATUSES as readonly string[]).includes(value)) {
    throw new ValidationError("Choose a valid report status");
  }
  return value as ReportStatus;
}

export function booleanChoice(value: unknown): boolean {
  if (value !== "true" && value !== "false")
    throw new ValidationError("Choose a verification change");
  return value === "true";
}

export function assertFresh<T>(current: T, expected: T): void {
  if (current !== expected)
    throw new BusinessRuleError("This record changed. Refresh and review it again.");
}

export function reportTransitions(status: ReportStatus): ReportStatus[] {
  if (status === "OPEN") return ["INVESTIGATING", "RESOLVED", "DISMISSED"];
  if (status === "INVESTIGATING") return ["RESOLVED", "DISMISSED"];
  return ["OPEN"];
}

export function assertReportTransition(from: ReportStatus, to: ReportStatus): void {
  if (!reportTransitions(from).includes(to))
    throw new BusinessRuleError("Choose an available report transition");
}

export function assertAdminStrategyTransition(
  from: StrategyStatus,
  to: StrategyStatus,
  strategy: StrategyInput
): void {
  // Restoration is deliberately ADMIN-only and returns to a private draft.
  if (!(from === "ARCHIVED" && to === "DRAFT")) assertTransition(from, to);
  if (to === "PUBLISHED" && !isPublishable(strategy)) {
    throw new BusinessRuleError("A name and valid risk profile are required before publishing");
  }
}

/** Only known, display-safe audit fields reach the admin UI; old rows remain intact. */
export function auditDetails(changes: string | null): {
  from: string | null;
  to: string | null;
  reason: string | null;
} {
  let value: unknown;
  try {
    value = changes ? JSON.parse(changes) : null;
  } catch {
    value = null;
  }
  const row =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const field = (key: string): string | null =>
    typeof row[key] === "string"
      ? (row[key] as string)
      : typeof row[key] === "boolean"
        ? String(row[key])
        : null;
  return { from: field("from"), to: field("to"), reason: field("reason") };
}

export function reportHref(type: ResourceType, id: string): string {
  return "/reports/new?" + new URLSearchParams({ resourceType: type, resourceId: id }).toString();
}
