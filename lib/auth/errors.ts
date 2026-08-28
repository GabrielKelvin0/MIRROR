/**
 * Authentication error classes.
 */

export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "You do not have permission") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class UnverifiedEmailError extends Error {
  constructor(message: string = "Email verification required") {
    super(message);
    this.name = "UnverifiedEmailError";
  }
}
