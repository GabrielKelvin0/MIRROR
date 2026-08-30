"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { portfolioRepository } from "@/lib/db";
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
 */

export type ActionResult = { error: string | undefined };

async function getLearnerId(): Promise<string> {
  const user = await requireRole("LEARNER");
  return user.id;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong";
}

/** Create a new paper portfolio with simulated starting capital. */
export function createPortfolio(): (
  prev: ActionResult,
  formData: FormData
) => Promise<ActionResult> {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
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
  };
}

/** Delete a paper portfolio (ownership-checked). */
export function deletePortfolio(
  portfolioId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, _formData: FormData): Promise<ActionResult> => {
    const userId = await getLearnerId();
    try {
      await portfolioRepository.delete(portfolioId, userId);
      revalidatePath("/learner/portfolio");
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

/** Add or update a strategy allocation (ownership + 100% total checked). */
export function addStrategy(
  portfolioId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    const userId = await getLearnerId();
    try {
      const input = validateAllocationInput({
        strategyId: formData.get("strategyId")?.toString(),
        allocationPercentage: Number(formData.get("allocationPercentage")),
      });
      await portfolioRepository.addStrategyAllocation(portfolioId, userId, input);
      revalidatePath(`/learner/portfolio/${portfolioId}`);
      revalidatePath("/learner/portfolio");
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

/** Remove a strategy allocation (ownership-checked). */
export function removeStrategy(
  portfolioId: string,
  strategyId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, _formData: FormData): Promise<ActionResult> => {
    const userId = await getLearnerId();
    try {
      await portfolioRepository.removeStrategyAllocation(portfolioId, userId, strategyId);
      revalidatePath(`/learner/portfolio/${portfolioId}`);
      revalidatePath("/learner/portfolio");
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

/** Record a manual portfolio decision (ownership-checked). */
export function recordDecision(
  portfolioId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
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
  };
}
