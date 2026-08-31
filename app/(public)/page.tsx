import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { StrategyCard } from "@/components/marketing/StrategyCard";
import { CTA } from "@/components/marketing/CTA";
import { sampleStrategies } from "@/lib/data/strategies";

export const metadata: Metadata = {
  title: "Investment Strategy Education Platform",
  description:
    "Explore transparent strategy blueprints, methodology, risk frameworks and decision history before investing your own money.",
};

const PILLARS = [
  {
    title: "Methodology",
    description:
      "Every strategy begins with a clear thesis and an explicit set of principles. You see the reasoning, not just the outcome.",
  },
  {
    title: "Transparency",
    description:
      "Allocations, risk frameworks and decision history are published and inspectable — no black boxes, no hype-driven shortcuts.",
  },
  {
    title: "Education",
    description:
      "MIRROR teaches you to think about portfolio construction. It does not execute trades, connect to brokerages, or manage your money.",
  },
];

const VALUES_ROW = [
  {
    title: "Discipline over emotion",
    description:
      "Decisions follow stated principles and review cadences rather than reacting to price moves.",
  },
  {
    title: "Patience over timing",
    description: "Long time horizons and fixed rebalancing replace market-timing attempts.",
  },
  {
    title: "Diversification over concentration",
    description: "Risk is spread across assets and regions rather than concentrated in bets.",
  },
  {
    title: "Truth over guarantees",
    description:
      "Nothing is promised. Illustrative figures are clearly labeled and never sold as certain returns.",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="border-t border-neutral-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Why MIRROR"
            title="Investing outcomes are shaped by decisions, not predictions."
            description="Most investment content shows results — rarely the reasoning. MIRROR inverts that: we put the thinking first so you can learn, compare, and form your own judgment."
          />
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-white p-8">
                <h3 className="text-lg font-semibold text-neutral-900">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Explore"
            title="Transparent strategy blueprints"
            description="Sample models that demonstrate MIRROR's framework. Each blueprint shows the thesis, methodology, risk framework, allocation and decision history — fully inspectable and clearly educational."
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sampleStrategies.map((strategy) => (
              <StrategyCard key={strategy.slug} strategy={strategy} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/strategies"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              View all strategies →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Thinking"
            title="A deliberate set of investment principles"
            description="These principles shape every strategy on MIRROR. They are general commitments, not guarantees of any outcome."
          />
          <dl className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
            {VALUES_ROW.map((v) => (
              <div key={v.title} className="border-t border-neutral-200 pt-5">
                <dt className="font-semibold text-neutral-900">{v.title}</dt>
                <dd className="mt-2 text-sm text-neutral-600">{v.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="mx-auto max-w-4xl lg:col-span-1">
              <SectionHeading
                eyebrow="Transparency"
                title="Decision history, made visible"
                align="left"
                description="Blueprints include a decision history so you can see what changed, why, and on what basis. This is how the thinking behind a strategy stays accountable to its stated principles."
              />
              <Link
                href="/strategies"
                className="mt-8 inline-block rounded-lg border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50"
              >
                Explore decision histories
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-6 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Sample decision history — The Compounder
              </p>
              <ol className="mt-5 space-y-5 border-l border-neutral-200 pl-6">
                {[
                  { label: "Illustrative entry", text: "Established a core growth allocation" },
                  { label: "Illustrative rebalance", text: "Trimmed to target weights" },
                  { label: "Illustrative review", text: "Maintained allocation" },
                ].map((d) => (
                  <li key={d.label} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-emerald-600 bg-white" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                      {d.label}
                    </p>
                    <p className="mt-1 text-sm text-neutral-800">{d.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Guardrails"
            title="What MIRROR is — and is not"
            description="We are explicit about the limits of what we provide, so you can trust what you see."
          />
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <h3 className="font-semibold text-emerald-900">Education and transparency</h3>
              <ul className="mt-3 space-y-2 text-sm text-emerald-900/80">
                <li>Strategy blueprints and model portfolios</li>
                <li>Hypothetical, clearly labeled simulations</li>
                <li>Historical and informational content</li>
              </ul>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <h3 className="font-semibold text-neutral-900">We do not</h3>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li>Execute trades or connect to brokerages</li>
                <li>Hold or manage your money</li>
                <li>Provide personalized automated advice</li>
                <li>Guarantee returns or create urgency</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
