import { requireRole } from "@/lib/auth/session";
import { adminRepository } from "@/lib/db/repositories/admin-repository";
import { CreatorVerificationForm } from "@/components/admin/CreatorVerificationForm";
import { VERIFICATION_CONTEXT } from "@/lib/services/creator-public-rules";

export default async function Creators() {
  await requireRole("ADMIN");
  const creators = await adminRepository.listCreators();
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <h1 className="text-3xl font-semibold">Creator review</h1>
      <p className="text-neutral-600">
        Review creator profiles and record identity verification decisions.
      </p>
      <p className="max-w-3xl text-sm text-neutral-600">{VERIFICATION_CONTEXT}</p>
      {creators.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {creators.map((creator) => (
            <li key={creator.id} className="min-w-0 space-y-4 rounded-xl border bg-white p-5">
              <div>
                <h2 className="break-words font-semibold">
                  {[creator.firstName, creator.lastName].filter(Boolean).join(" ") ||
                    "Unnamed creator"}
                </h2>
                <p className="break-words text-sm text-neutral-600">{creator.email}</p>
              </div>
              <p className="text-sm">
                {creator._count.strategies} strategies ·{" "}
                {creator.creatorProfile?.isVerified ? "Verified" : "Not verified"}
              </p>
              {creator.creatorProfile ? (
                <>
                  <div>
                    <h3 className="text-sm font-semibold">Bio</h3>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-700">
                      {creator.creatorProfile.bio ?? "Not provided"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Investment approach</h3>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-700">
                      {creator.creatorProfile.investmentPhilosophy ?? "Not provided"}
                    </p>
                  </div>
                  <CreatorVerificationForm
                    userId={creator.id}
                    verified={creator.creatorProfile.isVerified}
                  />
                </>
              ) : (
                <p className="text-sm text-neutral-600">
                  A creator profile is required before verification can be reviewed.
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No creator accounts yet.</p>
      )}
    </div>
  );
}
