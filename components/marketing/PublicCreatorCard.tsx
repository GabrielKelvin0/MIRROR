import Link from "next/link";
import type { PublicCreatorDirectoryEntry } from "@/lib/db/repositories/public-creator-repository";
import { creatorDisplayName, formatDisplayDate } from "@/lib/services/strategy-presentation";

/**
 * Public directory card for a listable creator.
 *
 * Server-rendered only. Eligibility (CREATOR role + profile + at least one
 * PUBLISHED strategy) is enforced at the data boundary by
 * PublicCreatorRepository.listDirectory. Card content is truthful DB data;
 * nothing here is fabricated or ranked by performance.
 */
export function PublicCreatorCard({ creator }: { creator: PublicCreatorDirectoryEntry }) {
  const profile = creator.creatorProfile;
  const published = creator._count.strategies;
  const blurb = profile?.investmentPhilosophy || profile?.bio || null;

  return (
    <Link
      href={"/creators/" + creator.id}
      className="flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-emerald-600"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Creator
        </span>
        {profile?.isVerified ? (
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Verified creator
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-semibold text-neutral-900">
        {creatorDisplayName(creator.firstName, creator.lastName)}
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        {published} published {published === 1 ? "strategy" : "strategies"} · Joined{" "}
        {formatDisplayDate(creator.createdAt)}
      </p>

      {blurb ? <p className="mt-3 text-sm text-neutral-600">{blurb}</p> : null}

      <span className="mt-4 text-sm font-medium text-emerald-700">View profile →</span>
    </Link>
  );
}
