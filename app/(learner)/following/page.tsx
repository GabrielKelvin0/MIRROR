import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { followRepository, strategyRepository } from "@/lib/db";
import { FollowButton } from "@/components/learner/FollowButton";

export const metadata: Metadata = {
  title: "Following",
  description: "Strategies you follow, and published strategies you could follow.",
};

export default async function FollowingPage() {
  const user = await requireRole("LEARNER");
  const followed = await followRepository.listFollowed(user.id);
  const followedMap = new Map(followed.map((f) => [f.strategyId, f]));
  const published = await strategyRepository.listPublished();
  const discoverable = published.filter((s) => !followedMap.has(s.id));

  return (
    <div className="space-y-10 p-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Following</h1>
        <p className="mt-2 text-neutral-600">
          Strategies you follow. When a followed strategy publishes a meaningful update, you get a
          notification — we never spam you with drafts or placeholder updates.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-neutral-900">Your followed strategies</h2>
        {followed.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-12 text-center">
            <h3 className="text-lg font-semibold text-neutral-800">
              You are not following anything yet
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Browse the discoverable published strategies below to start following.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
            {followed.map((follow) => (
              <li key={follow.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-neutral-900">{follow.strategy.name}</p>
                  <p className="text-sm text-neutral-500">
                    {follow.strategy.riskProfile ?? "Risk not set"} ·{" "}
                    {follow.strategy.timeHorizon ?? "Horizon not set"}
                  </p>
                </div>
                <FollowButton
                  strategyId={follow.strategy.id}
                  strategyName={follow.strategy.name}
                  isFollowing
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-neutral-900">Discover strategies to follow</h2>
        {discoverable.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">
            You are following every published strategy. New ones will appear here as creators
            publish them.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {discoverable.map((strategy) => (
              <li key={strategy.id} className="rounded-xl border border-neutral-200 bg-white p-5">
                <p className="font-medium text-neutral-900">{strategy.name}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {strategy.riskProfile ?? "Risk not set"} ·{" "}
                  {strategy.timeHorizon ?? "Horizon not set"}
                </p>
                <div className="mt-3">
                  <FollowButton
                    strategyId={strategy.id}
                    strategyName={strategy.name}
                    isFollowing={false}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
