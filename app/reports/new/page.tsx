import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { reportRepository } from "@/lib/db/repositories/report-repository";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  assertReporterRole,
  reportResourceType,
  resourceId,
} from "@/lib/services/moderation-rules";
import { ReportForm } from "@/components/reporting/ReportForm";

export const metadata = { title: "Report content · MIRROR" };
export default async function NewReport({
  searchParams,
}: {
  searchParams: Promise<{ resourceType?: string; resourceId?: string }>;
}) {
  const user = await getCurrentUser();
  if (user.role === "ADMIN") redirect("/admin/reports");
  assertReporterRole(user.role);
  const query = await searchParams;
  let type, id, target;
  try {
    type = reportResourceType(query.resourceType);
    id = resourceId(query.resourceId);
    target = await reportRepository.getPublicTarget(type, id);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) notFound();
    throw error;
  }
  const reportsHref = user.role === "CREATOR" ? "/creator/reports" : "/learner/reports";
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <Link
        href={reportsHref}
        className="inline-block py-2 text-sm font-medium text-emerald-700 underline"
      >
        ← My reports
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">Report content</h1>
        <p className="mt-3 text-sm text-neutral-600">{target.type}</p>
        <Link
          href={target.href}
          className="mt-1 inline-block break-words text-lg font-medium text-emerald-700 underline"
        >
          {target.name}
        </Link>
      </div>
      <p className="text-sm text-neutral-600">
        Your concern will be reviewed by platform administrators. Submitting a report does not
        automatically remove content.
      </p>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <ReportForm resourceType={type} resourceId={id} reportsHref={reportsHref} />
      </div>
    </main>
  );
}
