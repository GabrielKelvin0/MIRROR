import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  BusinessRuleError,
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

describe("AppError subclasses (codes/status/defaults)", () => {
  it("UnauthorizedError maps to code UNAUTHORIZED and status 401", () => {
    const err = new UnauthorizedError();
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("Authentication required");
  });

  it("ForbiddenError maps to code FORBIDDEN and status 403", () => {
    const err = new ForbiddenError();
    expect(err.code).toBe("FORBIDDEN");
    expect(err.statusCode).toBe(403);
  });

  it("NotFoundError maps to code NOT_FOUND and status 404", () => {
    const err = new NotFoundError();
    expect(err.code).toBe("NOT_FOUND");
    expect(err.statusCode).toBe(404);
  });

  it("ValidationError maps to code VALIDATION_ERROR, status 400, and exposes fields", () => {
    const err = new ValidationError("Bad name", { name: "required" });
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.statusCode).toBe(400);
    expect(err.fields).toEqual({ name: "required" });
  });

  it("BusinessRuleError maps to code BUSINESS_RULE_ERROR and status 422", () => {
    const err = new BusinessRuleError("Cannot transition");
    expect(err.code).toBe("BUSINESS_RULE_ERROR");
    expect(err.statusCode).toBe(422);
  });

  it("ConflictError maps to code CONFLICT and status 409", () => {
    const err = new ConflictError();
    expect(err.code).toBe("CONFLICT");
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe("Resource already exists");
  });
});
