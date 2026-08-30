export default function LearnerDashboard() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Your Dashboard</h1>
        <p className="text-neutral-600 mt-2">Learner area — features arrive in later phases</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Followed Strategies</h2>
          <p className="text-neutral-600 text-sm mt-2">
            Strategies you follow will appear here (Phase 10)
          </p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Paper Portfolio</h2>
          <p className="text-neutral-600 text-sm mt-2">
            Your simulated portfolio will appear here (Phase 12)
          </p>
        </div>

        <a
          href="/learner/academy"
          className="block border border-neutral-200 rounded-lg p-6 bg-white hover:border-emerald-300 transition"
        >
          <h2 className="font-semibold text-neutral-900">Learning Progress</h2>
          <p className="text-neutral-600 text-sm mt-2">
            Work through Academy lessons and track your progress
          </p>
        </a>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-neutral-900">Notifications</h2>
          <p className="text-neutral-600 text-sm mt-2">
            Strategy updates will appear here (Phase 11)
          </p>
        </div>
      </div>
    </div>
  );
}
