"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { strategyRepository } from "@/lib/db";
import { ensureCreatorProfile } from "@/lib/db/repositories/strategy-repository";
import type { StrategyStatus } from "@prisma/client";

/**
 * Creator strategy actions.
 *
 * Every action requires the CREATOR role (server-side, via requireRole) which
 * resolves the local database user. Ownership of a strategy is then verified
 * by the repository against that resolved user id — never against
 * client-supplied identity.
 *
 * These are server-only mutations; there are no client component imports here.
 */

export type ActionResult = { error: string | undefined };

async function getCreatorId(): Promise<string> {
  const user = await requireRole("CREATOR");
  await ensureCreatorProfile(user.id);
  return user.id;
}

/** Create a new draft strategy from form input. Redirects to its edit page. */
export async function createStrategy(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const creatorId = await getCreatorId();
  try {
    const strategy = await strategyRepository.createDraft(creatorId, {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      philosophy: formData.get("philosophy") as string,
      objective: formData.get("objective") as string,
      riskProfile: formData.get("riskProfile") as string,
      timeHorizon: formData.get("timeHorizon") as string,
    });
    redirect(`/creator/dashboard/strategies/${strategy.id}/edit`);
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Save strategy fields. Redirects back to the dashboard on success. */
export function updateStrategy(
  strategyId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    const creatorId = await getCreatorId();
    try {
      await strategyRepository.update(strategyId, creatorId, {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        philosophy: formData.get("philosophy") as string,
        objective: formData.get("objective") as string,
        riskProfile: formData.get("riskProfile") as string,
        timeHorizon: formData.get("timeHorizon") as string,
        thesis: formData.get("thesis") as string,
        decisionRules: formData.get("decisionRules") as string,
        rebalancePolicy: formData.get("rebalancePolicy") as string,
        exitConditions: formData.get("exitConditions") as string,
        invalidatingConditions: formData.get("invalidatingConditions") as string,
      });
      revalidatePath(`/creator/dashboard/strategies/${strategyId}`);
      revalidatePath("/creator/dashboard");
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

/** Add an allocation line to a strategy. */
export function addAllocation(
  strategyId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    const creatorId = await getCreatorId();
    try {
      await strategyRepository.addAllocation(strategyId, creatorId, {
        assetClass: formData.get("assetClass") as string,
        targetWeight: Number(formData.get("targetWeight")),
        reasoning: formData.get("reasoning") as string,
      });
      revalidatePath(`/creator/dashboard/strategies/${strategyId}/edit`);
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

/** Set a strategy's status (publish or archive). */
export function changeStatus(
  strategyId: string,
  to: StrategyStatus
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, _formData: FormData): Promise<ActionResult> => {
    const creatorId = await getCreatorId();
    try {
      await strategyRepository.setStatus(strategyId, creatorId, to);
      revalidatePath(`/creator/dashboard/strategies/${strategyId}`);
      revalidatePath("/creator/dashboard");
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

/** Publish a strategy update with a rationale. */
export function addUpdate(
  strategyId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    const creatorId = await getCreatorId();
    try {
      const effectiveDateInput = formData.get("effectiveDate") as string;
      const payload: {
        title: string;
        description: string;
        changesSummary: string;
        reasoning: string;
        riskAssessment: string;
        effectiveDate?: Date;
      } = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        changesSummary: formData.get("changesSummary") as string,
        reasoning: formData.get("reasoning") as string,
        riskAssessment: formData.get("riskAssessment") as string,
      };
      if (effectiveDateInput) {
        payload.effectiveDate = new Date(effectiveDateInput);
      }
      await strategyRepository.addUpdate(strategyId, creatorId, payload);
      revalidatePath(`/creator/dashboard/strategies/${strategyId}/edit`);
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

/** Delete an allocation line. */
export function deleteAllocation(
  strategyId: string,
  allocationId: string
): (prev: ActionResult, formData: FormData) => Promise<ActionResult> {
  return async (_prev: ActionResult, _formData: FormData): Promise<ActionResult> => {
    const creatorId = await getCreatorId();
    try {
      await strategyRepository.deleteAllocation(strategyId, creatorId, allocationId);
      revalidatePath(`/creator/dashboard/strategies/${strategyId}/edit`);
      return { error: undefined };
    } catch (err) {
      return { error: messageOf(err) };
    }
  };
}

function messageOf(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong";
}
