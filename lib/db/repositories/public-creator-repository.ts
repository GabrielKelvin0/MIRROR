/**
 * MIRROR — Public creator repository (server-only).
 *
 * Returns only public-safe creator data for the public creator directory and
 * profile pages. Every query uses explicit selects: full User rows (with
 * email, clerkId, and internal metadata) are never passed toward the public
 * UI. Draft and archived strategies are never returned by the public
 * published-strategy query.
 *
 * Visibility contract (documented, deliberate):
 *   - The directory lists users with role CREATOR who have a CreatorProfile
 *     and at least one PUBLISHED strategy.
 *   - A profile page resolves only users with role CREATOR; everyone else
 *     (including existing LEARNER/ADMIN accounts) is a 404.
 *   - followerCount is not surfaced publicly because nothing in the current
 *     architecture maintains it (follows are strategy-level).
 */

import "server-only";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export class PublicCreatorRepository {
  /** Directory entries: CREATOR role + profile + at least one PUBLISHED strategy. */
  async listDirectory() {
    return prisma.user.findMany({
      where: {
        role: UserRole.CREATOR,
        creatorProfile: { isNot: null },
        strategies: { some: { status: "PUBLISHED" } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        creatorProfile: {
          select: {
            bio: true,
            investmentPhilosophy: true,
            yearsOfExperience: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            strategies: { where: { status: "PUBLISHED" } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /** Public profile for a single creator (role-gated; returns null otherwise). */
  async getPublicCreator(id: string) {
    return prisma.user.findFirst({
      where: { id, role: UserRole.CREATOR },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        creatorProfile: {
          select: {
            bio: true,
            investmentPhilosophy: true,
            yearsOfExperience: true,
            isVerified: true,
          },
        },
      },
    });
  }

  /** PUBLISHED strategies for a creator, shaped like listPublished for reuse. */
  async listPublishedByCreator(creatorId: string) {
    return prisma.strategy.findMany({
      where: { creatorId, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            creatorProfile: { select: { isVerified: true } },
          },
        },
      },
    });
  }
}

export type PublicCreatorDirectoryEntry = Awaited<
  ReturnType<PublicCreatorRepository["listDirectory"]>
>[number];

export type PublicCreatorProfile = NonNullable<
  Awaited<ReturnType<PublicCreatorRepository["getPublicCreator"]>>
>;

export const publicCreatorRepository = new PublicCreatorRepository();
