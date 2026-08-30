import { ForbiddenError, NotFoundError } from "@/lib/errors";

/**
 * Verify that a user owns a resource.
 *
 * This is a server-side authorization check. Throws ForbiddenError
 * if the acting user is not the owner of the resource (defends
 * against IDOR).
 */
export function verifyOwnership(
  resourceOwnerId: string,
  userId: string,
  resourceName: string = "resource",
): void {
  if (resourceOwnerId !== userId) {
    throw new ForbiddenError(`You do not own this ${resourceName}`);
  }
}

/**
 * Verify that a value is not null/undefined.
 *
 * Throws NotFoundError if the value is null/undefined.
 */
export function verifyExists<T>(value: T | null | undefined, entityName: string): T {
  if (!value) {
    throw new NotFoundError(`${entityName} not found`);
  }
  return value;
}
