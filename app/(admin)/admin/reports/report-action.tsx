"use client";
import type { ReportStatus } from "@prisma/client";
import { resolveReport } from "@/app/(admin)/actions";
import { AdminChangeForm } from "@/components/admin/AdminChangeForm";
import { reportTransitions } from "@/lib/services/moderation-rules";

const LABELS: Record<ReportStatus, string> = {
  OPEN: "Reopen report",
  INVESTIGATING: "Start investigation",
  RESOLVED: "Resolve report",
  DISMISSED: "Dismiss report",
};
export default function ReportAction({ id, status }: { id: string; status: ReportStatus }) {
  return (
    <AdminChangeForm
      key={status}
      action={resolveReport.bind(null, id)}
      label="Review report"
      field="status"
      options={reportTransitions(status).map((value) => ({ value, label: LABELS[value] }))}
      hidden={{ expectedStatus: status }}
      help="Record the case decision. Content moderation is a separate action."
    />
  );
}
