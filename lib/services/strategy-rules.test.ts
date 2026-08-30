import { describe, it, expect } from "vitest";
import {
  validateStrategy,
  validateAllocation,
  validateStrategyUpdate,
  assertTransition,
  isPublishable,
  RISK_PROFILES,
} from "./strategy-rules";
import { ValidationError, BusinessRuleError } from "@/lib/errors";

/**
 * These tests exercise the pure strategy business rules
 * (lib/services/strategy-rules.ts): field validation, allocation total
 * enforcement, update validation, and status transitions.
 *
 * Authorization/ownership (which user can act on which strategy) is enforced
 * separately at the data boundary (strategy-repository) and is not this
 * module's concern.
 */

describe("validateStrategy", () => {
  it("accepts a valid strategy, normalizing risk profile to uppercase", () => {
    const out = validateStrategy({
      name: "  The Compounder  ",
      riskProfile: "moderate",
      objective: "long-term growth",
    });
    expect(out.name).toBe("The Compounder");
    expect(out.riskProfile).toBe("MODERATE");
  });

  it("rejects a blank name", () => {
    expect(() => validateStrategy({ name: "   " })).toThrow(ValidationError);
    expect(() => validateStrategy({ name: "" })).toThrow(ValidationError);
  });

  it("rejects an invalid risk profile", () => {
    expect(() => validateStrategy({ name: "X", riskProfile: "EXTREME" })).toThrow(ValidationError);
  });

  it("accepts all defined risk profiles", () => {
    for (const profile of RISK_PROFILES) {
      expect(validateStrategy({ name: "X", riskProfile: profile }).riskProfile).toBe(profile);
    }
  });

  it("treats blank optional fields as null", () => {
    const out = validateStrategy({ name: "X", thesis: "   " });
    expect(out.thesis).toBeNull();
  });
});

describe("validateAllocation", () => {
  it("rejects a missing asset class", () => {
    expect(() => validateAllocation({ targetWeight: 20 }, 0)).toThrow(ValidationError);
  });

  it("rejects a missing or non-numeric weight", () => {
    expect(() => validateAllocation({ assetClass: "Bonds" }, 0)).toThrow(ValidationError);
    expect(() => validateAllocation({ assetClass: "Bonds", targetWeight: Number.NaN }, 0)).toThrow(
      ValidationError
    );
  });

  it("rejects weights outside 0–100", () => {
    expect(() => validateAllocation({ assetClass: "Bonds", targetWeight: -1 }, 0)).toThrow(
      ValidationError
    );
    expect(() => validateAllocation({ assetClass: "Bonds", targetWeight: 101 }, 0)).toThrow(
      ValidationError
    );
  });

  it("rejects a total that would exceed 100%", () => {
    // 80 already allocated; adding 30 would total 110
    expect(() => validateAllocation({ assetClass: "Cash", targetWeight: 30 }, 80)).toThrow(
      ValidationError
    );
  });

  it("allows a total up to and including 100%", () => {
    // 70 already allocated; adding 30 totals exactly 100
    expect(() => validateAllocation({ assetClass: "Cash", targetWeight: 30 }, 70)).not.toThrow();
  });

  it("accounts for the weight being replaced when editing", () => {
    // Existing allocation of an asset is being replaced from 30 to 40,
    // and other allocations total 70. Total stays (70 - 30 + 40) = 80.
    expect(() =>
      validateAllocation({ assetClass: "Bonds", targetWeight: 40 }, 70, 30)
    ).not.toThrow();
  });
});

describe("validateStrategyUpdate", () => {
  it("rejects a missing title or description", () => {
    expect(() =>
      validateStrategyUpdate({
        description: "x",
        effectiveDate: new Date(),
      })
    ).toThrow(ValidationError);
    expect(() => validateStrategyUpdate({ title: "x", effectiveDate: new Date() })).toThrow(
      ValidationError
    );
  });

  it("rejects a missing or invalid effective date", () => {
    expect(() => validateStrategyUpdate({ title: "t", description: "d" })).toThrow(ValidationError);
    expect(() =>
      validateStrategyUpdate({
        title: "t",
        description: "d",
        effectiveDate: new Date(Number.NaN),
      })
    ).toThrow(ValidationError);
  });

  it("accepts a valid update", () => {
    const d = new Date();
    const out = validateStrategyUpdate({
      title: "Rebalance",
      description: "Trimmed bonds",
      reasoning: "Yield risk",
      effectiveDate: d,
    });
    expect(out.title).toBe("Rebalance");
    expect(out.reasoning).toBe("Yield risk");
  });
});

describe("isPublishable", () => {
  it("requires a name and a risk profile", () => {
    expect(isPublishable({ name: "X", riskProfile: "MODERATE" })).toBe(true);
    expect(isPublishable({ name: "X" })).toBe(false);
    expect(isPublishable({ riskProfile: "MODERATE" })).toBe(false);
  });
});

describe("assertTransition", () => {
  it("allows draft -> published and draft -> archived", () => {
    expect(() => assertTransition("DRAFT", "PUBLISHED")).not.toThrow();
    expect(() => assertTransition("DRAFT", "ARCHIVED")).not.toThrow();
  });

  it("allows published -> archived", () => {
    expect(() => assertTransition("PUBLISHED", "ARCHIVED")).not.toThrow();
  });

  it("rejects published -> published and archived -> anything", () => {
    expect(() => assertTransition("PUBLISHED", "PUBLISHED")).toThrow(BusinessRuleError);
    expect(() => assertTransition("ARCHIVED", "PUBLISHED")).toThrow(BusinessRuleError);
    expect(() => assertTransition("ARCHIVED", "ARCHIVED")).toThrow(BusinessRuleError);
  });
});
