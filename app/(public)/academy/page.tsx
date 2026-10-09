import type { Metadata } from "next";
import Link from "next/link";
import { AcademyCatalog } from "@/components/academy/AcademyCatalog";
import { academyRepository } from "@/lib/db/repositories/academy-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Academy",
  description: "Explore free learning paths from investing basics to advanced analysis.",
};

export default async function PublicAcademyPage() {
  const courses = await academyRepository.listCourses();
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium text-emerald-700">Free investing education</p>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Academy</h1>
        <p className="text-lg leading-relaxed text-neutral-600">
          Build your understanding from investing basics to advanced analysis. Explore the learning
          paths below, then sign in to read lessons and track your progress.
        </p>
        <p className="text-sm text-neutral-600">
          Educational content only; never personalized advice or a guarantee of any outcome.
        </p>
        <Link
          href="/learner/academy"
          className="inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Start learning
        </Link>
      </header>
      <AcademyCatalog courses={courses} />
    </div>
  );
}
