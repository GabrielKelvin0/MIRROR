import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Investment education, through transparency
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            See how experienced investors think.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            Explore the thesis, methodology, risk framework, allocation and decision history behind
            investment strategies — before making decisions with your own money.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/strategies"
              className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-center font-medium text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              Explore Strategies
            </Link>
            <Link
              href="/how-it-works"
              className="w-full rounded-lg border border-neutral-300 bg-white px-6 py-3 text-center font-medium text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50 sm:w-auto"
            >
              How MIRROR Works
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
            {[
              { label: "Methodology", value: "The thinking behind decisions" },
              { label: "Transparency", value: "Every strategy is inspectable" },
              { label: "Education", value: "Not execution, not hype" },
            ].map((item) => (
              <div key={item.label} className="bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  {item.label}
                </p>
                <p className="mt-2 text-sm text-neutral-600">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
