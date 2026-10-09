"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { strategyRepository } from "@/lib/db";
import { followRepository } from "@/lib/db/repositories/follow-repository";
import { ensureCreatorProfile } from "@/lib/db/repositories/strategy-repository";
import { safeErrorMessage } from "@/lib/errors";
import type { StrategyStatus } from "@prisma/client";

/**
 * Creator strategy actions.
 *
 * Every action requires the CREATOR role (server-side, via requireRole) which
 * resolves the local database user. Ownership of a strategy is then verified
 * by the repository against that resolved user id — never against
 * client-supplied identity.
 *
 * Next.js 15 requires every exported server action to be an async function.
 * Actions that need route-provided ids receive them as bound arguments from
 * the client component (`.bind(null, id)`), never from client-supplied
 * identity.
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
export async function updateStrategy(
  strategyId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
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
    revalidatePath(`/creator/dashboard/strategies/${strategyId}/edit`);
    revalidatePath(`/creator/dashboard/strategies/${strategyId}/preview`);
    revalidatePath("/creator/dashboard");
    revalidatePath("/strategies");
    revalidatePath("/creators");
    revalidatePath("/strategies/[slug]", "page");
    revalidatePath("/creators/[id]", "page");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Add an allocation line to a strategy. */
export async function addAllocation(
  strategyId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
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
}

/** Set a strategy's status (publish or archive). */
export async function changeStatus(
  strategyId: string,
  to: StrategyStatus,
  _prev: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  const creatorId = await getCreatorId();
  try {
    await strategyRepository.setStatus(strategyId, creatorId, to);
    revalidatePath(`/creator/dashboard/strategies/${strategyId}`);
    revalidatePath("/creator/dashboard");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Publish a strategy update with a rationale. */
export async function addUpdate(
  strategyId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
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
    const update = await strategyRepository.addUpdate(strategyId, creatorId, payload);
    // Fan out notifications to followers only when the update is "meaningful"
    // (published strategy with non-empty title/description). The anti-spam
    // gate lives in the repository, so drafts/archived/blank updates never spam.
    await followRepository.notifyFollowersOfUpdate(update.strategyId, {
      id: update.id,
      title: update.title,
      description: update.description,
    });
    revalidatePath(`/creator/dashboard/strategies/${strategyId}/edit`);
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Publish a structured decision with optional atomic allocation changes. */
export async function addDecision(
  strategyId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const creatorId = await getCreatorId();
  try {
    const effectiveDateInput = formData.get("effectiveDate") as string;
    const removals = new Set<string>();
    const afterValues = new Map<string, string>();

    for (const [key, rawValue] of formData.entries()) {
      if (key.startsWith("allocationRemove:") && rawValue === "on") {
        removals.add(key.slice("allocationRemove:".length));
      }
      if (key.startsWith("allocationAfter:")) {
        afterValues.set(key.slice("allocationAfter:".length), String(rawValue));
      }
    }

    const allocationIds = new Set([...afterValues.keys(), ...removals]);
    const allocationChanges: Array<{
      allocationId: string;
      afterPercentage: number | null;
    }> = [];

    for (const allocationId of allocationIds) {
      if (removals.has(allocationId)) {
        allocationChanges.push({ allocationId, afterPercentage: null });
        continue;
      }

      const rawValue = afterValues.get(allocationId)?.trim() ?? "";
      if (rawValue.length === 0) {
        continue;
      }

      allocationChanges.push({
        allocationId,
        afterPercentage: Number(rawValue),
      });
    }

    const decision = await strategyRepository.addStructuredDecision(strategyId, creatorId, {
      title: formData.get("title") as string,
      changesSummary: formData.get("changesSummary") as string,
      reasoning: formData.get("reasoning") as string,
      evidence: formData.get("evidence") as string,
      riskAssessment: formData.get("riskAssessment") as string,
      assumptionChanges: formData.get("assumptionChanges") as string,
      effectiveDate: effectiveDateInput ? new Date(effectiveDateInput) : undefined,
      allocationChanges,
    });

    await followRepository.notifyFollowersOfUpdate(decision.strategyId, {
      id: decision.id,
      title: decision.title,
      description: decision.description,
      kind: decision.kind,
    });

    revalidatePath(`/creator/dashboard/strategies/${strategyId}/edit`);
    revalidatePath(`/strategies/${strategyId}`);
    revalidatePath("/strategies");
    revalidatePath("/learner/notifications");
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

/** Delete an allocation line. */
export async function deleteAllocation(
  strategyId: string,
  allocationId: string,
  _prev: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  const creatorId = await getCreatorId();
  try {
    await strategyRepository.deleteAllocation(strategyId, creatorId, allocationId);
    revalidatePath(`/creator/dashboard/strategies/${strategyId}/edit`);
    return { error: undefined };
  } catch (err) {
    return { error: messageOf(err) };
  }
}

function messageOf(err: unknown): string {
  return safeErrorMessage(err);
}
