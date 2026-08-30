import { describe, it, expect } from "vitest";
import {
  validateFollowInput,
  shouldNotifyForUpdate,
  buildUpdateNotification,
  applyReadTransition,
  FOLLOW_UPDATE_KIND,
} from "./following-rules";
import { ValidationError, BusinessRuleError } from "@/lib/errors";

/**
 * These tests exercise the pure following/notification business rules
 * (lib/services/following-rules.ts): follow input validation, the
 * "meaningful update" anti-spam gate, safe notification payload building, and
 * read-state transitions.
 */

describe("validateFollowInput", () => {
  it("normalizes a valid strategy id", () => {
    expect(validateFollowInput({ strategyId: "  abc  " })).toEqual({ strategyId: "abc" });
  });

  it("rejects a missing or blank strategy id", () => {
    expect(() => validateFollowInput({})).toThrow(ValidationError);
    expect(() => validateFollowInput({ strategyId: "   " })).toThrow(ValidationError);
  });
});

describe("shouldNotifyForUpdate (anti-spam gate)", () => {
  it("notifies only for published strategies with meaningful updates", () => {
    const publishable = { title: "Rebalance", description: "Trimmed bonds" };
    expect(shouldNotifyForUpdate({ status: "PUBLISHED" }, publishable)).toBe(true);
  });

  it("does not notify for drafts or archived strategies", () => {
    const meaningful = { title: "Rebalance", description: "Trimmed bonds" };
    expect(shouldNotifyForUpdate({ status: "DRAFT" }, meaningful)).toBe(false);
    expect(shouldNotifyForUpdate({ status: "ARCHIVED" }, meaningful)).toBe(false);
  });

  it("does not notify for blank or partial updates (anti-spam)", () => {
    const published = { status: "PUBLISHED" } as const;
    expect(shouldNotifyForUpdate(published, { title: "", description: "x" })).toBe(false);
    expect(shouldNotifyForUpdate(published, { title: "t", description: "   " })).toBe(false);
    expect(shouldNotifyForUpdate(published, { title: "", description: "" })).toBe(false);
  });
});

describe("buildUpdateNotification", () => {
  it("builds a safe STRATEGY_UPDATE payload", () => {
    const out = buildUpdateNotification("The Compounder", {
      title: "Rebalance",
      description: "Trimmed bonds",
    });
    expect(out.kind).toBe(FOLLOW_UPDATE_KIND);
    expect(out.title).toBe("The Compounder published an update");
    expect(out.message).toBe("Rebalance");
  });

  it("rejects a blank strategy name", () => {
    expect(() => buildUpdateNotification("   ", { title: "t", description: "d" })).toThrow(
      ValidationError
    );
  });

  it("rejects a non-meaningful update", () => {
    expect(() => buildUpdateNotification("S", { title: "", description: "d" })).toThrow(
      ValidationError
    );
  });
});

describe("applyReadTransition", () => {
  it("allows unread -> read", () => {
    expect(applyReadTransition(false, true)).toBe(true);
  });

  it("allows read -> unread", () => {
    expect(applyReadTransition(true, false)).toBe(false);
  });

  it("rejects keeping the same state", () => {
    expect(() => applyReadTransition(false, false)).toThrow(BusinessRuleError);
    expect(() => applyReadTransition(true, true)).toThrow(BusinessRuleError);
  });
});
