"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { reportRepository } from "@/lib/db/repositories/report-repository";
import { safeErrorMessage } from "@/lib/errors";
import {
  assertReporterRole,
  validateReport,
  type ModerationFormState,
} from "@/lib/services/moderation-rules";

export async function submitReport(
  _previous: ModerationFormState,
  form: FormData
): Promise<ModerationFormState> {
  // Keep authentication/authorization redirects outside the error sanitization boundary.
  const user = await getCurrentUser();
  assertReporterRole(user.role);
  try {
    const input = validateReport({
      resourceType: form.get("resourceType"),
      resourceId: form.get("resourceId"),
      reason: form.get("reason"),
      description: form.get("description"),
    });
    await reportRepository.submit(user.id, input);
    revalidatePath("/learner/reports");
    revalidatePath("/creator/reports");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/audit");
    return { success: "Report submitted. You can follow its status in My reports." };
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }
}
