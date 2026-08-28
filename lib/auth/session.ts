import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user session.
 *
 * Throws if user is not authenticated.
 * Returns the Clerk session with userId.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/sign-in");
  }
  return session;
}

/**
 * Get the current user session, or null if not authenticated.
 */
export async function getOptionalAuth() {
  return await auth();
}

/**
 * Verify user has a specific role.
 *
 * Throws redirect to / if user lacks required role.
 */
export async function requireRole(role: "LEARNER" | "CREATOR" | "ADMIN") {
  const session = await requireAuth();

  // TODO: Phase 4 - Fetch user from database to verify role
  // For now, this is a placeholder that requires database access

  return session;
}

/**
 * Extract userId from Clerk session.
 */
export function getUserIdFromAuth(session: any): string {
  if (!session?.userId) {
    throw new Error("User not authenticated");
  }
  return session.userId;
}
