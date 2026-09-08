import type { Metadata } from "next";
import { publicCreatorRepository } from "@/lib/db";
import { PublicCreatorCard } from "@/components/marketing/PublicCreatorCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creators",
  description:
    "Meet the people behind MIRROR's published strategies — transparent public profiles focused on methodology, risk, disclosure, and published strategy history.",
};

export default async function CreatorsDirectoryPage() {
  const creators = await publicCreatorRepository.listDirectory();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">Creators</h1>
      <p className="mt-3 max-w-2xl text-neutral-600">
        Discover the thinking behind published MIRROR strategies. Creator profiles focus on
        methodology, risk, disclosure, and public strategy history — never performance rankings or
        popularity.
      </p>

      {creators.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
          <p className="font-medium text-neutral-800">No public creators yet</p>
          <p className="mt-2 text-sm text-neutral-600">
            When a creator publishes a strategy, their public profile will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <li key={creator.id}>
              <PublicCreatorCard creator={creator} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs leading-relaxed text-neutral-500">
        MIRROR is an educational platform. Creator profiles show information the creator provided
        and MIRROR&apos;s verification state — they are not endorsements of expertise, performance,
        or regulatory approval, and MIRROR does not execute trades or manage funds.
      </p>
    </div>
  );
}
