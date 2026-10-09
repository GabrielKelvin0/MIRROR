import Link from "next/link";
import type { AcademyCourse } from "@/lib/db/repositories/academy-repository";
import { courseProgress } from "@/lib/services/academy-rules";

const LEVELS = [
  { level: "BEGINNER", label: "Beginner" },
  { level: "INTERMEDIATE", label: "Intermediate" },
  { level: "ADVANCED", label: "Advanced" },
] as const;

interface AcademyCatalogProps {
  courses: AcademyCourse[];
  completedKeys?: string[];
}

export function AcademyCatalog({ courses, completedKeys }: AcademyCatalogProps) {
  return (
    <div className="space-y-10">
      {LEVELS.map(({ level, label }) => {
        const levelCourses = courses.filter((course) => course.level === level);
        return (
          <section key={level} aria-labelledby={`academy-${level}`}>
            <h2 id={`academy-${level}`} className="text-xl font-semibold text-neutral-900">
              {label}
            </h2>
            {levelCourses.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-neutral-300 p-6 text-neutral-600">
                No {label.toLowerCase()} courses available yet.
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {levelCourses.map((course) => {
                  const progress = courseProgress(
                    completedKeys ?? [],
                    course.lessons.map((lesson) => lesson.id)
                  );
                  return (
                    <li key={course.id}>
                      <Link
                        href={`/learner/academy/${course.slug}`}
                        className="block h-full rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
                      >
                        <h3 className="font-semibold text-neutral-900">{course.title}</h3>
                        <p className="mt-1 text-sm text-neutral-600">{course.description}</p>
                        <p className="mt-4 text-sm text-neutral-600">
                          {course.lessons.length} lessons
                        </p>
                        {completedKeys !== undefined ? (
                          <div className="mt-3">
                            <p className="text-xs text-neutral-600">
                              {progress.completed}/{progress.total} completed · {progress.percent}%
                            </p>
                            <progress
                              value={progress.percent}
                              max={100}
                              aria-label={`${course.title} completion`}
                              className="mt-1 h-2 w-full accent-emerald-700"
                            >
                              {progress.percent}%
                            </progress>
                          </div>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
