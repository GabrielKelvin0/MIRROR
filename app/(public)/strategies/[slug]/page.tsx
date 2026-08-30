import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StrategyBlueprint } from "@/components/marketing/StrategyBlueprint";
import { getStrategyBySlug, sampleStrategies } from "@/lib/data/strategies";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return sampleStrategies.map((strategy) => ({ slug: strategy.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const strategy = getStrategyBySlug(slug);
  if (!strategy) return { title: "Strategy not found" };
  return {
    title: strategy.name,
    description: strategy.tagline,
  };
}

export default async function StrategyDetailPage({ params }: Props) {
  const { slug } = await params;
  const strategy = getStrategyBySlug(slug);

  if (!strategy) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="mb-8">
        <Link
          href="/strategies"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          ← All strategies
        </Link>
      </p>
      <StrategyBlueprint strategy={strategy} />
    </div>
  );
}
