# MIRROR

> See how experienced investors think, across every market, before you invest your own money.

MIRROR is a transparent investment strategy education platform. It enables experienced investors to publish their investment methodologies, model portfolios, research, and strategy updates. Learners can study these strategies, understand the reasoning behind decisions, follow strategies, simulate portfolios, and build investment conviction—all without risking real money.

## Core Differentiator

**Traditional Copy Trading:**

> "What did this investor buy?"

**MIRROR:**

> "Why did this investor make that decision?"

MIRROR focuses on methodology, education, and independent thinking rather than blind copying.

## Key Features (MVP)

### For Learners

- Discover and search investment strategies
- Study investment theses and allocation reasoning
- Follow strategies and receive updates
- Create paper portfolios and simulate outcomes
- Learn investment principles through Academy
- Compare strategies and philosophies

### For Strategy Creators

- Publish investment strategies with complete methodology
- Define allocation, risk profile, and time horizon
- Write investment theses and explain decisions
- Publish strategy updates with reasoning
- Build an audience and eventually monetize
- Monitor strategy analytics

### For Admins

- Manage users and creators
- Moderate strategy content
- Review reports and audit logs
- Manage platform configuration

## Tech Stack

- **Frontend:** Next.js 15 + TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Clerk (replaceable)
- **Database:** Neon PostgreSQL + Prisma ORM (validated; migrations applied)
- **Deployment:** Vercel-compatible (no deployment config committed yet; staging setup is Phase 17B)

## Project Structure

```
MIRROR/
├── app/               # Next.js app directory
│   ├── (auth)/       # Auth routes (sign-in, sign-up)
│   ├── (public)/     # Public marketing pages (home, strategies, about, etc.)
│   ├── (learner)/    # Learner dashboard (protected)
│   ├── (creator)/    # Creator dashboard (protected)
│   ├── (admin)/      # Admin dashboard (protected)
│   └── layout.tsx    # Root layout (ClerkProvider + html/body)
├── components/
│   ├── marketing/    # Public marketing components (Navbar, Hero, etc.)
│   ├── learner/      # Learner feature components
│   └── creator/      # Creator feature components
├── lib/
│   ├── data/         # Typed sample/source-of-truth data (e.g. strategies.ts)
│   ├── services/     # Business logic services
│   └── ...           # Utilities, database access, auth helpers
├── prisma/           # Database schema and migrations
├── .github/workflows/ # GitHub Actions CI (ci.yml)
├── MIRROR_SPEC.md    # Product specification
├── ARCHITECTURE.md   # Application architecture
├── CLAUDE.md         # Engineering rules
├── TESTING_CHECKLIST.md # Phase 17B browser smoke-test checklist
├── MIRROR_MASTER_PROMPT.md # Phased implementation prompt (0–17)
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
├── next.config.ts    # Next.js config
├── tailwind.config.ts # Tailwind config
└── .env.example      # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (local or remote)
- Clerk account (for authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/GabrielKelvin0/MIRROR.git
cd MIRROR

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in environment variables:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - DATABASE_URL
```

If the repository is linked to a Neon project, run `neon env pull` to
fill `.env.local` with `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED`
(direct), and `NEON_BRANCH`. Prisma Migrate uses the direct `DIRECT_URL`;
the application uses the pooled `DATABASE_URL` at runtime.

Prisma validation/generation (no database connection required):

```bash
npx prisma validate   # validates the schema
npx prisma generate   # generates the Prisma client
```

### Development

```bash
# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm test

# Format code
npm run format

# Build for production
npm run build
npm start
```

## Development Phases

MIRROR is built in phases. Current status:

- ✅ **Phase 0:** Inspection and planning
- ✅ **Phase 1:** Foundation
- ✅ **Phase 2:** Architecture and services
- ✅ **Phase 3:** Database schema (validated; initial migration applied to Neon Postgres)
- ✅ **Phase 4 / 4.5:** Authentication, authorization, and stabilization
- ✅ **Phase 5:** Marketing website (public pages, strategy blueprints)
- ✅ **Phase 6:** Strategy Creator workflow (draft, edit, allocations, updates, publish/archive)
- ✅ **Phase 7:** Strategy Discovery (search, filters, risk-forward cards, blueprint detail with creator/performance/updates)
- ✅ **Phase 8:** Following and Notifications (follow/unfollow, read/unread updates, safe notification payloads, anti-spam)
- ✅ **Phase 9:** Paper Portfolio (hypothetical virtual portfolios with simulated capital, strategy allocations, manual decisions, and deterministic performance vs a sample benchmark)
- ✅ **Phase 10:** Academy (structured learning paths, courses, lessons, completion progress; DB-backed progress verified against the live Neon Postgres database)
- ✅ **Phase 11:** Performance & Risk (historical/period return, max drawdown, recovery, annualised volatility, benchmark comparison, allocation, correlation over a clearly-marked seed/demo series with explicit period and data basis)
- ✅ **Phase 12:** Modular subscription/entitlement architecture (separate product entitlement rules from subscription state and payment-provider implementation; Free/Pro/Creator plans; payments not activated)
- ✅ **Phase 13:** Security audit (audited middleware, auth, all server actions, repositories, DB queries, error handling; fixed error-message leakage to clients; no SQL-injection/XSS/IDOR/mass-assignment issues found)
- ✅ **Phase 14:** Responsive & accessibility audit (fixed contrast failures on small text/CTA buttons, added skip-to-content links and table `scope`, fixed a sr-only-only error display, responsive grids/narrow-width overflow, touch targets, heading hierarchy)
- ✅ **Phase 15:** Performance (removed duplicate DB query on the paper-portfolio detail page and parallelized its independent queries; collapsed the creator edit/preview pages from 5 queries to 1 via a single ownership-checked detail read; no N+1 loops found elsewhere)
- ✅ **Phase 16 (Testing):** Expanded automated coverage for the highest-value risk areas — the authorization choke-point (`lib/auth/session.ts`, now 8 tests), role guards (`hasRole` strict equality), strategy publish/update rules (self-transition, whitespace, weight boundaries), entitlement `strategyAccess` (paid strategies denied even to the highest tier without a subscription), portfolio calc edge cases (NaN inputs, allocation-total boundaries), performance data-quality handling (zero-value/constant series), and every `AppError` subclass. Suite grew from 126 to 163 tests across 10 files.
- ✅ **Phase 16+ (post-16 work):** Neon Postgres connected and initial migration applied; admin management and research flows; Academy progress decoupled from the Lesson FK until the curriculum is DB-backed
- ✅ **Phase 17A (Pre-Testing Readiness):** real GitHub Actions CI, environment/config reconciliation, and TESTING_CHECKLIST.md added — no new product features

