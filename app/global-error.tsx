"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-md text-center">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm text-neutral-600">
              We could not load this page. Please try again.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.assign("/")}
                className="rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                Back to home
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
