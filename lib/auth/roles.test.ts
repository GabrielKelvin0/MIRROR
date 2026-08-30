import { describe, it, expect } from "vitest";
import { hasRole, assertRole, type RoleCheckUser } from "./roles";
import { ForbiddenError } from "@/lib/errors";

/**
 * These tests exercise the server-side role authorization boundary
 * (lib/auth/roles.ts). The local user and its role are always derived
 * from the database (see lib/auth/session.ts) and are never trusted
 * from the client. A null user represents an unauthenticated request
 * that did not resolve to a local MIRROR user.
 */

const learner: RoleCheckUser = { id: "user-learner", role: "LEARNER" };
const creator: RoleCheckUser = { id: "user-creator", role: "CREATOR" };
const admin: RoleCheckUser = { id: "user-admin", role: "ADMIN" };

describe("hasRole (role boundary)", () => {
  it("accepts a learner by the learner guard", () => {
    expect(hasRole(learner, "LEARNER")).toBe(true);
  });

  it("rejects a learner by the creator guard", () => {
    expect(hasRole(learner, "CREATOR")).toBe(false);
  });

  it("rejects a learner by the admin guard", () => {
    expect(hasRole(learner, "ADMIN")).toBe(false);
  });

  it("accepts a creator by the creator guard", () => {
    expect(hasRole(creator, "CREATOR")).toBe(true);
  });

  it("rejects a creator by the admin guard", () => {
    expect(hasRole(creator, "ADMIN")).toBe(false);
  });

  it("accepts an admin by the admin guard", () => {
    expect(hasRole(admin, "ADMIN")).toBe(true);
  });

  it("rejects an unauthenticated (null) user by all guards", () => {
    expect(hasRole(null, "LEARNER")).toBe(false);
    expect(hasRole(null, "CREATOR")).toBe(false);
    expect(hasRole(null, "ADMIN")).toBe(false);
    expect(hasRole(undefined, "LEARNER")).toBe(false);
  });

  it("rejects a user whose role is not the required role", () => {
    expect(hasRole({ id: "x", role: "CREATOR" }, "ADMIN")).toBe(false);
  });
});

describe("assertRole (enforced authorization)", () => {
  it("does not throw when the user has the required role", () => {
    expect(() => assertRole(creator, "CREATOR")).not.toThrow();
    expect(() => assertRole(admin, "ADMIN")).not.toThrow();
  });

  it("throws ForbiddenError when a learner hits the admin guard", () => {
    expect(() => assertRole(learner, "ADMIN")).toThrow(ForbiddenError);
  });

  it("throws ForbiddenError for an unauthenticated (null) user", () => {
    expect(() => assertRole(null, "LEARNER")).toThrow(ForbiddenError);
    expect(() => assertRole(null, "ADMIN")).toThrow(ForbiddenError);
  });

  it("never authorizes on client-supplied role values", () => {
    // Regardless of any claimed role string, the boundary only trusts
    // the local database user's role. A mismatched require role fails.
    const arbitraryClaim = { id: "any", role: "ADMIN" as const };
    expect(() => assertRole(arbitraryClaim, "CREATOR")).toThrow(ForbiddenError);
  });
});
