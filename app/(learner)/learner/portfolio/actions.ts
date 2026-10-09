"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { portfolioRepository } from "@/lib/db";
import { safeErrorMessage, ValidationError } from "@/lib/errors";
import { validateRebalanceInput } from "@/lib/services/portfolio-maturity";
import {
  validatePortfolioInput,
  validateAllocationInput,
  validateDecision,
} from "@/lib/services/portfolio-rules";

/**
 * Learner paper-portfolio actions.
 *
 * Every action requires the LEARNER role (server-side, via requireRole) and is
 * scoped to the resolved local database user id — never client-supplied
 * identity. All figures are hypothetical and clearly-labelled; there is no real
 * money or execution anywhere in this flow.
 *
 * Next.js 15 requires every exported server action to be an async function;
 * row ids arrive as bound arguments from the client component.
 */

export type ActionResult = { error: string | undefined };

async function getLearnerId(): Promise<string> {
  const user = await requireRole("LEARNER");
  return user.id;
}

function messageOf(err: unknown): string {
  return safeErrorMessage(err);
}

function numericField(value: FormDataEntryValue | null | undefined): number {
  return typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
}

/** Create a new paper portfolio with simulated starting capital. */
export async function createPortfolio(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getLearnerId();
  try {
    const input = validatePortfolioInput({
      name: formData.get("name")?.toString(),
      description: formData.get("description")?.toString(),
      startingCapital: Number(formData.get("startingCapital")),
    });
    await portfolioRepository.create(userId, input);
    revalidatePath("/learner/portfolio");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Delete a paper portfolio (ownership-checked). */
export async function deletePortfolio(
  portfolioId: string,
  _prev: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  const userId = await getLearnerId();
  try {
    await portfolioRepository.delete(portfolioId, userId);
    revalidatePath("/learner/portfolio");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Add or update a strategy allocation (ownership + 100% total checked). */
export async function addStrategy(
  portfolioId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getLearnerId();
  try {
    const input = validateAllocationInput({
      strategyId: formData.get("strategyId")?.toString(),
      allocationPercentage: numericField(formData.get("allocationPercentage")),
      reasoning: formData.get("reasoning")?.toString(),
    });
    await portfolioRepository.addStrategyAllocation(portfolioId, userId, input);
    revalidatePath(`/learner/portfolio/${portfolioId}`);
    revalidatePath("/learner/portfolio");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Remove a strategy allocation (ownership-checked). */
export async function removeStrategy(
  portfolioId: string,
  strategyId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getLearnerId();
  try {
    await portfolioRepository.removeStrategyAllocation(
      portfolioId,
      userId,
      strategyId,
      formData.get("reasoning")?.toString()
    );
    revalidatePath(`/learner/portfolio/${portfolioId}`);
    revalidatePath("/learner/portfolio");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Atomically change the existing simulated mix with a learner-authored explanation. */
export async function rebalancePortfolio(
  portfolioId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getLearnerId();
  try {
    const ids = formData.getAll("strategyId");
    const weights = formData.getAll("allocationPercentage");
    const expected = formData.getAll("expectedPercentage");
    if (ids.length < 1 || ids.length > 100) {
      throw new ValidationError("A rebalance must contain between 1 and 100 strategy allocations");
    }
    if (ids.length !== weights.length || ids.length !== expected.length) {
      throw new ValidationError("Invalid rebalance allocation fields");
    }
    const input = validateRebalanceInput({
      changes: ids.map((strategyId, index) => ({
        strategyId: typeof strategyId === "string" ? strategyId : "",
        allocationPercentage: numericField(weights[index]),
        expectedPercentage: numericField(expected[index]),
      })),
      reasoning: formData.get("reasoning")?.toString(),
    });
    await portfolioRepository.rebalance(portfolioId, userId, input);
    revalidatePath(`/learner/portfolio/${portfolioId}`);
    revalidatePath("/learner/portfolio");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Record a manual portfolio decision (ownership-checked). */
export async function recordDecision(
  portfolioId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getLearnerId();
  try {
    const input = validateDecision({
      summary: formData.get("summary")?.toString(),
      description: formData.get("description")?.toString(),
    });
    await portfolioRepository.recordDecision(portfolioId, userId, input);
    revalidatePath(`/learner/portfolio/${portfolioId}`);
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}
