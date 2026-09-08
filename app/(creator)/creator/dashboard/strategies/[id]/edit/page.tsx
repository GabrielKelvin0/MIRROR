import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { strategyRepository } from "@/lib/db";
import { StrategyEditForm } from "@/components/creator/StrategyEditForm";
import { AllocationManager } from "@/components/creator/AllocationManager";
import { UpdateManager } from "@/components/creator/UpdateManager";
import { StatusControl } from "@/components/creator/StatusControl";
import { AppError } from "@/lib/errors";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Edit Strategy · MIRROR Creator",
};

export default async function EditStrategyPage({ params }: Props) {
  const { id } = await params;
  const user = await requireRole("CREATOR");

  let strategy;
  let allocations;
  let updates;
  try {
    const detail = await strategyRepository.getOwnedDetail(id, user.id);
    strategy = detail;
    allocations = detail.allocations;
    updates = detail.updates;
  } catch (err) {
    if (err instanceof AppError) {
      return (
        <div className="mx-auto max-w-2xl p-8 text-center">
          <h1 className="text-xl font-semibold text-neutral-900">Strategy unavailable</h1>
          <p className="mt-2 text-sm text-neutral-600">{err.message}</p>
          <Link
            href="/creator/dashboard"
            className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← Back to your strategies
          </Link>
        </div>
      );
    }
    throw err;
  }

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <Link
        href="/creator/dashboard"
        className="text-sm font-medium text-neutral-500 hover:text-neutral-800"
      >
        ← Back to strategies
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{strategy.name}</h1>
          <p className="text-sm text-neutral-500">Edit the blueprint below.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/creator/dashboard/strategies/${id}/preview`}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Preview
          </Link>
          <StatusControl strategyId={id} status={strategy.status} />
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-5 text-lg font-semibold text-neutral-900">Blueprint details</h2>
        <StrategyEditForm
          strategyId={id}
          initial={{
            name: strategy.name,
            description: strategy.description,
            philosophy: strategy.philosophy,
            objective: strategy.objective,
            riskProfile: strategy.riskProfile,
            timeHorizon: strategy.timeHorizon,
            thesis: strategy.thesis,
            decisionRules: strategy.decisionRules,
            rebalancePolicy: strategy.rebalancePolicy,
            exitConditions: strategy.exitConditions,
            invalidatingConditions: strategy.invalidatingConditions,
          }}
        />
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <AllocationManager
          strategyId={id}
          allocations={allocations.map((a) => ({
            id: a.id,
            assetClass: a.assetClass,
            targetWeight: a.targetWeight,
            reasoning: a.reasoning,
          }))}
        />
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <UpdateManager
          strategyId={id}
          updates={updates.map((u) => ({
            id: u.id,
            title: u.title,
            description: u.description,
            changesSummary: u.changesSummary,
            reasoning: u.reasoning,
            riskAssessment: u.riskAssessment,
            effectiveDate: u.effectiveDate.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}
