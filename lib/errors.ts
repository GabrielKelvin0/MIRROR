/**
 * Application error classes.
 *
 * Used throughout the application for consistent error handling.
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super("UNAUTHORIZED", 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "You do not have permission") {
    super("FORBIDDEN", 403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super("NOT_FOUND", 404, message);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    public fields?: Record<string, string>,
  ) {
    super("VALIDATION_ERROR", 400, message);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super("BUSINESS_RULE_ERROR", 422, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super("CONFLICT", 409, message);
  }
}
