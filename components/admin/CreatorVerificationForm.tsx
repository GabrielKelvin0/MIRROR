"use client";
import { verifyCreator } from "@/app/(admin)/actions";
import { AdminChangeForm } from "@/components/admin/AdminChangeForm";

export function CreatorVerificationForm({
  userId,
  verified,
}: {
  userId: string;
  verified: boolean;
}) {
  return (
    <AdminChangeForm
      key={String(verified)}
      action={verifyCreator.bind(null, userId)}
      label="Review identity verification"
      field="verified"
      options={[
        {
          value: String(!verified),
          label: verified ? "Remove verification" : "Verify creator identity",
        },
      ]}
      hidden={{ expectedVerified: String(verified) }}
      help="Record the identity evidence you reviewed. Verification does not endorse investment expertise or performance."
    />
  );
}
