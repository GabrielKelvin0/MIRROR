import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  setLessonCompletion: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/db", () => ({
  academyRepository: { setLessonCompletion: mocks.setLessonCompletion },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { setLessonCompletion } from "./actions";

function completionForm(action = "complete") {
  const form = new FormData();
  form.set("action", action);
  form.set("userId", "other-learner");
  return form;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireRole.mockResolvedValue({ id: "session-learner" });
});

describe("Academy completion authorization", () => {
  it("requires LEARNER and uses the session identity despite submitted user IDs", async () => {
    expect(
      await setLessonCompletion(
        "investing-basics",
        "what-is-investing",
        { error: undefined },
        completionForm()
      )
    ).toEqual({ error: undefined });
    expect(mocks.requireRole).toHaveBeenCalledWith("LEARNER");
    expect(mocks.setLessonCompletion).toHaveBeenCalledWith(
      "session-learner",
      "investing-basics/what-is-investing",
      true
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/learner/academy");
  });

  it("never writes when the role guard denies access", async () => {
    mocks.requireRole.mockRejectedValue(new ForbiddenError());
    await expect(
      setLessonCompletion("course", "lesson", { error: undefined }, completionForm())
    ).rejects.toThrow(ForbiddenError);
    expect(mocks.setLessonCompletion).not.toHaveBeenCalled();
  });

  it("rejects malformed bound slugs and unsupported actions before writing", async () => {
    expect(
      (await setLessonCompletion("course/other", "lesson", { error: undefined }, completionForm()))
        .error
    ).toBe("Invalid course or lesson identifier");
    expect(
      (
        await setLessonCompletion(
          "course",
          "lesson",
          { error: undefined },
          completionForm("unknown")
        )
      ).error
    ).toBe("Unsupported completion action");
    expect(mocks.setLessonCompletion).not.toHaveBeenCalled();
  });

  it("reports unknown lessons without revalidating successful completion", async () => {
    mocks.setLessonCompletion.mockRejectedValue(new NotFoundError("Lesson not found"));
    expect(
      (await setLessonCompletion("course", "missing", { error: undefined }, completionForm())).error
    ).toBe("Lesson not found");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("supports undoing completion and sanitizes unexpected database errors", async () => {
    await setLessonCompletion(
      "course",
      "lesson",
      { error: undefined },
      completionForm("incomplete")
    );
    expect(mocks.setLessonCompletion).toHaveBeenCalledWith(
      "session-learner",
      "course/lesson",
      false
    );
    mocks.setLessonCompletion.mockRejectedValue(new Error("postgresql://secret details"));
    expect(
      (await setLessonCompletion("course", "lesson", { error: undefined }, completionForm())).error
    ).toBe("Something went wrong");
  });
});
