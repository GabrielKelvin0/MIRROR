import { describe, it, expect } from "vitest";
import {
  validateProgressInput,
  nextCompletionState,
  courseProgress,
  lessonNavigation,
} from "./academy-rules";
import { ValidationError } from "@/lib/errors";

/**
 * Deterministic unit tests for the Academy pure rules
 * (lib/services/academy-rules.ts): input validation, completion state
 * transitions, course progress math, and lesson navigation.
 */

describe("validateProgressInput", () => {
  it("accepts a lesson id and trims it", () => {
    const out = validateProgressInput({ lessonId: "  lesson-1  " });
    expect(out.lessonId).toBe("lesson-1");
    expect(out.courseId).toBeNull();
  });

  it("keeps an optional course id", () => {
    const out = validateProgressInput({ lessonId: "l1", courseId: "c1" });
    expect(out.courseId).toBe("c1");
  });

  it("rejects a blank lesson id", () => {
    expect(() => validateProgressInput({})).toThrow(ValidationError);
    expect(() => validateProgressInput({ lessonId: "   " })).toThrow(ValidationError);
  });
});

describe("nextCompletionState", () => {
  it("maps complete and incomplete to the correct boolean", () => {
    expect(nextCompletionState("complete")).toBe(true);
    expect(nextCompletionState("incomplete")).toBe(false);
  });

  it("rejects an unknown action", () => {
    expect(() => nextCompletionState("maybe" as never)).toThrow(ValidationError);
  });
});

describe("courseProgress", () => {
  const all = ["l1", "l2", "l3", "l4"];

  it("computes 0% for no completions", () => {
    expect(courseProgress([], all)).toEqual({ completed: 0, total: 4, percent: 0 });
  });

  it("computes partial progress deterministically", () => {
    expect(courseProgress(["l1", "l2"], all)).toEqual({ completed: 2, total: 4, percent: 50 });
  });

  it("computes 100% for complete courses", () => {
    expect(courseProgress(all, all)).toEqual({ completed: 4, total: 4, percent: 100 });
  });

  it("ignores ids that do not belong to the course", () => {
    expect(courseProgress(["l1", "other-lesson"], all)).toEqual({
      completed: 1,
      total: 4,
      percent: 25,
    });
  });

  it("handles an empty course (no lessons) as 0%", () => {
    expect(courseProgress([], [])).toEqual({ completed: 0, total: 0, percent: 0 });
  });
});

describe("lessonNavigation", () => {
  it("has no previous on the first lesson", () => {
    expect(lessonNavigation(3, 0)).toEqual({ previousIndex: null, nextIndex: 1 });
  });

  it("has both neighbours in the middle", () => {
    expect(lessonNavigation(3, 1)).toEqual({ previousIndex: 0, nextIndex: 2 });
  });

  it("has no next on the last lesson", () => {
    expect(lessonNavigation(3, 2)).toEqual({ previousIndex: 1, nextIndex: null });
  });

  it("rejects out-of-range indices deterministically", () => {
    expect(lessonNavigation(3, 9)).toEqual({ previousIndex: null, nextIndex: null });
    expect(lessonNavigation(0, 0)).toEqual({ previousIndex: null, nextIndex: null });
  });
});