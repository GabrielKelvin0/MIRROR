import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-neutral-50 px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/strategies"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Explore strategies
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
