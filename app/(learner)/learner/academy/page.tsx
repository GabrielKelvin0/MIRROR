import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { academyRepository } from "@/lib/db/repositories/academy-repository";
import { AcademyCatalog } from "@/components/academy/AcademyCatalog";

export const metadata: Metadata = {
  title: "Academy",
  description: "Structured learning paths for investing basics through advanced analysis.",
};

export default async function AcademyCatalogPage() {
  const user = await requireRole("LEARNER");
  const [courses, completedKeys] = await Promise.all([
    academyRepository.listCourses(),
    academyRepository.listCompletedLessonKeys(user.id),
  ]);
  return (
    <div className="space-y-12 p-8">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900">Academy</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Structured learning paths — from investing basics to advanced analysis. Work through
          lessons and track your completion progress. Educational content only; never personalized
          advice or a guarantee of any outcome.
        </p>
      </header>
      <AcademyCatalog courses={courses} completedKeys={completedKeys} />
    </div>
  );
}
