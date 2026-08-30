import type { StrategyBlueprintData, StrategyUpdateEntry } from "@/lib/data/strategies";

const UPDATE_TYPE_LABEL: Record<StrategyUpdateEntry["type"], string> = {
  allocation: "Allocation",
  methodology: "Methodology",
  risk: "Risk",
  outlook: "Outlook",
};

function AllocationBar({ allocation }: { allocation: StrategyBlueprintData["allocation"] }) {
  const colors = ["bg-emerald-500", "bg-neutral-400", "bg-amber-500", "bg-neutral-700"];
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100">
        {allocation.lines.map((line, i) => (
          <div
            key={line.assetClass}
            className={`h-full ${colors[i % colors.length]}`}
            style={{ width: `${line.weight}%` }}
            title={`${line.assetClass} ${line.weight}%`}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {allocation.lines.map((line, i) => (
          <li
            key={line.assetClass}
            className="flex items-center justify-between text-sm text-neutral-700"
          >
            <span className="flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${colors[i % colors.length]}`}
              />
              {line.assetClass}
            </span>
            <span className="tabular-nums font-medium">{line.weight}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreatorProfile({ strategy }: { strategy: StrategyBlueprintData }) {
  const creator = strategy.creator;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Creator</h2>
      <p className="mt-1 text-lg font-medium text-neutral-800">{creator.name}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
        {creator.verified ? (
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Verified
          </span>
        ) : (
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
            Not verified
          </span>
        )}
        {creator.yearsOfExperience !== undefined ? (
          <span>{creator.yearsOfExperience} years experience</span>
        ) : null}
      </div>
      {creator.investmentPhilosophy ? (
        <p className="mt-3 text-sm italic text-neutral-600">{creator.investmentPhilosophy}</p>
      ) : null}
    </div>
  );
}

function PerformanceCard({ strategy }: { strategy: StrategyBlueprintData }) {
  const performance = strategy.performance;
  if (!performance) return null;
  const rows: { label: string; value: string }[] = [];
  if (performance.annualisedReturn)
    rows.push({ label: "Annualised return", value: performance.annualisedReturn });
  if (performance.volatility) rows.push({ label: "Volatility", value: performance.volatility });
  if (performance.maxDrawdown) rows.push({ label: "Max drawdown", value: performance.maxDrawdown });

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-800">
        {performance.label}
      </h2>
      <p className="mt-1 text-xs text-amber-700">Illustrative {performance.horizon} model.</p>
      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-amber-700">
              {row.label}
            </dt>
            <dd className="mt-0.5 text-sm text-amber-900">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-amber-200 pt-3 text-xs leading-relaxed text-amber-800">
        {performance.note}
      </p>
    </div>
  );
}

function UpdateHistory({ updates }: { updates: StrategyUpdateEntry[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-neutral-900">Update history</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Illustrative updates demonstrating how blueprint changes are communicated with rationale and
        risk impact — not real historical events.
      </p>
      <ul className="mt-6 space-y-5 border-l border-neutral-200 pl-6">
        {updates.map((update) => (
          <li key={update.id} className="relative">
            <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-amber-500 bg-white" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                {UPDATE_TYPE_LABEL[update.type]}
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                {update.dateLabel}
              </span>
            </div>
            <p className="mt-2 font-medium text-neutral-900">{update.title}</p>
            <p className="mt-1 text-sm text-neutral-600">{update.summary}</p>
            <p className="mt-1 text-sm italic text-neutral-500">Rationale: {update.reasoning}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StrategyBlueprint({ strategy }: { strategy: StrategyBlueprintData }) {
  return (
    <article>
      <header className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
            {strategy.category}
          </span>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Sample model · educational
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-neutral-900 sm:text-4xl">
          {strategy.name}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-neutral-600">{strategy.tagline}</p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-neutral-600">
          <span>
            <span className="font-medium text-neutral-900">Risk profile:</span>{" "}
            {strategy.riskProfile}
          </span>
          <span>
            <span className="font-medium text-neutral-900">Time horizon:</span>{" "}
            {strategy.timeHorizon}
          </span>
          <span>
            <span className="font-medium text-neutral-900">Region:</span> {strategy.region}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">Philosophy</h2>
            <p className="mt-3 text-neutral-700">{strategy.philosophy}</p>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-neutral-900">Thesis</h2>
            <p className="mt-3 text-neutral-700">{strategy.thesis}</p>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-neutral-900">Objective</h2>
            <p className="mt-3 text-neutral-700">{strategy.objective}</p>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-neutral-900">Methodology</h2>
            <ul className="mt-4 space-y-3">
              {strategy.methodology.map((item) => (
                <li key={item} className="flex gap-3 text-neutral-700">
                  <span className="mt-0.5 text-emerald-600">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-neutral-900">Risk framework</h2>
            <ul className="mt-4 space-y-3">
              {strategy.riskFramework.map((item) => (
                <li key={item} className="flex gap-3 text-neutral-700">
                  <span className="mt-0.5 text-amber-600">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-8">
          <CreatorProfile strategy={strategy} />
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Allocation</h2>
            <p className="mt-1 text-xs text-neutral-500">{strategy.allocation.caption}</p>
            <div className="mt-5">
              <AllocationBar allocation={strategy.allocation} />
            </div>
          </div>
          <PerformanceCard strategy={strategy} />
        </aside>
      </div>

      <section className="border-t border-neutral-200 py-10">
        <h2 className="text-xl font-semibold text-neutral-900">Sample decision history</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Illustrative decision points demonstrating how a blueprint is reviewed and communicated —
          not real events.
        </p>
        <ol className="mt-6 space-y-5 border-l border-neutral-200 pl-6">
          {strategy.decisionHistory.map((entry) => (
            <li key={entry.period} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-emerald-600 bg-white" />
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                {entry.period}
              </p>
              <p className="mt-1 font-medium text-neutral-900">{entry.decision}</p>
              <p className="mt-1 text-sm text-neutral-600">{entry.rationale}</p>
            </li>
          ))}
        </ol>
      </section>

      <UpdateHistory updates={strategy.updates} />

      <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-xs leading-relaxed text-neutral-500">
        <p>
          This is a <strong className="text-neutral-700">sample and educational model</strong> used
          to demonstrate MIRROR&apos;s Strategy Blueprint. It is not a real investor&apos;s
          portfolio, not investment advice, and any performance, volatility, or drawdown figure
          shown is <strong className="text-neutral-700">illustrative only</strong> — never a
          guarantee of future results. MIRROR does not execute trades or manage funds.
        </p>
        <p className="mt-2">
          MIRROR deliberately surfaces risk and methodology alongside any illustrative figures and
          never ranks strategies by return alone.
        </p>
      </section>
    </article>
  );
}
