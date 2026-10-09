import Link from "next/link";
import type { ReportRepository } from "@/lib/db/repositories/report-repository";

type Reports = Awaited<ReturnType<ReportRepository["listOwned"]>>;
export function MyReports({ reports }: { reports: Reports }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 sm:p-8">
      <h1 className="text-3xl font-semibold">My reports</h1>
      <p className="text-neutral-600">
        Follow the status of your most recent 50 reports. Your report details are visible to you and
        platform administrators.
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/strategies" className="py-2 font-medium text-emerald-700 underline">
          Browse strategies
        </Link>
        <Link href="/creators" className="py-2 font-medium text-emerald-700 underline">
          Browse creators
        </Link>
      </div>
      <p className="text-sm text-neutral-600">
        Use Report content on a published strategy or creator profile to submit a concern.
      </p>
      {reports.length ? (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li
              key={report.id}
              className="break-words rounded-xl border border-neutral-200 bg-white p-5"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="font-semibold">
                  {report.resourceName ??
                    (report.resourceType === "STRATEGY"
                      ? "Strategy report"
                      : report.resourceType === "USER"
                        ? "Creator report"
                        : "Earlier content report")}
                </h2>
                <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium">
                  {report.status.toLowerCase()}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium">{report.reason}</p>
              {report.description ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                  {report.description}
                </p>
              ) : null}
              <time
                dateTime={report.createdAt.toISOString()}
                className="mt-3 block text-xs text-neutral-600"
              >
                {report.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8">
          <p>You have not submitted any reports.</p>
        </div>
      )}
    </div>
  );
}