Phase work is tracked in MIRROR_MASTER_PROMPT.md (Phases 0–17); product
requirements are sourced from MIRROR_SPEC.md.

## Product Vision

MIRROR is built on these principles:

1. **Transparency over secrecy** — Investors reveal their thinking
2. **Education over blind copying** — Users learn why decisions are made
3. **Risk awareness over return chasing** — Risk metrics are visible
4. **Methodology over hype** — Strategy reasoning is primary
5. **Historical evidence over unsupported claims** — Data is labeled clearly
6. **Simulation before real capital** — Paper portfolios are completely safe
7. **Clear disclosures** — Legal and product disclaimers are prominent
8. **Independent decision-making** — No manipulative mechanics

## Financial Guardrails

MIRROR MVP focuses on education and transparency, NOT execution:

- ✅ Strategy publication and sharing
- ✅ Historical strategy analysis
- ✅ Paper portfolio simulation
- ✅ Educational content
- ✅ Risk metrics and analysis

- ❌ Automatic trade execution
- ❌ Broker integration
- ❌ Copy trading
- ❌ Real-money management
- ❌ Guaranteed return claims

Real-money features require separate legal and compliance review before implementation.

## Documentation

- **MIRROR_SPEC.md** — Complete product specification
- **ARCHITECTURE.md** — Application architecture and boundaries
- **CLAUDE.md** — Engineering rules and standards
- **MIRROR_MASTER_PROMPT.md** — Phased implementation prompt (Phases 0–17) for
  driving incremental, safe development

> Note: MIRROR_CODEX_PROMPT.md (build phases) and MIRROR_UI_UX.md (design
> system) are referenced by earlier phases in this documentation but are not
> currently present in the repository. They have not been recreated; use
> MIRROR_SPEC.md and ARCHITECTURE.md as the authoritative sources. Phase work
> is driven by MIRROR_MASTER_PROMPT.md.

## Contributing

See CLAUDE.md for engineering standards and review checklist.

## Security

MIRROR takes security seriously. All operations affecting protected data are:

- Server-side verified
- Authenticated and authorized
- Validated and sanitized
- Auditable where appropriate

See CLAUDE.md for security guidelines.

## Performance

Performance and risk metrics are implemented (Phase 11) as clearly labelled,
deterministic demo series over a sample benchmark (`lib/data/performance-demo.ts`,
`lib/services/performance-rules.ts`). No live market-data provider is connected;
all figures are educational demo data. Status: unit-tested and statically
verified; not yet browser-verified.

## Accessibility

Phase 14 applied a static accessibility/responsive audit (contrast, skip links,
focus visibility, table scopes, touch targets, responsive grids). Browser-level
verification (keyboard navigation, screen reader, mobile widths) is pending —
see TESTING_CHECKLIST.md.

## License

TBD

## Status

**Phase 17A (Pre-Testing Readiness) complete — MIRROR is ready for Phase 17B (staging deployment and real browser testing)**

Clerk authentication is active (development keys), `/learner/*`, `/creator/*`,
and `/admin/*` are protected by middleware plus server-side role checks, new
users default to LEARNER, and CREATOR/ADMIN roles are assigned only by an
authenticated ADMIN from `/admin/users`. MIRROR runs on a live Neon Postgres
project: the initial migration and the Academy progress-FK migration are
applied and the schema is up to date. GitHub Actions CI
(`.github/workflows/ci.yml`) runs Prisma generate/validate, typecheck, lint,
and the 163-test suite; it never applies migrations and never writes to any
database. Automated checks pass; interactive browser verification has not
been run yet (this container's `next`/SWC crashes with SIGBUS) —
TESTING_CHECKLIST.md defines the Phase 17B smoke tests.

### Verification status

- **Implemented** — code exists in this repository
- **Statically verified** — typecheck and lint pass (no running app)
- **DB-layer verified** — Prisma schema and migrations checked against the linked Neon database (no destructive operations)
- **Automated-test verified** — unit tests pass (163 tests / 10 files)
- **Browser/runtime verified** — not yet: requires a working Next.js runtime (staging/preview)
- **Not yet verified** — production build output, live interaction, mobile/accessibility browser checks
