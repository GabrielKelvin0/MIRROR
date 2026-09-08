import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { strategyRepository } from "@/lib/db";
import type { StrategyStatus } from "@prisma/client";

const STATUS_LABEL: Record<StrategyStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

function StatusBadge({ status }: { status: StrategyStatus }) {
  const tone =
    status === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "ARCHIVED"
        ? "bg-neutral-100 text-neutral-600"
        : "bg-amber-50 text-amber-700";
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export const metadata = {
  title: "Your Strategies · MIRROR Creator",
};

export default async function CreatorDashboardPage() {
  const user = await requireRole("CREATOR");
  const strategies = await strategyRepository.listByCreator(user.id);

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Your strategies</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Create, refine, and publish transparent strategy blueprints.
          </p>
        </div>
        <Link
          href="/creator/dashboard/strategies/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          New strategy
        </Link>
      </div>

      {strategies.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-neutral-300 p-12 text-center">
          <h2 className="text-lg font-semibold text-neutral-900">No strategies yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
            Start by creating a draft. You can define its philosophy, allocation, thesis and
            decision rules before publishing.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {strategies.map((s) => (
            <li key={s.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="truncate font-semibold text-neutral-900">{s.name}</h2>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    {s.allocations.length} allocation
                    {s.allocations.length === 1 ? "" : "s"} · {s._count.updates} update
                    {s._count.updates === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/creator/dashboard/strategies/${s.id}/edit`}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/creator/dashboard/strategies/${s.id}/preview`}
                    className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
                  >
                    Preview
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
