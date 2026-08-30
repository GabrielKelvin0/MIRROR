import type { Metadata } from "next";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { StrategyCard } from "@/components/marketing/StrategyCard";
import { sampleStrategies, strategyCategories } from "@/lib/data/strategies";

export const metadata: Metadata = {
  title: "Strategies",
  description:
    "Browse transparent, educational strategy blueprints — thesis, methodology, risk framework, allocation and decision history.",
};

export default function StrategiesPage() {
  return (
    <>
      <section className="border-b border-neutral-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            align="left"
            eyebrow="Discovery"
            title="Strategies built on transparent thinking"
            description="Sample, educational models that demonstrate how a fully inspectable strategy blueprint is presented. Each is clearly a sample, not a live product or a guarantee."
          />

          <div className="mt-8 flex flex-wrap gap-2" role="list" aria-label="Strategy categories">
            {strategyCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600"
              >
                {category}
              </span>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            These are <strong>sample and educational models</strong> to demonstrate the Strategy
            Blueprint presentation. No real investor, performance, or guarantee is implied.
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sampleStrategies.map((strategy) => (
              <StrategyCard key={strategy.slug} strategy={strategy} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-neutral-500">
            Additional samples will be added as MIRROR&apos;s strategy library grows.
          </p>
        </div>
      </section>
    </>
  );
}
