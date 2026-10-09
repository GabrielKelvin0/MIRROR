"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { adminRepository } from "@/lib/db/repositories/admin-repository";
import { safeErrorMessage } from "@/lib/errors";
import {
  booleanChoice,
  reportStatus,
  reviewReason,
  strategyStatus,
  userRole,
  type ModerationFormState,
} from "@/lib/services/moderation-rules";

function refreshAdmin() {
  for (const path of [
    "/admin/users",
    "/admin/creators",
    "/admin/strategies",
    "/admin/reports",
    "/admin/dashboard",
    "/admin/audit",
  ])
    revalidatePath(path);
}

function refreshPublic() {
  for (const path of [
    "/strategies",
    "/creators",
    "/learner/following",
    "/learner/portfolio",
    "/creator/dashboard",
  ])
    revalidatePath(path);
  revalidatePath("/strategies/[slug]", "page");
  revalidatePath("/creators/[id]", "page");
  revalidatePath("/learner/portfolio/[id]", "page");
  revalidatePath("/creator/dashboard/strategies/[id]/edit", "page");
  revalidatePath("/creator/dashboard/strategies/[id]/preview", "page");
}

export async function changeUserRole(
  id: string,
  _previous: ModerationFormState,
  form: FormData
): Promise<ModerationFormState> {
  const actor = await requireRole("ADMIN");
  try {
    await adminRepository.changeRole(actor.id, id, {
      role: userRole(form.get("role")),
      expectedRole: userRole(form.get("expectedRole")),
      reason: reviewReason(form.get("reason")),
    });
    refreshAdmin();
    refreshPublic();
    return { success: "Role updated and review recorded." };
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }
}

export async function moderateStrategy(
  id: string,
  _previous: ModerationFormState,
  form: FormData
): Promise<ModerationFormState> {
  const actor = await requireRole("ADMIN");
  try {
    const reportId = form.get("reportId");
    await adminRepository.moderateStrategy(actor.id, id, {
      status: strategyStatus(form.get("status")),
      expectedStatus: strategyStatus(form.get("expectedStatus")),
      reason: reviewReason(form.get("reason")),
      ...(typeof reportId === "string" && reportId ? { reportId } : {}),
    });
    refreshAdmin();
    refreshPublic();
    return { success: "Strategy status updated and review recorded." };
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }
}

export async function resolveReport(
  id: string,
  _previous: ModerationFormState,
  form: FormData
): Promise<ModerationFormState> {
  const actor = await requireRole("ADMIN");
  try {
    await adminRepository.resolveReport(actor.id, id, {
      status: reportStatus(form.get("status")),
      expectedStatus: reportStatus(form.get("expectedStatus")),
      reason: reviewReason(form.get("reason")),
    });
    refreshAdmin();
    revalidatePath("/learner/reports");
    revalidatePath("/creator/reports");
    return { success: "Report review recorded." };
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }
}

export async function verifyCreator(
  id: string,
  _previous: ModerationFormState,
  form: FormData
): Promise<ModerationFormState> {
  const actor = await requireRole("ADMIN");
  try {
    await adminRepository.verifyCreator(actor.id, id, {
      verified: booleanChoice(form.get("verified")),
      expectedVerified: booleanChoice(form.get("expectedVerified")),
      reason: reviewReason(form.get("reason")),
    });
    refreshAdmin();
    refreshPublic();
    return { success: "Verification decision recorded." };
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }
}
