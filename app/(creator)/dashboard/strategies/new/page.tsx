import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { StrategyCreateForm } from "@/components/creator/StrategyCreateForm";

export const metadata = {
  title: "New Strategy · MIRROR Creator",
};

export default async function NewStrategyPage() {
  await requireRole("CREATOR");

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-8">
      <Link
        href="/creator/dashboard"
        className="text-sm font-medium text-neutral-500 hover:text-neutral-800"
      >
        ← Back to strategies
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Create a strategy draft</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Start with a name and risk profile; you can add the full thesis, allocation and decision
        rules before publishing.
      </p>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <StrategyCreateForm />
      </div>
    </div>
  );
}
