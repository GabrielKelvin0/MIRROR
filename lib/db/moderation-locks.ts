import "server-only";
import { Prisma } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

/** All admin mutations share this transaction lock; role writes take it exclusively.
 * This orders membership changes against privilege checks and serializes last-admin checks.
 * SELECT 1 avoids returning PostgreSQL's void type through Prisma's raw-query decoder.
 */
export async function lockMembership(
  tx: Prisma.TransactionClient,
  exclusive = false
): Promise<void> {
  if (exclusive) {
    await tx.$queryRaw(Prisma.sql`SELECT 1 AS locked FROM pg_advisory_xact_lock(23023, 1)`);
  } else {
    await tx.$queryRaw(Prisma.sql`SELECT 1 AS locked FROM pg_advisory_xact_lock_shared(23023, 1)`);
  }
}

export async function requireAdminTransaction(
  tx: Prisma.TransactionClient,
  actorId: string,
  exclusive = false
): Promise<void> {
  await lockMembership(tx, exclusive);
  const actor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true } });
  if (actor?.role !== "ADMIN") throw new ForbiddenError("Administrator access is required");
}

export async function lockUser(tx: Prisma.TransactionClient, id: string): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "User" WHERE "id" = ${id} FOR UPDATE`
  );
  if (!rows.length) throw new NotFoundError("User not found");
}

export async function lockStrategy(tx: Prisma.TransactionClient, id: string): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "Strategy" WHERE "id" = ${id} FOR UPDATE`
  );
  if (!rows.length) throw new NotFoundError("Strategy not found");
}

export async function lockReport(tx: Prisma.TransactionClient, id: string): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "Report" WHERE "id" = ${id} FOR UPDATE`
  );
  if (!rows.length) throw new NotFoundError("Report not found");
}

export const moderationTransactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  timeout: 10000,
};
