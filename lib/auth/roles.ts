import type { UserRole } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors";

export type LocalUserRole = UserRole;

export interface RoleCheckUser {
  id: string;
  role: UserRole;
}

/**
 * Verify that a local MIRROR user has the required role.
 *
 * This is the server-side authorization boundary for role checks.
 * It MUST be called with the local database user, never with
 * client-supplied state or Clerk metadata.
 */
export function hasRole(
  user: RoleCheckUser | null | undefined,
  required: LocalUserRole,
): boolean {
  return user?.role === required;
}

/**
 * Assert that the local user has the required role.
 * Throws ForbiddenError when the user lacks the role.
 */
export function assertRole(
  user: RoleCheckUser | null | undefined,
  required: LocalUserRole,
): void {
  if (!hasRole(user, required)) {
    throw new ForbiddenError();
  }
}
