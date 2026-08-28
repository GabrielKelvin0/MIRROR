import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

/**
 * Repository for user operations.
 */
export class UserRepository {
  /**
   * Create or update a user from Clerk identity.
   *
   * Called when user signs up or first authenticates.
   */
  async upsertFromClerk(clerkId: string, email: string, firstName?: string, lastName?: string) {
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
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      },
    });
  }

  /**
   * Find user by Clerk ID.
   */
  async findByClerkId(clerkId: string) {
    return await prisma.user.findUnique({
      where: { clerkId },
    });
  }

  /**
   * Find user by ID.
   */
  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email.
   */
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update user role.
   *
   * Only called by admins.
   */
  async updateRole(id: string, role: UserRole) {
    return await prisma.user.update({
      where: { id },
      data: { role },
    });
  }
}

export const userRepository = new UserRepository();
