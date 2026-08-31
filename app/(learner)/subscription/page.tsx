import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { subscriptionRepository } from "@/lib/db";
import { isPlanEntitled, FEATURES, KNOWN_PLANS } from "@/lib/services/entitlement-rules";

export const metadata: Metadata = {
  title: "Subscription",
  description: "Your MIRROR plan and entitlements.",
};

const PLAN_LABELS: Record<string, string> = {
  FREE: "Free learner",
  PRO_LEARNER: "Pro learner",
  PREMIUM_CREATOR: "Premium creator",
};

const FEATURE_LABELS: Record<string, string> = {
  [FEATURES.FOLLOW_STRATEGIES]: "Follow strategies",
  [FEATURES.PAPER_PORTFOLIO]: "Paper portfolios",
  [FEATURES.ACADEMY]: "Academy access",
  [FEATURES.PERFORMANCE_RISK]: "Performance & risk metrics",
  [FEATURES.PRO_STRATEGIES]: "Pro strategies",
  [FEATURES.PUBLISH_STRATEGIES]: "Publish strategies",
  [FEATURES.CREATOR_INSIGHTS]: "Creator insights",
};

export default async function SubscriptionPage() {
  const user = await requireRole("LEARNER");
  // No paid strategies exist yet (the Strategy schema has no price), so we pass
  // an empty list: learnerEntitlementSummary resolves their plan and features.
  const summary = await subscriptionRepository.learnerEntitlementSummary(user.id, []);

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Subscription &amp; entitlements</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          This page reflects the modular entitlement architecture: which plan you are on and which
          features that plan grants. It never charges anything and never promises an outcome.
        </p>
      </div>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-900">Payments are not activated</h2>
        <p className="mt-1 text-sm text-amber-800">
          No real payments run in MIRROR yet. Entitlements are decided by product rules; a payment
          provider must be explicitly configured and enabled before any charge can occur.
        </p>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Your current plan</h2>
        <div className="mt-4 space-y-3">
          <Row label="Plan" value={PLAN_LABELS[summary.plan] ?? summary.plan} />
          <Row label="Status" value={summary.status} />
        </div>

        <h3 className="mt-8 text-sm font-semibold text-neutral-800">Features your plan grants</h3>
        {summary.features.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">No features granted.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {summary.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
              >
                <span className="text-emerald-600">✓</span>
                {FEATURE_LABELS[feature] ?? feature}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Compare plans</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Determined entirely by the product entitlement rules — no provider involved.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Feature
                </th>
                {KNOWN_PLANS.map((plan) => (
                  <th key={plan} scope="col" className="py-2 px-4 font-medium">
                    {PLAN_LABELS[plan] ?? plan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(FEATURES) as Array<keyof typeof FEATURES>).map((key) => {
                const feature = FEATURES[key];
                return (
                  <tr key={feature} className="border-b border-neutral-100 last:border-0">
                    <td className="py-2 pr-4 text-neutral-700">
                      {FEATURE_LABELS[feature] ?? feature}
                    </td>
                    {KNOWN_PLANS.map((plan) => (
                      <td key={plan} className="py-2 px-4">
                        {isPlanEntitled(plan, feature) ? (
                          <span className="text-emerald-600">✓</span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
      <span className="text-neutral-500">{label}</span>
      <span className="font-semibold text-neutral-900">{value}</span>
    </div>
  );
}
