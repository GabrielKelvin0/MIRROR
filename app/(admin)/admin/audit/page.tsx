import { requireRole } from "@/lib/auth/session";
import { adminRepository } from "@/lib/db/repositories/admin-repository";
import { AuditEntries } from "@/components/admin/AuditEntries";

export default async function AuditLogPage() {
  await requireRole("ADMIN");
  const entries = await adminRepository.listAuditLogs();
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <h1 className="text-3xl font-semibold">Audit history</h1>
      <p className="text-neutral-600">
        The most recent 100 records of report submissions and administrative changes. Earlier
        records remain stored.
      </p>
      {entries.length ? (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="min-w-0 space-y-3 break-words rounded-xl border bg-white p-5"
            >
              <p className="text-sm font-medium">
                {[entry.user.firstName, entry.user.lastName].filter(Boolean).join(" ") ||
                  entry.user.email}
              </p>
              <p className="text-xs text-neutral-600">
                {entry.resourceType ?? "Unspecified resource"} ·{" "}
                {entry.targetId ?? entry.resourceId ?? "Identifier not recorded"}
              </p>
              <AuditEntries entries={[entry]} />
            </li>
          ))}
        </ul>
      ) : (
        <p>No audit records yet.</p>
      )}
    </div>
  );
}
