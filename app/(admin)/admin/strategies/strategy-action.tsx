"use client";
import type { StrategyStatus } from "@prisma/client";
import { moderateStrategy } from "@/app/(admin)/actions";
import { AdminChangeForm } from "@/components/admin/AdminChangeForm";

export default function StrategyAction({
  id,
  status,
  reportId,
}: {
  id: string;
  status: StrategyStatus;
  reportId?: string;
}) {
  const options =
    status === "DRAFT"
      ? [
          { value: "PUBLISHED", label: "Publish strategy" },
          { value: "ARCHIVED", label: "Archive strategy" },
        ]
      : status === "PUBLISHED"
        ? [{ value: "ARCHIVED", label: "Archive strategy" }]
        : [{ value: "DRAFT", label: "Restore to private draft" }];
  return (
    <AdminChangeForm
      key={status}
      action={moderateStrategy.bind(null, id)}
      label="Moderate content"
      field="status"
      options={options}
      hidden={{ expectedStatus: status, ...(reportId ? { reportId } : {}) }}
      help="Archiving removes public visibility. Restoration returns to a private draft; it does not republish content."
    />
  );
}
