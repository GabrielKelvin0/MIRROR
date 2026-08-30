export const metadata = {
  title: "MIRROR — See How Investors Think",
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-neutral-900">MIRROR</h1>
          <p className="text-neutral-600 mt-2">
            Foundation — authentication active
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <section className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">Foundation</h2>
            <p className="text-neutral-600 mt-2">
              Configuration and authentication complete.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-neutral-200 rounded-lg p-6 bg-white">
              <h3 className="font-semibold text-neutral-900">Setup</h3>
              <ul className="mt-4 space-y-2 text-neutral-600 text-sm">
                <li>✓ Next.js + TypeScript</li>
                <li>✓ Tailwind CSS</li>
                <li>✓ Clerk Authentication</li>
                <li>✓ ESLint & Prettier</li>
              </ul>
            </div>

            <div className="border border-neutral-200 rounded-lg p-6 bg-white">
              <h3 className="font-semibold text-neutral-900">Next Steps</h3>
              <ul className="mt-4 space-y-2 text-neutral-600 text-sm">
                <li>→ Marketing website (Phase 5)</li>
                <li>→ Strategy system (Phase 7+)</li>
                <li>→ Learner features (Phase 10+)</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Status:</strong> Foundation configured. Clerk
              authentication is active, protected areas use server-side role
              authorization, and the marketing website is the next approved
              phase.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
