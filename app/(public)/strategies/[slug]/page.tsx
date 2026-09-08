import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StrategyBlueprint } from "@/components/marketing/StrategyBlueprint";
import { PublishedStrategyDetail } from "@/components/marketing/PublishedStrategyDetail";
import { FollowButton } from "@/components/learner/FollowButton";
import { getOptionalAuth } from "@/lib/auth/session";
import { getStrategyBySlug } from "@/lib/data/strategies";
import { followRepository, strategyRepository, userRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sample = getStrategyBySlug(slug);
  if (sample) {
    return { title: sample.name, description: sample.tagline };
  }
  const published = await strategyRepository.getPublished(slug);
  if (published) {
    return {
      title: published.name,
      description:
        published.philosophy ??
        published.description ??
        "A published MIRROR strategy by a creator.",
    };
  }
  return { title: "Strategy not found" };
}

export default async function StrategyDetailPage({ params }: Props) {
  const { slug } = await params;

  const sample = getStrategyBySlug(slug);
  if (sample) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="mb-8">
          <Link
            href="/strategies"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← All strategies
          </Link>
        </p>
        <StrategyBlueprint strategy={sample} />
      </div>
    );
  }

  const published = await strategyRepository.getPublished(slug);
  if (!published) {
    notFound();
  }

  const session = await getOptionalAuth();
  let canFollow = false;
  let isFollowing = false;
  if (session?.userId) {
    const viewer = await userRepository.findByClerkId(session.userId);
    if (viewer && viewer.role === "LEARNER") {
      canFollow = true;
      isFollowing = await followRepository.isFollowing(viewer.id, published.id);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="mb-8">
        <Link
          href="/strategies"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← All strategies
        </Link>
      </p>

      <PublishedStrategyDetail strategy={published} />

      <div className="mt-8 flex items-center gap-4">
        {canFollow ? (
          <FollowButton
            strategyId={published.id}
            strategyName={published.name}
            isFollowing={isFollowing}
          />
        ) : null}
        {!session?.userId ? (
          <Link
            href={"/sign-in?redirect_url=" + encodeURIComponent("/strategies/" + published.id)}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
          >
            Sign in to follow
          </Link>
        ) : null}
      </div>
    </div>
  );
}
