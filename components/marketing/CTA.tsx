import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-neutral-200 bg-neutral-900 px-6 py-14 text-center sm:px-12">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          Start learning with MIRROR.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-300">
          Explore transparent strategy blueprints, understand the thinking behind investment
          decisions, and build a foundation before investing your own money.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/strategies"
            className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-center font-medium text-white transition hover:bg-emerald-700 sm:w-auto"
          >
            Browse Strategies
          </Link>
          <SignedIn>
            <Link
              href="/learner/dashboard"
              className="w-full rounded-lg border border-neutral-600 px-6 py-3 text-center font-medium text-white transition hover:bg-neutral-800 sm:w-auto"
            >
              Open your dashboard
            </Link>
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-up"
              className="w-full rounded-lg border border-neutral-600 px-6 py-3 text-center font-medium text-white transition hover:bg-neutral-800 sm:w-auto"
            >
              Create free account
            </Link>
          </SignedOut>
        </div>
      </div>
    </section>
  );
}
