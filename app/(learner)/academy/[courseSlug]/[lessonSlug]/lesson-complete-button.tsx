"use client";

import { useActionState } from "react";
import { setLessonCompletion, type ActionResult } from "@/app/(learner)/academy/actions";

interface LessonCompleteButtonProps {
  courseSlug: string;
  lessonSlug: string;
  initiallyComplete: boolean;
}

export function LessonCompleteButton({
  courseSlug,
  lessonSlug,
  initiallyComplete,
}: LessonCompleteButtonProps) {
  const toggle = setLessonCompletion(courseSlug, lessonSlug);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    toggle,
    { error: undefined }
  );

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="action" value={initiallyComplete ? "incomplete" : "complete"} />
      <button
        type="submit"
        disabled={pending}
        className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition ${
          initiallyComplete
            ? "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {initiallyComplete ? "Mark as incomplete" : "Mark lesson complete"}
      </button>
      {state.error ? (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}