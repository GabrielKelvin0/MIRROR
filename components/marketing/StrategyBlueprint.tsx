import type { StrategyBlueprintData } from "@/lib/data/strategies";

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
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Allocation</h2>
            <p className="mt-1 text-xs text-neutral-500">{strategy.allocation.caption}</p>
            <div className="mt-5">
              <AllocationBar allocation={strategy.allocation} />
            </div>
          </div>

          {strategy.performance ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-800">
                {strategy.performance.label}
              </h2>
              {strategy.performance.annualisedReturn ? (
                <p className="mt-3 text-sm text-amber-900">
                  <span className="font-medium">{strategy.performance.annualisedReturn}</span>
                </p>
              ) : null}
              <p className="mt-2 text-sm text-amber-800">{strategy.performance.volatilityNote}</p>
            </div>
          ) : null}
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

      <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-xs leading-relaxed text-neutral-500">
        This is a <strong className="text-neutral-700">sample and educational model</strong> used to
        demonstrate MIRROR&apos;s Strategy Blueprint. It is not a real investor&apos;s portfolio,
        not investment advice, and any performance or allocation shown is illustrative only. MIRROR
        does not execute trades or manage funds.
      </section>
    </article>
  );
}
