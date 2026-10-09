import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  repository: {
    create: vi.fn(),
    delete: vi.fn(),
    addStrategyAllocation: vi.fn(),
    removeStrategyAllocation: vi.fn(),
    recordDecision: vi.fn(),
    rebalance: vi.fn(),
  },
}));
vi.mock("@/lib/auth/session", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/db", () => ({ portfolioRepository: mocks.repository }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
import {
  addStrategy,
  createPortfolio,
  deletePortfolio,
  rebalancePortfolio,
  recordDecision,
  removeStrategy,
} from "./actions";

const state = { error: undefined };
function rebalanceForm() {
  const form = new FormData();
  for (const [id, after] of [
    ["growth", "30"],
    ["bonds", "50"],
  ]) {
    form.append("strategyId", id!);
    form.append("expectedPercentage", "40");
    form.append("allocationPercentage", after!);
  }
  form.set("reasoning", "Reduce concentration");
  form.set("userId", "someone-else");
  return form;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireRole.mockResolvedValue({ id: "session-learner" });
});

describe("Paper portfolio action security", () => {
  it("uses the session identity and validates a complete rebalance before persistence", async () => {
    expect(await rebalancePortfolio("mine", state, rebalanceForm())).toEqual(state);
    expect(mocks.requireRole).toHaveBeenCalledWith("LEARNER");
    expect(mocks.repository.rebalance).toHaveBeenCalledWith("mine", "session-learner", {
      reasoning: "Reduce concentration",
      changes: [
        { strategyId: "growth", expectedPercentage: 40, allocationPercentage: 30 },
        { strategyId: "bonds", expectedPercentage: 40, allocationPercentage: 50 },
      ],
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/learner/portfolio/mine");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/learner/portfolio");
  });

  it("requires LEARNER on every portfolio mutation", async () => {
    mocks.requireRole.mockRejectedValue(new ForbiddenError());
    const actions = [
      () => createPortfolio(state, new FormData()),
      () => deletePortfolio("mine", state, new FormData()),
      () => addStrategy("mine", state, new FormData()),
      () => removeStrategy("mine", "growth", state, new FormData()),
      () => recordDecision("mine", state, new FormData()),
      () => rebalancePortfolio("mine", state, rebalanceForm()),
    ];
    for (const action of actions) await expect(action()).rejects.toThrow(ForbiddenError);
    for (const fn of Object.values(mocks.repository)) expect(fn).not.toHaveBeenCalled();
  });

  it("rejects mismatched fields, missing percentages, duplicates, and whitespace explanations", async () => {
    const malformed = rebalanceForm();
    malformed.delete("expectedPercentage");
    const empty = rebalanceForm();
    empty.delete("allocationPercentage");
    empty.append("allocationPercentage", "");
    empty.append("allocationPercentage", "50");
    const duplicates = rebalanceForm();
    duplicates.delete("strategyId");
    duplicates.append("strategyId", "growth");
    duplicates.append("strategyId", "growth");
    const noReason = rebalanceForm();
    noReason.set("reasoning", " ");
    for (const form of [malformed, empty, duplicates, noReason]) {
      expect((await rebalancePortfolio("mine", state, form)).error).toBeTruthy();
    }
    expect(mocks.repository.rebalance).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("does not accept an omitted allocation as an implicit zero", async () => {
    const form = new FormData();
    form.set("strategyId", "growth");
    expect((await addStrategy("mine", state, form)).error).toMatch(/between 0 and 100/);
    expect(mocks.repository.addStrategyAllocation).not.toHaveBeenCalled();
  });

  it("sanitizes unexpected failures and preserves intentional not-found messages", async () => {
    mocks.repository.rebalance.mockRejectedValue(new Error("postgresql://secret"));
    expect((await rebalancePortfolio("mine", state, rebalanceForm())).error).toBe(
      "Something went wrong"
    );
    mocks.repository.rebalance.mockRejectedValue(new NotFoundError("Portfolio not found"));
    expect((await rebalancePortfolio("mine", state, rebalanceForm())).error).toBe(
      "Portfolio not found"
    );
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("forwards optional add/remove explanations and only records a note for manual decisions", async () => {
    const form = new FormData();
    form.set("strategyId", "growth");
    form.set("allocationPercentage", "40");
    form.set("reasoning", "Diversification");
    await addStrategy("mine", state, form);
    expect(mocks.repository.addStrategyAllocation).toHaveBeenCalledWith("mine", "session-learner", {
      strategyId: "growth",
      allocationPercentage: 40,
      reasoning: "Diversification",
    });
    await removeStrategy("mine", "growth", state, form);
    expect(mocks.repository.removeStrategyAllocation).toHaveBeenCalledWith(
      "mine",
      "session-learner",
      "growth",
      "Diversification"
    );
    form.set("summary", "Review risks");
    form.set("description", "Still considering");
    await recordDecision("mine", state, form);
    expect(mocks.repository.recordDecision).toHaveBeenCalledWith("mine", "session-learner", {
      summary: "Review risks",
      description: "Still considering",
    });
    expect(mocks.repository.rebalance).not.toHaveBeenCalled();
  });
});
