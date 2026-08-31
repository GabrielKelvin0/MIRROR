/**
 * MIRROR — Payment provider abstraction (Phase 12, concern 3 of 3).
 *
 * This is the SEPARATE "payment provider implementation" boundary. It defines a
 * narrow CONTRACT for executing/settling payments and intentionally contains NO
 * product/business logic. Product entitlement decisions live in
 * lib/services/entitlement-rules.ts (concern 1) and subscription STATE lives in
 * the DB repository (concern 2). Providers only ever translate an authorised,
 * entitled request into a payment action.
 *
 * "Do not hard-code business logic directly into Stripe-specific code": a real
 * provider implementation would live behind this interface and be selected
 * here — it would never decide WHAT a plan may access; it only executes a
 * payment.
 *
 * "Do not activate real payments without required environment configuration and
 * explicit implementation requirements": until a provider is configured via
 * environment variables (e.g. a Stripe secret), `getPaymentProvider()` returns a
 * stub that refuses every operation. No payment can run in this codebase today.
 */

import "server-only";

/* ------------------------------------------------------------------ */
/* Contract                                                            */
/* ------------------------------------------------------------------ */

/** Outcomes a provider can report for a payment action. */
export type PaymentResult =
  { ok: true; providerReference: string } | { ok: false; reason: "declined" | "provider_error" };

/** A request to collect payment for a strategy subscription. */
export interface StartStrategySubscriptionInput {
  userId: string;
  strategyId: string;
  /** Amount in minor currency units (e.g. cents). Decisions come from rules, not here. */
  amountMinor: number;
  currency: string;
  /** Landing URLs for the checkout lifecycle. */
  successUrl: string;
  cancelUrl: string;
}

/** A request to cancel an existing strategy subscription. */
export interface CancelSubscriptionInput {
  /** External provider reference (e.g. Stripe subscription id). */
  providerReference: string;
}

/**
 * The provider CONTRACT. Implementations translate an entitled request into a
 * payment action. They must not encode entitlements themselves.
 */
export interface PaymentProvider {
  readonly name: string;
  /** Create a checkout/session for a strategy subscription. */
  startStrategySubscription(input: StartStrategySubscriptionInput): Promise<PaymentResult>;
  /** Cancel an existing subscription at the provider. */
  cancelSubscription(input: CancelSubscriptionInput): Promise<PaymentResult>;
}

/* ------------------------------------------------------------------ */
/* Unconfigured stub                                                   */
/* ------------------------------------------------------------------ */

/**
 * The default provider when none is configured. Refuses every operation so no
 * payment can be activated accidentally. This is the Phase 12 guardrail: real
 * payments require explicit environment configuration AND explicit
 * implementation requirements before a real provider may be selected.
 */
class UnconfiguredProvider implements PaymentProvider {
  readonly name = "unconfigured";
  private error() {
    return new Error(
      "Payments are not configured. A payment provider must be configured via " +
        "environment variables and explicitly enabled before any payment can run."
    );
  }

  async startStrategySubscription(): Promise<PaymentResult> {
    throw this.error();
  }

  async cancelSubscription(): Promise<PaymentResult> {
    throw this.error();
  }
}

/* ------------------------------------------------------------------ */
/* Provider selection                                                  */
/* ------------------------------------------------------------------ */

/** Names of supported payment providers. Extend when a real provider is added. */
export type PaymentProviderName = "unconfigured" | "stripe";

/** Readable by the server only; never exposed to the browser. */
function isProviderConfigured(): PaymentProviderName {
  // A real provider (e.g. Stripe, keyed by STRIPE_SECRET_KEY) is NOT enabled.
  // The documented env variables (.env.example) remain optional/future and are
  // deliberately not consumed until an explicit provider implementation exists
  // AND the required configuration is present. Until then, payments stay off.
  return "unconfigured";
}

const unconfiguredProvider = new UnconfiguredProvider();

/**
 * Return the active payment provider for the process. Today this is always the
 * unconfigured stub (payments disabled). When a real provider is implemented,
 * selection happens here based on environment configuration — never inside the
 * rules or the DB repository.
 */
export function getPaymentProvider(): PaymentProvider {
  const configured = isProviderConfigured();
  if (configured === "stripe") {
    // A real Stripe implementation would be selected and returned here. It is
    // intentionally absent: enabling it requires explicit implementation
    // requirements and the required environment configuration.
  }
  return unconfiguredProvider;
}
