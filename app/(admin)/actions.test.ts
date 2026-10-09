import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/errors";
const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  repo: {
    changeRole: vi.fn(),
    moderateStrategy: vi.fn(),
    resolveReport: vi.fn(),
    verifyCreator: vi.fn(),
  },
}));
vi.mock("@/lib/auth/session", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/db/repositories/admin-repository", () => ({ adminRepository: mocks.repo }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
import { changeUserRole, moderateStrategy, resolveReport, verifyCreator } from "./actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  data.set("adminId", "forged-actor");
  return data;
}
const reason = "Review completed";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireRole.mockResolvedValue({ id: "session-admin" });
});
describe("Privileged server action boundaries", () => {
  it("uses only the server session identity for all privileged changes", async () => {
    await changeUserRole("target", {}, form({ role: "CREATOR", expectedRole: "LEARNER", reason }));
    await moderateStrategy(
      "strategy",
      {},
      form({ status: "ARCHIVED", expectedStatus: "PUBLISHED", reason, reportId: "report" })
    );
    await resolveReport("report", {}, form({ status: "RESOLVED", expectedStatus: "OPEN", reason }));
    await verifyCreator(
      "creator",
      {},
      form({ verified: "true", expectedVerified: "false", reason })
    );
    expect(mocks.repo.changeRole).toHaveBeenCalledWith("session-admin", "target", {
      role: "CREATOR",
      expectedRole: "LEARNER",
      reason,
    });
    expect(mocks.repo.moderateStrategy).toHaveBeenCalledWith("session-admin", "strategy", {
      status: "ARCHIVED",
      expectedStatus: "PUBLISHED",
      reason,
      reportId: "report",
    });
    expect(mocks.repo.resolveReport).toHaveBeenCalledWith("session-admin", "report", {
      status: "RESOLVED",
      expectedStatus: "OPEN",
      reason,
    });
    expect(mocks.repo.verifyCreator).toHaveBeenCalledWith("session-admin", "creator", {
      verified: true,
      expectedVerified: false,
      reason,
    });
    expect(mocks.requireRole).toHaveBeenCalledTimes(4);
    expect(mocks.requireRole).toHaveBeenCalledWith("ADMIN");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/strategies/[slug]", "page");
  });
  it("keeps auth failures outside catch and never calls a repository", async () => {
    mocks.requireRole.mockRejectedValue(new ForbiddenError());
    for (const action of [changeUserRole, moderateStrategy, resolveReport, verifyCreator]) {
      await expect(action("target", {}, new FormData())).rejects.toThrow(ForbiddenError);
    }
    for (const method of Object.values(mocks.repo)) expect(method).not.toHaveBeenCalled();
  });
  it("rejects missing reasons, state tokens and invalid boolean/enum choices", async () => {
    expect(
      (await changeUserRole("target", {}, form({ role: "ADMIN", reason }))).error
    ).toBeTruthy();
    expect(
      (
        await moderateStrategy(
          "target",
          {},
          form({ status: "DELETE", expectedStatus: "PUBLISHED", reason })
        )
      ).error
    ).toBeTruthy();
    expect(
      (
        await resolveReport(
          "target",
          {},
          form({ status: "RESOLVED", expectedStatus: "OPEN", reason: " " })
        )
      ).error
    ).toBeTruthy();
    expect(
      (
        await verifyCreator(
          "target",
          {},
          form({ verified: "yes", expectedVerified: "false", reason })
        )
      ).error
    ).toBeTruthy();
    for (const method of Object.values(mocks.repo)) expect(method).not.toHaveBeenCalled();
  });
  it("sanitizes internal failures without claiming success or refreshing stale UI", async () => {
    mocks.repo.resolveReport.mockRejectedValue(new Error("postgresql://credentials"));
    expect(
      await resolveReport(
        "target",
        {},
        form({ status: "RESOLVED", expectedStatus: "OPEN", reason })
      )
    ).toEqual({ error: "Something went wrong" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
