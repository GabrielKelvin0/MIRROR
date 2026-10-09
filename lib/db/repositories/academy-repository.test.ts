import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  lesson: { findUnique: vi.fn() },
  progress: { upsert: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: mocks }));
import { AcademyRepository } from "./academy-repository";

const repository = new AcademyRepository();
beforeEach(() => vi.resetAllMocks());

describe("Academy persistence boundaries", () => {
  it("rejects a nonexistent lesson without creating a progress record", async () => {
    mocks.lesson.findUnique.mockResolvedValue(null);
    await expect(repository.setLessonCompletion("learner", "unknown/lesson", true)).rejects.toThrow(
      NotFoundError
    );
    expect(mocks.progress.upsert).not.toHaveBeenCalled();
  });

  it("scopes both completion lookup and write to the resolved learner", async () => {
    mocks.lesson.findUnique.mockResolvedValue({ id: "course/lesson" });
    mocks.progress.findUnique.mockResolvedValue({ completed: false });
    expect(await repository.isLessonComplete("learner-a", "course/lesson")).toBe(false);
    await repository.setLessonCompletion("learner-a", "course/lesson", false);
    expect(mocks.progress.findUnique).toHaveBeenCalledWith({
      where: { userId_lessonId: { userId: "learner-a", lessonId: "course/lesson" } },
      select: { completed: true },
    });
    expect(mocks.progress.upsert).toHaveBeenCalledWith({
      where: { userId_lessonId: { userId: "learner-a", lessonId: "course/lesson" } },
      update: { completed: false, completedAt: null },
      create: {
        userId: "learner-a",
        lessonId: "course/lesson",
        completed: false,
        completedAt: null,
      },
    });
  });

  it("returns not found for malformed lesson URLs without querying the database", async () => {
    expect(await repository.getLesson("course", "../other")).toBeNull();
    expect(mocks.lesson.findUnique).not.toHaveBeenCalled();
  });
});
