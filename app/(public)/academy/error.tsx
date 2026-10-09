"use client";

export default function AcademyError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-6 py-12">
      <h1 className="text-3xl font-bold text-neutral-900">Academy is temporarily unavailable</h1>
      <p className="text-neutral-600">We couldn’t load the courses. Please try again.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-emerald-700 px-5 py-3 text-white hover:bg-emerald-800"
      >
        Try again
      </button>
    </div>
  );
}
