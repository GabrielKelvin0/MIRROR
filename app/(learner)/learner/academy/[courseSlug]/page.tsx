import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { academyRepository } from "@/lib/db";
import { getCourseSample } from "@/lib/data/curriculum";
import { courseProgress } from "@/lib/services/academy-rules";

interface PageProps {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = getCourseSample(courseSlug);
  if (!course) return { title: "Course not found" };
  return { title: course.title, description: course.description };
}

export default async function AcademyCoursePage({ params }: PageProps) {
  const { courseSlug } = await params;
  const course = getCourseSample(courseSlug);
  if (!course) notFound();

  const user = await requireRole("LEARNER");
  const completedKeys = new Set(await academyRepository.listCompletedLessonKeys(user.id));
  const completedCount = course.lessons.filter((l) =>
    completedKeys.has(`${course.slug}/${l.slug}`)
  ).length;
  const totalMinutes = course.lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0);
  const lessonKeys = course.lessons.map((l) => `${course.slug}/${l.slug}`);
  const progress = courseProgress([...completedKeys], lessonKeys);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <Link
        href="/learner/academy"
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        &larr; All courses
      </Link>

      <header className="space-y-2 border-b border-neutral-200 pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {course.level.toLowerCase()}
        </p>
        <h1 className="text-3xl font-bold text-neutral-900">{course.title}</h1>
        <p className="text-neutral-600">{course.description}</p>
        <p className="text-sm text-neutral-500">
          {course.lessons.length} lessons &middot; ~{totalMinutes} min total
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Progress</span>
            <span>
              {completedCount}/{course.lessons.length} &middot; {progress.percent}%
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </header>

      <ol className="space-y-3">
        {course.lessons.map((lesson, index) => {
          const done = completedKeys.has(`${course.slug}/${lesson.slug}`);
          return (
            <li key={lesson.slug}>
              <Link
                href={`/learner/academy/${course.slug}/${lesson.slug}`}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    done ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {done ? "\u2713" : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900">{lesson.title}</p>
                  <p className="text-xs text-neutral-500">~{lesson.estimatedMinutes} min</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}