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
            Foundation Phase — Coming Soon
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <section className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">Phase 1</h2>
            <p className="text-neutral-600 mt-2">
              Foundation configuration complete.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-neutral-200 rounded-lg p-6 bg-white">
              <h3 className="font-semibold text-neutral-900">Setup</h3>
              <ul className="mt-4 space-y-2 text-neutral-600 text-sm">
                <li>✓ Next.js + TypeScript</li>
                <li>✓ Tailwind CSS</li>
                <li>✓ Clerk Authentication (ready)</li>
                <li>✓ ESLint & Prettier</li>
              </ul>
            </div>

            <div className="border border-neutral-200 rounded-lg p-6 bg-white">
              <h3 className="font-semibold text-neutral-900">Next Steps</h3>
              <ul className="mt-4 space-y-2 text-neutral-600 text-sm">
                <li>→ Database schema (Phase 3)</li>
                <li>→ Authentication flows (Phase 4)</li>
                <li>→ Marketing website (Phase 5)</li>
                <li>→ Strategy system (Phase 7+)</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Status:</strong> Phase 1 Foundation complete. Project is
              configured and ready for Phase 2 architecture work.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
