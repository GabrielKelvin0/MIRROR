import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicCreatorRepository } from "@/lib/db";
import { PublishedStrategyCard } from "@/components/marketing/PublishedStrategyCard";
import { creatorDisplayName, formatDisplayDate } from "@/lib/services/strategy-presentation";
import { verificationStateLabel, VERIFICATION_CONTEXT } from "@/lib/services/creator-public-rules";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const creator = await publicCreatorRepository.getPublicCreator(id);
  if (!creator) {
    return { title: "Creator not found" };
  }
  const name = creatorDisplayName(creator.firstName, creator.lastName);
  const profileText = creator.creatorProfile?.investmentPhilosophy ?? creator.creatorProfile?.bio;
  return {
    title: name + " · MIRROR Creator",
    description: profileText
      ? profileText.slice(0, 160)
      : name + " publishes transparent educational strategies on MIRROR.",
  };
}

export default async function PublicCreatorProfilePage({ params }: Props) {
  const { id } = await params;
  const creator = await publicCreatorRepository.getPublicCreator(id);
  if (!creator) {
    notFound();
  }

  const profile = creator.creatorProfile;
  const strategies = await publicCreatorRepository.listPublishedByCreator(creator.id);
  const name = creatorDisplayName(creator.firstName, creator.lastName);
  const hasAbout = Boolean(profile?.bio || profile?.investmentPhilosophy);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="mb-6">
        <Link
          href="/creators"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← All creators
        </Link>
      </p>

      <header className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            Public creator
          </span>
          {profile ? (
            <span
              className={
                profile.isVerified
                  ? "rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                  : "rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600"
              }
            >
              {verificationStateLabel(profile.isVerified)}
            </span>
          ) : null}
        </div>

        <h1 className="mt-4 text-3xl font-semibold text-neutral-900 sm:text-4xl">{name}</h1>

        <div className="mt-4 flex flex-wrap gap-6 text-sm text-neutral-600">
          <span>
            <span className="font-medium text-neutral-900">Joined MIRROR:</span>{" "}
            {formatDisplayDate(creator.createdAt)}
          </span>
          {typeof profile?.yearsOfExperience === "number" ? (
            <span>
              <span className="font-medium text-neutral-900">Experience:</span>{" "}
              {profile.yearsOfExperience} years
            </span>
          ) : null}
        </div>

        {profile ? (
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-neutral-500">
            {VERIFICATION_CONTEXT}
          </p>
        ) : null}
      </header>

      {hasAbout ? (
        <div className="mt-8 space-y-8">
          {profile?.bio ? (
            <section>
              <h2 className="text-xl font-semibold text-neutral-900">About</h2>
              <p className="mt-3 whitespace-pre-wrap text-neutral-700">{profile.bio}</p>
            </section>
          ) : null}
          {profile?.investmentPhilosophy ? (
            <section>
              <h2 className="text-xl font-semibold text-neutral-900">Investment approach</h2>
              <p className="mt-3 whitespace-pre-wrap text-neutral-700">
                {profile.investmentPhilosophy}
              </p>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-600">
            This creator has not added a public bio or investment approach yet.
          </p>
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">Published strategies</h2>
        <p className="mt-1 text-sm text-neutral-500">
          PUBLISHED strategies only — drafts and archived strategies are never shown publicly.
        </p>
        {strategies.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <p className="text-sm text-neutral-600">
              This creator has no published strategies right now.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {strategies.map((strategy) => (
              <li key={strategy.id}>
                <PublishedStrategyCard strategy={strategy} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-12 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-xs leading-relaxed text-neutral-500">
        <p>
          MIRROR is an educational platform that shows how experienced investors think before you
          invest your own money. This profile contains creator-provided information plus
          MIRROR&apos;s identity-verification state. It is not investment advice, not a guarantee of
          any outcome, and MIRROR does not execute trades or manage funds.
        </p>
      </div>
    </div>
  );
}
