import type { StrategyStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { adminRepository } from "@/lib/db";
import StrategyAction from "./strategy-action";

const STATUS_FILTERS = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export default async function Strategies({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const p = await searchParams;
  const requested = p.status ?? "";
  const status: StrategyStatus | undefined = (
    STATUS_FILTERS as readonly string[]
  ).includes(requested)
    ? (requested as StrategyStatus)
    : undefined;
  const rows = await adminRepository.listStrategies(status);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
      <h1 className="text-3xl font-semibold">Strategies</h1>
      <div className="flex gap-2 text-sm">
        <a href="/admin/strategies">All</a>
        <a href="?status=DRAFT">Draft</a>
        <a href="?status=PUBLISHED">Published</a>
        <a href="?status=ARCHIVED">Archived</a>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-4">Strategy</th>
              <th className="p-4">Creator</th>
              <th className="p-4">Status</th>
              <th className="p-4">Updated</th>
              <th className="p-4">Moderate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-4">
                  {s.name}
                  <div className="text-xs text-neutral-500">
                    {s.riskProfile || "Risk not set"} ·{" "}
                    {s.timeHorizon || "Horizon not set"}
                  </div>
                </td>
                <td className="p-4">
                  {[s.creator.firstName, s.creator.lastName]
                    .filter(Boolean)
                    .join(" ") || s.creator.email}
                </td>
                <td className="p-4">{s.status}</td>
                <td className="p-4">{s.updatedAt.toLocaleDateString()}</td>
                <td className="p-4">
                  <StrategyAction id={s.id} status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
