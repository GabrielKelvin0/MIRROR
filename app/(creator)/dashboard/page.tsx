export default function CreatorDashboard() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Creator Dashboard</h1>
        <p className="text-neutral-600 mt-2">Creator area — features arrive in later phases</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Your Strategies</h2>
          <p className="text-neutral-600 text-sm mt-2">
            Your published strategies will appear here (Phase 7)
          </p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Followers</h2>
          <p className="text-neutral-600 text-sm mt-2">
            Your follower count will appear here (Phase 10)
          </p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Analytics</h2>
          <p className="text-neutral-600 text-sm mt-2">
            Strategy performance analytics will appear here (Phase 20)
          </p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Create Strategy</h2>
          <p className="text-neutral-600 text-sm mt-2">
            Strategy creation flow (Phase 7)
          </p>
        </div>
      </div>
    </div>
  );
}
