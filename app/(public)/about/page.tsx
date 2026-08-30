import type { Metadata } from "next";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { CTA } from "@/components/marketing/CTA";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about MIRROR's mission — investment education and strategy transparency, built on honesty and explicit financial-safety boundaries.",
};

const COMMITMENTS = [
  {
    title: "Put the reason before the result",
    description:
      "We believe the thinking behind an investment decision is as instructive as the outcome, and we make that reasoning explicit.",
  },
  {
    title: "Be honest about uncertainty",
    description:
      "We never present illustrative figures as guarantees, and we explicitly label hypothetical and simulated content.",
  },
  {
    title: "Respect the boundary",
    description:
      "MIRROR educates. It does not execute trades, connect to brokerages, hold funds, or offer personalized automated advice.",
  },
  {
    title: "Stay calm and disciplined",
    description:
      "We avoid hype, urgency mechanics, and market-timing narratives in favor of patient, principle-driven education.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-neutral-200 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="About MIRROR"
            title="A quieter, clearer way to learn about investing"
            description="Most investment content shows results and hides the reasoning. MIRROR exists to do the opposite — make the thinking visible, and keep the boundaries honest."
          />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeading align="left" eyebrow="What we stand for" title="Four commitments" />
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
            {COMMITMENTS.map((c) => (
              <div key={c.title} className="bg-white p-8">
                <h3 className="font-semibold text-neutral-900">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading align="left" eyebrow="Our boundary" title="What MIRROR will not do" />
          <p className="mt-6 text-neutral-600">
            MIRROR is an educational platform and takes its responsibility seriously. We
            deliberately do not build features that could be mistaken for investment management or
            that pressure your decisions:
          </p>
          <ul className="mt-6 space-y-3 border-l border-neutral-200 pl-6 text-neutral-700">
            <li>No automatic trade execution or brokerage connections.</li>
            <li>No holding, custody, or transferring of funds.</li>
            <li>No personalized automated investment advice.</li>
            <li>No guaranteed return messaging.</li>
            <li>No manipulative urgency or fear-based mechanics.</li>
          </ul>
          <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            All investment involves risk, including loss of principal. Nothing on this site is a
            recommendation, offer, or solicitation. Illustrative and simulated content is labeled as
            such.
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
