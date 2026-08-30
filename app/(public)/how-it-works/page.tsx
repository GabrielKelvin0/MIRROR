import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { MethodologyFlow } from "@/components/marketing/MethodologyFlow";
import { CTA } from "@/components/marketing/CTA";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how MIRROR presents investment strategies with transparency — thesis, methodology, allocation, and decision history — for educational purposes only.",
};

const STEPS = [
  {
    step: "1",
    title: "We publish the thesis",
    description:
      "Every strategy begins with a clear statement of why it exists and the problem it addresses — before any numbers are presented.",
  },
  {
    step: "2",
    title: "The methodology is explicit",
    description:
      "The principles and rules that guide decisions are written down and inspectable, so you can judge the logic independently.",
  },
  {
    step: "3",
    title: "Allocation and risk are shown",
    description:
      "Target allocations and the risk framework are published. Nothing is hidden behind a black box.",
  },
  {
    step: "4",
    title: "Decision history is recorded",
    description:
      "Changes are logged with their rationale, keeping a strategy accountable to its stated principles over time.",
  },
  {
    step: "5",
    title: "You form your own judgment",
    description:
      "Using what you see, you learn how to think about portfolio construction. MIRROR does not trade, hold, or manage your money.",
  },
];

const QUESTIONS = [
  {
    title: "Is this investment advice?",
    description:
      "No. MIRROR is an education and transparency platform. It does not provide personalized advice, execute trades, or manage funds.",
  },
  {
    title: "Are the figures real?",
    description:
      "Figures shown on the public site are illustrative and educational. They are clearly labeled and are not a guarantee of future results.",
  },
  {
    title: "What happens after I create an account?",
    description:
      "You get access to the learner dashboard where your experience is organized. The public transparency content remains available.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-neutral-200 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="How It Works"
            title="Transparency is the method"
            description="MIRROR presents investment thinking in a consistent, inspectable structure so you can learn from the reasoning, not just the outcomes."
          />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <MethodologyFlow steps={STEPS} />
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="Answers" title="Common questions" />
          <div className="mt-10 space-y-8">
            {QUESTIONS.map((q) => (
              <div key={q.title} className="border-t border-neutral-200 pt-6">
                <h3 className="font-semibold text-neutral-900">{q.title}</h3>
                <p className="mt-2 text-neutral-600">{q.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/strategies"
              className="inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700"
            >
              Explore the blueprints
            </Link>
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
