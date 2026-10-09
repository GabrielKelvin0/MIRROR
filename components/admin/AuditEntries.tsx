import { auditDetails } from "@/lib/services/moderation-rules";

export function AuditEntries({
  entries,
}: {
  entries: Array<{ id: string; action: string; changes: string | null; createdAt: Date }>;
}) {
  return (
    <ul className="space-y-3">
      {entries.map((entry) => {
        const detail = auditDetails(entry.changes);
        return (
          <li key={entry.id} className="break-words rounded-lg bg-neutral-50 p-3 text-sm">
            <p className="font-medium">{entry.action.replace(/_/g, " ")}</p>
            {detail.from || detail.to ? (
              <p className="mt-1 text-neutral-700">
                {detail.from ?? "—"} → {detail.to ?? "—"}
              </p>
            ) : null}
            <p className="mt-1 whitespace-pre-wrap text-neutral-700">
              {detail.reason ?? "Reason not recorded"}
            </p>
            <time
              dateTime={entry.createdAt.toISOString()}
              className="mt-2 block text-xs text-neutral-600"
            >
              {entry.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
            </time>
          </li>
        );
      })}
    </ul>
  );
}
