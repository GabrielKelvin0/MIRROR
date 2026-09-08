import { describe, it, expect } from "vitest";
import { isPubliclyListableCreator, verificationStateLabel } from "./creator-public-rules";

/**
 * Tests for the pure public-creator visibility rules
 * (lib/services/creator-public-rules.ts).
 */

describe("isPubliclyListableCreator", () => {
  it("lists a CREATOR with a profile and at least one published strategy", () => {
    expect(
      isPubliclyListableCreator({
        role: "CREATOR",
        hasPublicProfile: true,
        publishedStrategyCount: 1,
      })
    ).toBe(true);
  });

  it("never lists LEARNER or ADMIN accounts", () => {
    expect(
      isPubliclyListableCreator({
        role: "LEARNER",
        hasPublicProfile: true,
        publishedStrategyCount: 3,
      })
    ).toBe(false);
    expect(
      isPubliclyListableCreator({
        role: "ADMIN",
        hasPublicProfile: true,
        publishedStrategyCount: 3,
      })
    ).toBe(false);
  });

  it("requires a public profile", () => {
    expect(
      isPubliclyListableCreator({
        role: "CREATOR",
        hasPublicProfile: false,
        publishedStrategyCount: 2,
      })
    ).toBe(false);
  });

  it("requires at least one published strategy", () => {
    expect(
      isPubliclyListableCreator({
        role: "CREATOR",
        hasPublicProfile: true,
        publishedStrategyCount: 0,
      })
    ).toBe(false);
  });

  it("rejects missing roles", () => {
    expect(
      isPubliclyListableCreator({
        role: null,
        hasPublicProfile: true,
        publishedStrategyCount: 1,
      })
    ).toBe(false);
  });
});

describe("verificationStateLabel", () => {
  it("maps the authoritative stored flag to neutral language", () => {
    expect(verificationStateLabel(true)).toBe("Verified creator");
    expect(verificationStateLabel(false)).toBe("Not verified");
    expect(verificationStateLabel(null)).toBe("Not verified");
    expect(verificationStateLabel(undefined)).toBe("Not verified");
  });
});
