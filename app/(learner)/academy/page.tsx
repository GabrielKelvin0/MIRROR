import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { academyRepository } from "@/lib/db";
import { COURSES_BY_LEVEL_ORDER } from "./course-levels";
import { courseProgress } from "@/lib/services/academy-rules";

export const metadata: Metadata = {
  title: "Academy",
  description: "Structured learning paths for investing basics through advanced analysis.",
};

const LEVEL_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
} as const;

export default async function AcademyCatalogPage() {
  const user = await requireRole("LEARNER");
  const completedKeys = new Set(await academyRepository.listCompletedLessonKeys(user.id));

  return (
    <div className="space-y-12 p-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Academy</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Structured learning paths — from investing basics to advanced analysis.
          Work through lessons and track your completion progress. Educational content
          only; never personalized advice or a guarantee of any outcome.
        </p>
      </div>

      {COURSES_BY_LEVEL_ORDER.map(({ level, courses }) => {
        if (courses.length === 0) {
          return (
            <section
              key={level}
              className="rounded-xl border border-dashed border-neutral-300 p-10 text-center"
            >
              <h2 className="text-xl font-semibold text-neutral-800">{LEVEL_LABELS[level]}</h2>
              <p className="mt-2 text-sm text-neutral-600">
                No {LEVEL_LABELS[level].toLowerCase()} courses available yet.
              </p>
            </section>
          );
        }

        return (
          <section key={level}>
            <h2 className="text-xl font-semibold text-neutral-900">{LEVEL_LABELS[level]}</h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const lessonKeys = course.lessons.map((l) => `${course.slug}/${l.slug}`);
                const courseCompleted = lessonKeys.filter((k) => completedKeys.has(k)).length;
                const progress = courseProgress([...completedKeys], lessonKeys);

                return (
                  <li key={course.slug}>
                    <Link
                      href={`/learner/academy/${course.slug}`}
                      className="block h-full rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
                    >
                      <p className="font-semibold text-neutral-900">{course.title}</p>
                      <p className="mt-1 text-sm text-neutral-600">{course.description}</p>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <span>
                            {courseCompleted}/{progress.total} lessons
                          </span>
                          <span>{progress.percent}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}