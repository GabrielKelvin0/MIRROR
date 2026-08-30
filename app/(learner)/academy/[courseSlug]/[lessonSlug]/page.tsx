import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { academyRepository } from "@/lib/db";
import {
  getSampleLesson,
  type ContentBlock,
} from "@/lib/data/curriculum";
import { lessonNavigation } from "@/lib/services/academy-rules";
import { LessonCompleteButton } from "./lesson-complete-button";

interface PageProps {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseSlug, lessonSlug } = await params;
  const found = getSampleLesson(courseSlug, lessonSlug);
  if (!found) return { title: "Lesson not found" };
  return { title: found.lesson.title, description: "Academy lesson" };
}

function renderBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case "heading":
      return (
        <h2 key={index} className="mt-6 text-xl font-semibold text-neutral-900">
          {block.text}
        </h2>
      );
    case "paragraph":
      return (
        <p key={index} className="mt-4 text-neutral-700">
          {block.text}
        </p>
      );
    case "list":
      return (
        <div key={index} className="mt-4">
          {block.title ? (
            <p className="font-medium text-neutral-800">{block.title}</p>
          ) : null}
          <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      );
    case "callout":
      return (
        <div
          key={index}
          className="mt-6 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-4"
        >
          <p className="text-sm font-semibold text-emerald-800">{block.label}</p>
          <p className="mt-1 text-sm text-emerald-900">{block.text}</p>
        </div>
      );
  }
}

export default async function AcademyLessonPage({ params }: PageProps) {
  const { courseSlug, lessonSlug } = await params;
  const found = getSampleLesson(courseSlug, lessonSlug);
  if (!found) notFound();
  const { course, lesson } = found;

  const user = await requireRole("LEARNER");
  const isComplete = await academyRepository.isLessonComplete(
    user.id,
    `${course.slug}/${lesson.slug}`
  );

  const currentIndex = course.lessons.findIndex((l) => l.slug === lesson.slug);
  const nav = lessonNavigation(course.lessons.length, currentIndex);
  const prevLesson = nav.previousIndex != null ? course.lessons[nav.previousIndex] : null;
  const nextLesson = nav.nextIndex != null ? course.lessons[nav.nextIndex] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <Link
        href={`/learner/academy/${course.slug}`}
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        &larr; {course.title}
      </Link>

      <header className="border-b border-neutral-200 pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Lesson {lesson.order} of {course.lessons.length}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-neutral-900">{lesson.title}</h1>
        <p className="mt-1 text-sm text-neutral-500">~{lesson.estimatedMinutes} min</p>
      </header>

      <article className="text-base leading-relaxed">
        {lesson.contentBlocks.map(renderBlock)}
      </article>

      <LessonCompleteButton
        courseSlug={course.slug}
        lessonSlug={lesson.slug}
        initiallyComplete={isComplete}
      />

      <nav className="flex items-center justify-between border-t border-neutral-200 pt-6 text-sm">
        {prevLesson ? (
          <Link
            href={`/learner/academy/${course.slug}/${prevLesson.slug}`}
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            &larr; {prevLesson.title}
          </Link>
        ) : (
          <span />
        )}
        {nextLesson ? (
          <Link
            href={`/learner/academy/${course.slug}/${nextLesson.slug}`}
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            {nextLesson.title} &rarr;
          </Link>
        ) : (
          <Link
            href={`/learner/academy/${course.slug}`}
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Back to course &rarr;
          </Link>
        )}
      </nav>
    </div>
  );
}