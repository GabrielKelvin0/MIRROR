/**
 * MIRROR — Pure public-creator visibility rules (testable).
 *
 * Decides which creator accounts are eligible for the public creator
 * directory and maps verification state to neutral display language.
 *
 * Rules intentionally err toward privacy:
 *   - LEARNER and ADMIN accounts are never listed.
 *   - A CREATOR account appears only when a public profile exists and at
 *     least one strategy is PUBLISHED, so learners always have something real
 *     to study.
 *   - Verification display comes only from the authoritative stored flag and
 *     never from role, strategy counts, or performance.
 */

export type RoleLike = string | null | undefined;

export interface PublicCreatorEligibilityInput {
  role?: RoleLike;
  hasPublicProfile: boolean;
  publishedStrategyCount: number;
}

/** A creator is publicly listable only with the CREATOR role, a profile, and >= 1 published strategy. */
export function isPubliclyListableCreator(input: PublicCreatorEligibilityInput): boolean {
  return input.role === "CREATOR" && input.hasPublicProfile && input.publishedStrategyCount > 0;
}

/** Neutral verified-state label derived only from the stored flag. */
export function verificationStateLabel(verified: boolean | null | undefined): string {
  return verified ? "Verified creator" : "Not verified";
}

/** Short context explaining what MIRROR verification does and does not mean. */
export const VERIFICATION_CONTEXT =
  "MIRROR verification confirms the identity behind this public profile. It is not an " +
  "endorsement of expertise, investment performance, or regulatory approval.";
