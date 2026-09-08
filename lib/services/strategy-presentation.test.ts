import { describe, it, expect } from "vitest";
import { riskProfileLabel, creatorDisplayName, formatDisplayDate } from "./strategy-presentation";

/**
 * Tests for the pure public-strategy presentation helpers
 * (lib/services/strategy-presentation.ts).
 */

describe("riskProfileLabel", () => {
  it("maps stored risk codes to display labels", () => {
    expect(riskProfileLabel("LOW")).toBe("Low");
    expect(riskProfileLabel("moderate")).toBe("Moderate");
    expect(riskProfileLabel("HIGH")).toBe("High");
  });

  it("passes unknown values through unchanged", () => {
    expect(riskProfileLabel("Custom")).toBe("Custom");
  });

  it("falls back when the risk profile is absent", () => {
    expect(riskProfileLabel(null)).toBe("Risk not set");
    expect(riskProfileLabel(undefined)).toBe("Risk not set");
    expect(riskProfileLabel("")).toBe("Risk not set");
  });
});

describe("creatorDisplayName", () => {
  it("joins first and last names", () => {
    expect(creatorDisplayName("Ada", "Lovelace")).toBe("Ada Lovelace");
  });

  it("falls back to whichever part is present", () => {
    expect(creatorDisplayName("Ada", null)).toBe("Ada");
    expect(creatorDisplayName(null, "Lovelace")).toBe("Lovelace");
  });

  it("never returns an empty label", () => {
    expect(creatorDisplayName(null, null)).toBe("MIRROR creator");
    expect(creatorDisplayName("", "   ")).toBe("MIRROR creator");
  });
});

describe("formatDisplayDate", () => {
  it("formats dates as a short UTC date", () => {
    expect(formatDisplayDate(new Date("2026-09-08T00:00:00Z"))).toBe("8 Sep 2026");
  });

  it("accepts ISO date strings", () => {
    expect(formatDisplayDate("2026-01-02T00:00:00Z")).toBe("2 Jan 2026");
  });

  it("returns an empty string for missing or invalid values", () => {
    expect(formatDisplayDate(null)).toBe("");
    expect(formatDisplayDate(undefined)).toBe("");
    expect(formatDisplayDate("not-a-date")).toBe("");
  });
});
