import "server-only";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

/**
 * Repository for user operations.
 *
 * This module is server-only: it must never be imported from a client
 * component. The Prisma client and the repository exclusively live on
 * the server.
 */
export class UserRepository {
  /**
   * Create or update a local MIRROR User from a Clerk subject.
   *
   * Identity is keyed by the unique Clerk `clerkId`. New users default
   * to LEARNER. Role is never updated here so an existing role cannot
   * be reset by a client or a repeated sign-in.
   */
  async upsertFromClerk(
    clerkId: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
  ) {
    return await prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        role: UserRole.LEARNER,
      },
      update: {
        email,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
      },
    });
  }

  /**
   * Find a local User by Clerk subject.
   */
  async findByClerkId(clerkId: string) {
    return await prisma.user.findUnique({
      where: { clerkId },
    });
  }

  /**
   * Find a local User by local User id.
   */
  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find a local User by email address.
   */
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update a local User's role.
   *
   * Server-only. Must only be called from an authorized ADMIN boundary.
   * Role must never be derived from client-supplied values.
   */
  async updateRole(id: string, role: UserRole) {
    return await prisma.user.update({
      where: { id },
      data: { role },
    });
  }
}

export const userRepository = new UserRepository();
