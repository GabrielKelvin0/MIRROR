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
- **Styling:** Tailwind CSS + shadcn/ui (ready for Phase 6)
- **Authentication:** Clerk (replaceable)
- **Database:** PostgreSQL + Prisma ORM (schema validated)
- **Deployment:** Vercel-ready

## Project Structure

```
MIRROR/
├── app/               # Next.js app directory
│   ├── (auth)/       # Auth routes (sign-in, sign-up)
│   ├── (public)/     # Public marketing pages (home, strategies, about, etc.)
│   ├── (learner)/    # Learner dashboard (protected)
│   ├── (creator)/    # Creator dashboard (protected)
│   ├── (admin)/      # Admin dashboard (protected)
│   ├── api/          # API routes
│   └── layout.tsx    # Root layout (ClerkProvider + html/body)
├── components/
│   └── marketing/    # Reusable marketing website components (Navbar, Hero, etc.)
├── lib/
│   ├── data/         # Typed sample/source-of-truth data (e.g. strategies.ts)
│   ├── services/     # Business logic services
│   └── ...           # Utilities, database access, auth helpers
├── prisma/           # Database schema and migrations
├── public/           # Static assets
├── MIRROR_SPEC.md    # Product specification
├── ARCHITECTURE.md   # Application architecture
├── CLAUDE.md         # Engineering rules
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
- ✅ **Phase 3:** Database schema (validated; migrations pending)
- ✅ **Phase 4 / 4.5:** Authentication, authorization, and stabilization
- ✅ **Phase 5:** Marketing website (public pages, strategy blueprints)
- ✅ **Phase 6:** Strategy Creator workflow (draft, edit, allocations, updates, publish/archive)
- ⏳ **Phase 7+:** Feature implementation

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

Performance is measured, not speculated. Performance work is scheduled for a
later phase.

## Accessibility

MIRROR is built for everyone. Accessibility requirements are scheduled for a
later phase.

## License

TBD

## Status

**Phase 4.5 — Stabilization & Reconciliation: COMPLETE**

Clerk authentication is active, `/learner/*`, `/creator/*`, and `/admin/*` are
protected by middleware and server-side role authorization, and new users
default to LEARNER.

Next: Phase 5 — Marketing website (not started)
