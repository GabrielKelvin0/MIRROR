import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { userRepository } from "@/lib/db";
import { assertRole } from "@/lib/auth/roles";

type ClerkSession = ReturnType<typeof auth>;

/**
 * Get the current authenticated Clerk session.
 *
 * Redirects unauthenticated users to /sign-in.
 */
export async function requireAuth(): Promise<Awaited<ClerkSession>> {
  const session = await auth();
  if (!session?.userId) {
    redirect("/sign-in");
  }
  return session;
}

/**
 * Get the current Clerk session (or an unauthenticated one), without
 * redirecting. Public, non-redirecting variant for optional-auth call sites.
 */
export async function getOptionalAuth(): Promise<Awaited<ClerkSession>> {
  return await auth();
}

/**
 * Resolve (create or retrieve) the local MIRROR User for the
 * authenticated Clerk subject.
 *
 * Identity mapping:
 *   Clerk session → authenticated provider subject (clerkId)
 *     → local MIRROR User (unique by clerkId)
 *     → defaults newly-created users to LEARNER
 *
 * The subject is always derived from the server-verified Clerk session.
 * It is never supplied by the client as an authority mechanism.
 */
export async function getCurrentUser() {
  const session = await requireAuth();
  const clerkId = session.userId as string;

  const existing = await userRepository.findByClerkId(clerkId);
  if (existing) {
    return existing;
  }

  const clerk = await currentUser();
  const email = clerk?.emailAddresses?.[0]?.emailAddress ?? "";
  const firstName = clerk?.firstName ?? null;
  const lastName = clerk?.lastName ?? null;

  return userRepository.upsertFromClerk(clerkId, email, firstName, lastName);
}

/**
 * Require the current local MIRROR user to have the given role.
 *
 * Enforces the full authorization chain:
 *   Clerk authenticated session
 *     → authenticated provider subject
 *       → local MIRROR User
 *         → local User.role
 *           → required role
 *
 * Redirects unauthenticated users to /sign-in and unauthorized
 * users (wrong role) to the public home page.
 */
export async function requireRole(role: UserRole) {
  await requireAuth();
  const user = await getCurrentUser();
  assertRole(user, role);
  return user;
}
