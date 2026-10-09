import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  submit: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db/repositories/report-repository", () => ({
  reportRepository: { submit: mocks.submit },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
import { submitReport } from "./actions";
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    resourceType: "STRATEGY",
    resourceId: "published",
    reason: "Missing risk information",
    description: "Evidence",
    reporterId: "someone-else",
  }))
    data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: "session-reporter", role: "LEARNER" });
});
describe("Authenticated report actions", () => {
  it.each(["LEARNER", "CREATOR"])(
    "uses the session %s identity and refreshes only after success",
    async (role) => {
      mocks.getCurrentUser.mockResolvedValue({ id: "session-reporter", role });
      expect((await submitReport({}, form())).success).toBeTruthy();
      expect(mocks.submit).toHaveBeenCalledWith("session-reporter", {
        resourceType: "STRATEGY",
        resourceId: "published",
        reason: "Missing risk information",
        description: "Evidence",
      });
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/reports");
    }
  );
  it("rejects administrators and keeps unauthenticated redirects outside catch", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "admin", role: "ADMIN" });
    await expect(submitReport({}, form())).rejects.toThrow(ForbiddenError);
    mocks.getCurrentUser.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(submitReport({}, form())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it("rejects unsupported targets and sanitizes unexpected failures", async () => {
    const invalid = form();
    invalid.set("resourceType", "COMMENT");
    expect((await submitReport({}, invalid)).error).toBeTruthy();
    expect(mocks.submit).not.toHaveBeenCalled();
    mocks.submit.mockRejectedValue(new Error("database secret"));
    expect((await submitReport({}, form())).error).toBe("Something went wrong");
    mocks.submit.mockRejectedValue(new NotFoundError("Content is not available to report"));
    expect((await submitReport({}, form())).error).toBe("Content is not available to report");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
