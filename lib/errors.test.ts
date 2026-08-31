import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  safeErrorMessage,
} from "./errors";

/**
 * Unit tests for the Phase 13 error-sanitisation boundary.
 * `safeErrorMessage` must pass through intentional AppError messages but must
 * NEVER surface the internal message of a non-AppError error (which could leak
 * query text, stack traces, or file paths to a client).
 */

describe("safeErrorMessage", () => {
  it("passes through intentional AppError messages", () => {
    expect(safeErrorMessage(new ValidationError("Strategy name is required"))).toBe(
      "Strategy name is required"
    );
    expect(safeErrorMessage(new ForbiddenError("You do not own this strategy"))).toBe(
      "You do not own this strategy"
    );
    expect(safeErrorMessage(new NotFoundError("Portfolio not found"))).toBe("Portfolio not found");
  });

  it("collapses non-AppError errors to a generic fallback (no internal leakage)", () => {
    const internal = new Error("SELECT * FROM secrets WHERE connection=pq://db:5432 at file.ts:12");
    const msg = safeErrorMessage(internal);
    expect(msg).toBe("Something went wrong");
    expect(msg).not.toContain("SELECT");
    expect(msg).not.toContain("db:5432");
    expect(msg).not.toContain("file.ts");
  });

  it("uses a custom fallback when provided", () => {
    expect(safeErrorMessage(new Error("boom"), "Try again later")).toBe("Try again later");
  });

  it("collapses non-Error thrown values safely", () => {
    expect(safeErrorMessage("boom")).toBe("Something went wrong");
    expect(safeErrorMessage(undefined)).toBe("Something went wrong");
  });

  it("treats subclasses of AppError as safe", () => {
    expect(safeErrorMessage(new AppError("X", 400, "custom app message"))).toBe(
      "custom app message"
    );
  });
});
