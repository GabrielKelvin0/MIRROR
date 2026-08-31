import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for the authorization choke-point (lib/auth/session.ts).
 *
 * This is the Phase 16 priority area: authorization / security-sensitive
 * operations. The full chain (Clerk session -> getCurrentUser local lookup ->
 * assertRole local role) is exercised with Clerk, next/navigation, and the DB
 * mocked out. `server-only` is stubbed so the module loads in a node test env.
 */

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  redirect: vi.fn(),
  findByClerkId: vi.fn(),
  upsertFromClerk: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  currentUser: mocks.currentUser,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("@/lib/db", () => ({
  userRepository: {
    findByClerkId: mocks.findByClerkId,
    upsertFromClerk: mocks.upsertFromClerk,
  },
}));

import { requireAuth, getOptionalAuth, getCurrentUser, requireRole } from "./session";
import { ForbiddenError } from "@/lib/errors";

beforeEach(() => {
  vi.clearAllMocks();
  // redirect() models Next.js behavior of terminating the request by throwing.
  mocks.redirect.mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  });
});

describe("requireAuth", () => {
  it("redirects to /sign-in when there is no authenticated Clerk session", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("returns the Clerk session when authenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    const session = await requireAuth();
    expect(session.userId).toBe("user_123");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("getOptionalAuth", () => {
  it("returns the session without redirecting for an unauthenticated request", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const session = await getOptionalAuth();
    expect(session.userId).toBeNull();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("getCurrentUser", () => {
  it("returns the existing local user keyed by the Clerk subject", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    const existing = { id: "local_1", clerkId: "user_123", role: "LEARNER" };
    (mocks.findByClerkId as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    const user = await getCurrentUser();
    expect(user).toBe(existing);
    expect(mocks.findByClerkId).toHaveBeenCalledWith("user_123");
    expect(mocks.upsertFromClerk).not.toHaveBeenCalled();
  });

  it("upserts a new local user from Clerk details when none exists", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_new" });
    (mocks.findByClerkId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    mocks.currentUser.mockResolvedValue({
      emailAddresses: [{ emailAddress: "a@b.com" }],
      firstName: "Ada",
      lastName: "Lovelace",
    });
    const newUser = { id: "local_2", clerkId: "user_new", role: "LEARNER" };
    (mocks.upsertFromClerk as ReturnType<typeof vi.fn>).mockResolvedValue(newUser);

    const user = await getCurrentUser();
    expect(mocks.upsertFromClerk).toHaveBeenCalledWith("user_new", "a@b.com", "Ada", "Lovelace");
    expect(user).toBe(newUser);
  });
});

describe("requireRole", () => {
  it("returns the local user when their role matches the guard", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    const creator = { id: "local_1", clerkId: "user_123", role: "CREATOR" };
    (mocks.findByClerkId as ReturnType<typeof vi.fn>).mockResolvedValue(creator);

    const user = await requireRole("CREATOR");
    expect(user).toBe(creator);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects with ForbiddenError when the local role does not match the guard", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    const learner = { id: "local_1", clerkId: "user_123", role: "LEARNER" };
    (mocks.findByClerkId as ReturnType<typeof vi.fn>).mockResolvedValue(learner);

    await expect(requireRole("CREATOR")).rejects.toBeInstanceOf(ForbiddenError);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects to /sign-in when unauthenticated before any role check", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    await expect(requireRole("LEARNER")).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
    expect(mocks.findByClerkId).not.toHaveBeenCalled();
  });
});
