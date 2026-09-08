/**
 * MIRROR — Pure presentation helpers for public strategy surfaces.
 *
 * Labeling/formatting helpers shared by public discovery and detail pages.
 * Kept dependency-free and unit-tested in isolation so display rules are
 * deterministic and safe (this module never touches the database or auth).
 */

export type RiskProfileCode = "LOW" | "MODERATE" | "HIGH";

export const RISK_PROFILE_LABELS: Record<RiskProfileCode, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
};

/** Map a stored risk code to its display label; unknown values pass through. */
export function riskProfileLabel(code?: string | null): string {
  if (!code) return "Risk not set";
  const key = code.trim().toUpperCase();
  if (key === "LOW" || key === "MODERATE" || key === "HIGH") {
    return RISK_PROFILE_LABELS[key];
  }
  return code;
}

/** Build a public creator display name; never returns an empty label. */
export function creatorDisplayName(firstName?: string | null, lastName?: string | null): string {
  const name = [firstName, lastName]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim();
  return name.length > 0 ? name : "MIRROR creator";
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Format a Date (or ISO string) as a short, deterministic UTC date. */
export function formatDisplayDate(value?: Date | string | null): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const month = SHORT_MONTHS[date.getUTCMonth()] ?? "";
  return date.getUTCDate() + " " + month + " " + date.getUTCFullYear();
}
