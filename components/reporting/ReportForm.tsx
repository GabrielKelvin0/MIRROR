"use client";
import Link from "next/link";
import { useActionState, useId } from "react";
import { submitReport } from "@/app/reports/actions";
import { REPORT_REASONS } from "@/lib/services/moderation-rules";

export function ReportForm({
  resourceType,
  resourceId,
  reportsHref,
}: {
  resourceType: "STRATEGY" | "USER";
  resourceId: string;
  reportsHref: string;
}) {
  const [state, formAction, pending] = useActionState(submitReport, {});
  const id = useId();
  if (state.success)
    return (
      <div className="space-y-3 rounded-lg bg-emerald-50 p-5">
        <p role="status" className="text-emerald-900">
          {state.success}
        </p>
        <Link
          href={reportsHref}
          className="inline-block py-2 font-medium text-emerald-800 underline"
        >
          View My reports
        </Link>
      </div>
    );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="resourceType" value={resourceType} />
      <input type="hidden" name="resourceId" value={resourceId} />
      <fieldset disabled={pending} className="space-y-4">
        <legend className="sr-only">Report details</legend>
        <div>
          <label htmlFor={id + "-reason"} className="block text-sm font-medium">
            Reason
          </label>
          <select
            id={id + "-reason"}
            name="reason"
            required
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Choose a reason
            </option>
            {REPORT_REASONS.map((reason) => (
              <option key={reason}>{reason}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id + "-details"} className="block text-sm font-medium">
            Details
          </label>
          <textarea
            id={id + "-details"}
            name="description"
            maxLength={5000}
            rows={5}
            aria-describedby={id + "-help"}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <p id={id + "-help"} className="mt-1 text-xs text-neutral-600">
            Describe what should be reviewed. Details are required for Other concern.
          </p>
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit report"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
