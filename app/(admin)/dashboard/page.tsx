export default function AdminDashboard() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-neutral-600 mt-2">Admin area — features arrive in later phases</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Users</h2>
          <p className="text-neutral-600 text-sm mt-2">
            User management will appear here (Phase 17)
          </p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Strategies</h2>
          <p className="text-neutral-600 text-sm mt-2">
            Strategy moderation will appear here (Phase 17)
          </p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Reports</h2>
          <p className="text-neutral-600 text-sm mt-2">
            User reports will appear here (Phase 17)
          </p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Audit Logs</h2>
          <p className="text-neutral-600 text-sm mt-2">
            Activity logs will appear here (Phase 18)
          </p>
        </div>
      </div>
    </div>
  );
}
