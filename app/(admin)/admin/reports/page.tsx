import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { adminRepository } from "@/lib/db/repositories/admin-repository";
import { AuditEntries } from "@/components/admin/AuditEntries";
import { REPORT_STATUSES } from "@/lib/services/moderation-rules";
import type { ReportStatus } from "@prisma/client";
import ReportAction from "./report-action";
import StrategyAction from "../strategies/strategy-action";

export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const query = await searchParams;
  const status = (REPORT_STATUSES as readonly string[]).includes(query.status ?? "")
    ? (query.status as ReportStatus)
    : undefined;
  const reports = await adminRepository.listReports(status);
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <h1 className="text-3xl font-semibold">Report review</h1>
      <p className="text-neutral-600">
        Review the most recent 100 submitted reports. Case status records the review decision; use
        content controls separately to archive or restore a strategy.
      </p>
      <nav aria-label="Report status" className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/reports" className="py-2 underline">
          All
        </Link>
        {REPORT_STATUSES.map((value) => (
          <Link key={value} href={"/admin/reports?status=" + value} className="py-2 underline">
            {value.toLowerCase()}
          </Link>
        ))}
      </nav>
      {reports.length ? (
        <ul className="space-y-5">
          {reports.map((report) => (
            <li
              key={report.id}
              className="min-w-0 space-y-4 break-words rounded-xl border bg-white p-5"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold">
                    {report.resourceName ?? report.strategy?.name ?? "Earlier content report"}
                  </h2>
                  <p className="mt-1 text-sm">{report.reason}</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    {report.resourceType} · {report.resourceId}
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Reported by {report.reporter.email} ·{" "}
                    {report.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                  </p>
                </div>
                <span className="h-fit rounded bg-neutral-100 px-2 py-1 text-xs">
                  {report.status.toLowerCase()}
                </span>
              </div>
              {report.description ? (
                <p className="whitespace-pre-wrap text-sm text-neutral-700">{report.description}</p>
              ) : null}
              <div className="flex flex-wrap items-start gap-4">
                <ReportAction id={report.id} status={report.status} />
                {report.strategy ? (
                  <StrategyAction
                    id={report.strategy.id}
                    status={report.strategy.status}
                    reportId={report.id}
                  />
                ) : null}
              </div>
              {report.history.length ? (
                <details className="border-t pt-3">
                  <summary className="cursor-pointer py-2 text-sm font-medium">
                    Recent case history
                  </summary>
                  <AuditEntries entries={report.history} />
                </details>
              ) : null}
              {report.moderationActions.length ? (
                <details className="border-t pt-3">
                  <summary className="cursor-pointer py-2 text-sm font-medium">
                    Content action records
                  </summary>
                  <ul className="space-y-3">
                    {report.moderationActions.map((action) => (
                      <li key={action.id} className="rounded bg-neutral-50 p-3 text-sm">
                        <p className="font-medium">
                          {action.reason?.startsWith("Report status changed to ")
                            ? "Legacy case-status record"
                            : action.action === "SUSPEND"
                              ? "Strategy archived"
                              : action.action === "RESTORE"
                                ? "Strategy restored to draft"
                                : action.action.toLowerCase()}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {action.reason ?? "Reason not recorded"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>No reports match this view.</p>
      )}
      <p className="text-xs text-neutral-600">
        Case history shows recent records from the current queue. Older audit records remain stored.
      </p>
    </div>
  );
}
