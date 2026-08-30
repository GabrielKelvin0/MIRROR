import Link from "next/link";

const FOOTER_NAV = [
  { href: "/strategies", label: "Strategies" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <p className="text-lg font-bold tracking-tight text-neutral-900">MIRROR</p>
            <p className="mt-2 text-sm text-neutral-600">
              See how experienced investors think, across every market, before you invest your own
              money.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-2">
            {FOOTER_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <Link href="/about" className="text-sm text-neutral-600 hover:text-neutral-900">
              Privacy
            </Link>
            <Link href="/about" className="text-sm text-neutral-600 hover:text-neutral-900">
              Terms
            </Link>
          </div>
        </div>

        <div className="mt-12 space-y-3 border-t border-neutral-200 pt-8 text-xs leading-relaxed text-neutral-500">
          <p>
            <strong className="text-neutral-600">Educational purposes only.</strong> MIRROR is an
            investment education and strategy-transparency platform. Nothing on this website is
            investment advice, a solicitation, or an offer to buy or sell any security.
          </p>
          <p>
            <strong className="text-neutral-600">Risk disclosure.</strong> All investment involves
            risk, including loss of principal. Strategy blueprints, model portfolios, and any
            performance figures shown here are illustrative and educational in nature; they are not
            guarantees of future results and do not represent actual historical performance of any
            investor. MIRROR does not execute trades, connect to brokerages, hold funds, or provide
            personalized advisory services.
          </p>
          <p>
            Privacy and Terms pages are placeholders and have not been created; legal review has not
            been performed.
          </p>
        </div>
      </div>
    </footer>
  );
}
