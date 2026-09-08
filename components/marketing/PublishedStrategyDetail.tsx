import type { PublishedStrategyDetail as PublicStrategyDetailData } from "@/lib/db/repositories/strategy-repository";
import {
  creatorDisplayName,
  formatDisplayDate,
  riskProfileLabel,
} from "@/lib/services/strategy-presentation";

/**
 * Public detail view for a PUBLISHED, creator-authored strategy.
 *
 * Server-rendered only. Content is the creator's own DB-backed fields — thesis,
 * methodology rules, risk/exit conditions, target allocation, update/decision
 * history and any model performance the creator supplied. Nothing here is
 * synthesized or fabricated.
 */

function Section({ title, body }: { title: string; body?: string | null }) {
  if (!body || body.trim().length === 0) return null;
  return (
    <section className="border-t border-neutral-100 py-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-neutral-800">{body}</p>
    </section>
  );
}

function PerformanceContext({ strategy }: { strategy: PublicStrategyDetailData }) {
  const rows: { label: string; value: string }[] = [];
  if (strategy.performanceYTD !== null) {
    rows.push({ label: "Year to date (model)", value: String(strategy.performanceYTD) + "%" });
  }
  if (strategy.performanceOneYear !== null) {
    rows.push({ label: "One year (model)", value: String(strategy.performanceOneYear) + "%" });
  }
  if (strategy.performanceThreeYear !== null) {
    rows.push({
      label: "Three years (model)",
      value: String(strategy.performanceThreeYear) + "%",
    });
  }
  if (strategy.maxDrawdown !== null) {
    rows.push({ label: "Max drawdown (model)", value: String(strategy.maxDrawdown) + "%" });
  }
  if (strategy.volatility !== null) {
    rows.push({ label: "Volatility (model)", value: String(strategy.volatility) + "%" });
  }
  if (rows.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-800">
        Simulated performance context
      </h2>
      <p className="mt-1 text-xs text-amber-700">
        Model figures supplied by the creator for educational context. They are illustrative only —
        never actual returns, never a guarantee of future results.
      </p>
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-white/70 px-3 py-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-amber-700">
              {row.label}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-amber-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PublishedStrategyDetail({ strategy }: { strategy: PublicStrategyDetailData }) {
  const creator = strategy.creator;
  const profile = creator?.creatorProfile;
  const total = strategy.allocations.reduce((sum, a) => sum + a.targetWeight, 0);

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            Published strategy
          </span>
          <span className="rounded-md border border-neutral-200 px-2 py-0.5 text-xs text-neutral-500">
            Educational blueprint
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-900 sm:text-4xl">
          {strategy.name}
        </h1>
        {strategy.philosophy ? (
          <p className="mt-3 max-w-2xl text-lg text-neutral-600">{strategy.philosophy}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-neutral-600">
          <span>
            <span className="font-medium text-neutral-900">Risk profile:</span>{" "}
            {riskProfileLabel(strategy.riskProfile)}
          </span>
          <span>
            <span className="font-medium text-neutral-900">Time horizon:</span>{" "}
            {strategy.timeHorizon || "Not set"}
          </span>
          <span>
            <span className="font-medium text-neutral-900">Published:</span>{" "}
            {strategy.publishedAt ? formatDisplayDate(strategy.publishedAt) : "—"}
          </span>
        </div>
      </header>

      <Section title="Objective" body={strategy.objective} />
      <Section title="Description" body={strategy.description} />
      <Section title="Thesis" body={strategy.thesis} />
      <Section title="Decision rules" body={strategy.decisionRules} />
      <Section title="Rebalance policy" body={strategy.rebalancePolicy} />
      <Section title="Exit conditions" body={strategy.exitConditions} />
      <Section title="Invalidating conditions" body={strategy.invalidatingConditions} />

      <section className="border-t border-neutral-100 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Target allocation
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Illustrative target weights defined by the creator. Allocations are educational and are
          not real positions.
        </p>
        {strategy.allocations.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No allocations defined yet.</p>
        ) : (
          <div>
            <ul className="mt-4 space-y-2">
              {strategy.allocations.map((line) => (
                <li key={line.id} className="rounded-lg border border-neutral-100 px-3 py-2">
                  <div className="flex items-center justify-between gap-4 text-sm text-neutral-700">
                    <span className="font-medium text-neutral-900">{line.assetClass}</span>
                    <span className="tabular-nums font-medium">{line.targetWeight}%</span>
                  </div>
                  {line.reasoning ? (
                    <p className="mt-1 text-xs text-neutral-500">{line.reasoning}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-neutral-500">Total: {total}%</p>
          </div>
        )}
      </section>

      <section className="border-t border-neutral-100 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Update &amp; decision history
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          How the strategy has changed over time, with the creator&apos;s rationale and risk
          assessment for each update.
        </p>
        {strategy.updates.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            The creator has not recorded an update yet.
          </p>
        ) : (
          <ol className="mt-6 space-y-6 border-l border-neutral-200 pl-6">
            {strategy.updates.map((update) => (
              <li key={update.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-emerald-600 bg-white" />
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  {formatDisplayDate(update.effectiveDate)}
                </p>
                <p className="mt-1 font-medium text-neutral-900">{update.title}</p>
                <p className="mt-1 text-sm text-neutral-600">{update.description}</p>
                {update.changesSummary ? (
                  <p className="mt-2 text-sm text-neutral-600">
                    <span className="font-medium text-neutral-800">What changed:</span>{" "}
                    {update.changesSummary}
                  </p>
                ) : null}
                {update.reasoning ? (
                  <p className="mt-1 text-sm text-neutral-600">
                    <span className="font-medium text-neutral-800">Why:</span> {update.reasoning}
                  </p>
                ) : null}
                {update.riskAssessment ? (
                  <p className="mt-1 text-sm text-neutral-600">
                    <span className="font-medium text-neutral-800">Risk impact:</span>{" "}
                    {update.riskAssessment}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="mt-6">
        <PerformanceContext strategy={strategy} />
      </div>

      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Creator</h2>
        <p className="mt-1 text-lg font-medium text-neutral-800">
          {creatorDisplayName(creator?.firstName, creator?.lastName)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
          {profile?.isVerified ? (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Verified
            </span>
          ) : (
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
              Not verified
            </span>
          )}
          {typeof profile?.yearsOfExperience === "number" ? (
            <span>{profile.yearsOfExperience} years experience</span>
          ) : null}
        </div>
        {profile?.investmentPhilosophy ? (
          <p className="mt-3 text-sm italic text-neutral-600">{profile.investmentPhilosophy}</p>
        ) : null}
        {profile?.bio ? <p className="mt-2 text-sm text-neutral-600">{profile.bio}</p> : null}
      </section>

      <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-xs leading-relaxed text-neutral-500">
        <p>
          MIRROR is an educational platform that shows how experienced investors think before you
          invest your own money. This strategy and any figures it contains are provided by the
          creator for education only — they are not investment advice, not a real portfolio, and not
          a guarantee of any outcome. MIRROR does not execute trades or manage funds.
        </p>
      </div>
    </article>
  );
}
