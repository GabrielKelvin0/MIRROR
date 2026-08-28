/**
 * Utility functions for common operations.
 */

/**
 * Verify that a user owns a resource.
 *
 * Throws ForbiddenError if user does not own resource.
 */
export function verifyOwnership(
  resourceOwnerId: string,
  userId: string,
  resourceName: string = "resource",
) {
  if (resourceOwnerId !== userId) {
    throw new Error(`You do not own this ${resourceName}`);
  }
}

/**
 * Verify that a value is not null/undefined.
 *
 * Throws NotFoundError if value is null/undefined.
 */
export function verifyExists<T>(value: T | null | undefined, entityName: string): T {
  if (!value) {
    throw new Error(`${entityName} not found`);
  }
  return value;
}
