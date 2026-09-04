# MIRROR — ARCHITECTURE

This document defines the technical architecture for MIRROR.

## Overview

MIRROR is a layered, service-oriented application built on Next.js. The architecture emphasizes:

1. **Clear separation of concerns** — UI, business logic, and data access are distinct
2. **Replaceable providers** — Authentication, payments, market data, storage can be swapped
3. **Server-side security** — Authorization and validation happen server-side only
4. **Financial safety** — No execution paths exist for real-money trading or broker integration
5. **Testability** — Services and logic are decoupled from providers

---

## Application Boundaries

### 1. Public Website

**Routes:** public, no authentication required

- `/` — marketing homepage
- `/strategies` — strategy blueprint discovery
- `/strategies/[slug]` — individual strategy blueprint
- `/how-it-works` — methodology and FAQ
- `/about` — mission, principles, financial-safety boundary

**Purpose:** Marketing, product education, conversion to signup

**Implemented sections (Phase 5, extended by Phase 7 discovery):**

- Homepage hero with core message
- Why MIRROR (three pillars: Methodology, Transparency, Education)
- Transparent strategy blueprint preview (sample strategies, labeled)
- Investment principles
- Decision-history transparency
- Phase 7: `/strategies` discovery — search, filters (philosophy, asset class,
  risk, time horizon), risk-forward cards, and sort that never ranks by return
  alone; `/strategies/[slug]` blueprint detail with creator profile, illustrative
  performance/drawdown/volatility, philosophy, update history, and disclosures
- What MIRROR is / is not (guardrails)
- CTA and footer with disclosures

**Planned (future phases, not yet built):** pricing, go-to-market, creator
sections, academy overview, paper-portfolio demo.

**Components:** `components/marketing/` (Navbar, Footer, Hero, SectionHeading,
StrategyCard, StrategyBlueprint, MethodologyFlow, CTA). No DB access, no user
identity. Content is driven by typed sample data in `lib/data/strategies.ts`,
which is intentionally shaped like future Prisma-backed records so it can be
swapped later without a redesign.

**Verification:** No authenticated user required

---

### 2. Authentication Layer

**Route:** `/auth` (group for auth-related routes)

**Purpose:** User identity and session management

**Flows:**

- Sign up
- Sign in
- Sign out
- Email verification (provider-dependent)
- Password recovery (provider-dependent)

**Implementation:**

- Clerk is the authentication provider, integrated at its boundary
- User identity synchronization (Clerk subject `clerkId` ↔ MIRROR User record)
- Session token validation via Clerk server adapter (`lib/auth/session.ts`)
- No password storage (delegated to Clerk)

**Auth boundary (server-only):**

- `lib/auth/session.ts` — Clerk server adapter: `requireAuth`, `getOptionalAuth`, `getCurrentUser`, `requireRole`
- `lib/auth/roles.ts` — role authorization boundary (local User.role checks)
- `middleware.ts` — blocks unauthenticated access to `/learner/*`, `/creator/*`, `/admin/*`
- `lib/db/repositories/user-repository.ts` — maps `clerkId` to a unique local MIRROR User

Direct Clerk imports are limited to these integration points; the rest of the
application depends on the auth/session/roles boundary, not on Clerk directly.

**Security Boundaries:**

- All session tokens server-validated
- No authentication state in browser localStorage (delegated to provider)
- Redirect unauthenticated users to sign-in
- Protect sensitive authentication endpoints

---

### 3. Learner Application

**Route:** `/learner` (protected, requires LEARNER or CREATOR role)

**Purpose:** Strategy discovery, learning, paper portfolio management

**Features:**

- Strategy discovery and search
- Strategy detail pages
- Following strategies
- Receiving strategy updates
- Paper portfolio creation and management
- Academy/learning progress
- Notifications
- Profile management

**Authorization:** Must be authenticated with LEARNER or CREATOR role

**Database Access:** Read public strategies, create/manage own portfolios, read learning progress

**Financial Safety:** Paper portfolios only, no execution capability

---

### 4. Creator Application

**Route:** `/creator` (protected, requires CREATOR role)

**Purpose:** Strategy creation, publishing, management

**Implemented (Phase 6):**

- Strategy creation (draft) and editing
- Blueprint fields: philosophy, objective, time horizon, risk description,
  target allocation, thesis, decision rules, rebalance policy, exit /
  invalidating conditions
- Target allocation management (asset class, weight, reasoning; 100% cap)
- Strategy updates with rationale
- Owner-gated preview, publish, and archive (draft → published → archived)
- Ownership enforced at the data boundary (strategy-repository); unpublished
  content is never exposed via public reads

**Planned (future phases, not yet built):** strategy analytics, follower
management, research upload, creator profile management UI.

**Authorization:** Must be authenticated with CREATOR role; ownership of each
strategy is verified server-side (never client-supplied identity)

**Database Access:** Full access to own strategies, read-only access to public data

**Financial Safety:** Strategy publication only, no execution or trading capability

---

### 5. Admin Application

**Route:** `/admin` (protected, requires ADMIN role)

**Purpose:** Platform moderation and management

**Features:**

- User management
- Creator review and approval
- Strategy moderation
- Report management
- Audit logs
- Platform configuration
- Content management (Academy)

**Authorization:** Must be authenticated with ADMIN role, verified server-side

**Database Access:** Full read access, controlled write access (creation, suspension, deletion)

**Security:** Every admin action is auditable

Implemented admin surfaces (all ADMIN-guarded server-side): `/admin/users` (role
management), `/admin/creators`, `/admin/strategies` (status moderation), and
`/admin/reports` (status resolution). `AuditLog` rows are written by admin and
creator mutations; there is no dedicated audit-log UI yet. Platform
configuration and Academy content management remain planned.

---

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              USER INTERFACE (Next.js)                        │
│  Public Pages | Auth | Learner | Creator | Admin            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│        ORCHESTRATION LAYER (Server Actions)                 │
│  • Input validation                                          │
│  • Authentication check                                      │
│  • Authorization check                                       │
│  • Business rule enforcement                                 │
│  • Error handling                                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│         DOMAIN / BUSINESS LOGIC LAYER                        │
│  • Strategy logic                                            │
│  • Portfolio calculations                                    │
│  • Risk metrics                                              │
│  • Following/notification logic                              │
│  • Learning progress tracking                                │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│          DATA ACCESS LAYER (Repositories)                    │
│  • User repository                                           │
│  • Strategy repository                                       │
│  • Portfolio repository                                      │
│  • Learning repository                                       │
│  • Notification repository                                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│    PERSISTENCE LAYER (Prisma + PostgreSQL)                  │
│  • User                                                      │
│  • CreatorProfile                                            │
│  • Strategy                                                  │
│  • StrategyAllocation                                        │
│  • Follow                                                    │
│  • PaperPortfolio                                            │
│  • And more...                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Provider Abstractions

### Authentication Provider

**Current:** Clerk

**Boundary:** `lib/auth/session.ts` + `lib/auth/roles.ts` (server-only)

The application depends on a small auth boundary, not on Clerk directly:

```typescript
// lib/auth/session.ts (server-only)
requireAuth(): Promise<ClerkSession>        // authenticated session or redirect
getCurrentUser(): Promise<LocalUser>        // resolve/create local User from clerkId
requireRole(role: UserRole): Promise<LocalUser> // session → local User → role check

// lib/auth/roles.ts (server-only, pure)
hasRole(user, required): boolean
assertRole(user, required): void            // throws ForbiddenError
```

**Why Replaceable:**

- Clerk can be swapped for Auth0, Supabase, Firebase, or a custom solution by
  changing only `lib/auth/session.ts` and the identity sync in
  `lib/auth/session.ts` + `lib/db/repositories/user-repository.ts`
- Business logic and authorization check the local MIRROR User role, not
  Clerk-specific concepts
- No second auth provider is introduced

---

### Market Data Provider

**Current:** None (using seed/demo data)

**Interface:** `lib/services/market-data.ts`

```typescript
export interface MarketDataProvider {
  getHistoricalPrices(ticker: string, period: string): Promise<PriceData[]>;
  getPerformanceMetrics(holdings: string[]): Promise<Metrics>;
}
```

**Why Replaceable:**

- Can integrate with Yahoo Finance, IEX, Polygon, or Alpha Vantage later
- Business logic uses metrics, not raw provider data
- Demo data is clearly labeled to avoid confusion

---

### Payment Provider

**Current:** None (MVP free-only)

**Interface:** `lib/services/payments.ts`

```typescript
export interface PaymentProvider {
  createCheckoutSession(plan: string, userId: string): Promise<SessionUrl>;
  verifyWebhook(payload: unknown, signature: string): Promise<WebhookEvent>;
}
```

**Why Replaceable:**

- Stripe can be swapped for Paddle, Lemonsqueezy, or custom billing
- Subscription logic is separate from payment processing
- Payment secrets never stored in database

---

### Notification Provider

**Current:** None (database-only notifications)

**Interface:** `lib/services/notifications.ts`

```typescript
export interface NotificationProvider {
  sendEmail(to: string, template: string, data: Record): Promise<void>;
  sendPushNotification(deviceId: string, message: string): Promise<void>;
}
```

**Why Replaceable:**

- Email can be SendGrid, Resend, or self-hosted
- Push can be Firebase, OneSignal, or custom
- Notifications queued in database, delivered via provider

---

### Storage Provider

**Current:** None (future feature)

**Interface:** `lib/services/storage.ts`

```typescript
export interface StorageProvider {
  uploadFile(key: string, data: Buffer, metadata: Metadata): Promise<URL>;
  deleteFile(key: string): Promise<void>;
}
```

**Why Replaceable:**

- S3 can be swapped for Cloudflare R2, Backblaze B2, or self-hosted
- File upload logic is separate from storage backend
- No private credentials in database

---

## Database Access Pattern

**Repositories abstract database queries:**

```typescript
// lib/db/repositories/strategy-repository.ts

export class StrategyRepository {
  async findPublished(filters: StrategyFilters): Promise<Strategy[]> {
    return prisma.strategy.findMany({
      where: {
        status: "PUBLISHED",
        ...filters,
      },
    });
  }

  async findByCreatorId(creatorId: string): Promise<Strategy[]> {
    return prisma.strategy.findMany({
      where: { creatorId },
    });
  }

  async create(data: CreateStrategyInput): Promise<Strategy> {
    return prisma.strategy.create({ data });
  }
}
```

**Benefit:** Business logic calls repositories, not Prisma directly. Database queries are centralized.

---

## Authorization Pattern

**Every protected operation follows this sequence:**

```typescript
// Example: User updating their own strategy

export async function updateStrategy(id: string, data: UpdateStrategyInput) {
  // 1. Authenticate
  const session = await auth();
  if (!session?.userId) throw new UnauthorizedError();

  // 2. Authorize
  const strategy = await strategyRepo.findById(id);
  if (!strategy) throw new NotFoundError();
  if (strategy.creatorId !== session.userId) throw new ForbiddenError();

  // 3. Validate input
  const validated = validateStrategyUpdate(data);

  // 4. Apply domain rules
  if (strategy.status === "PUBLISHED" && !canEditPublished()) {
    throw new BusinessRuleError("Published strategies cannot be edited");
  }

  // 5. Persist
  const updated = await strategyRepo.update(id, validated);

  // 6. Audit
  await auditLog.create({
    userId: session.userId,
    action: "STRATEGY_UPDATED",
    resourceId: id,
  });

  return updated;
}
```

---

## Financial Safety Boundaries

**What IS possible:**

- ✅ View strategies
- ✅ Create paper portfolios
- ✅ Simulate portfolio performance
- ✅ Follow strategies (receive notifications)
- ✅ Read educational content
- ✅ Publish strategy methodologies
- ✅ Record strategy decisions/updates

**What IS NOT possible:**

- ❌ Execute real trades
- ❌ Connect to brokers
- ❌ Transfer real money
- ❌ Auto-copy trades
- ❌ Place orders
- ❌ Access margin/leverage
- ❌ Set up recurring debits
- ❌ Promise guaranteed returns

**Enforcement:**

- No broker API keys stored
- No order execution endpoints exist
- No payment flow to trading accounts
- Paper portfolios are calculation-only
- Disclaimers present on every strategy

---

## Server vs Client

**Server-side (always):**

- Authentication validation
- Authorization checks
- Database access
- Business logic
- Secret management
- Audit logging
- Payment processing
- External API calls

**Client-side (UI only):**

- Rendering
- Form input
- Client-side validation (UX, not security)
- UI state
- Navigation
- Animations

**Never on client:**

- Secret keys (API, database, encryption)
- Sensitive user data
- Authorization decisions
- Financial calculations (except display)
- Admin operations

---

## Error Handling

**Consistent error classes:**

```typescript
// lib/errors.ts

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("UNAUTHORIZED", 401, "Authentication required");
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("FORBIDDEN", 403, "You do not have permission");
  }
}

export class ValidationError extends AppError {
  constructor(public fields: Record<string, string>) {
    super("VALIDATION_ERROR", 400, "Validation failed");
  }
}
```

---

## Next Steps

**Verification & CI (Phase 17A):** GitHub Actions (`.github/workflows/ci.yml`)
runs `npm ci` → `npx prisma generate` → `npx prisma validate` →
`npm run typecheck` → `npm run lint` → `npm test`, then attempts
`npm run build` best-effort with non-secret placeholders. CI never applies
migrations and never writes to any database. Browser smoke tests for Phase 17B
are defined in TESTING_CHECKLIST.md. Role provisioning for testing: an
authenticated ADMIN assigns LEARNER/CREATOR/ADMIN from `/admin/users`; new
users always default to LEARNER.

**Phase 3:** Database schema — implemented (validated; initial migration applied to Neon Postgres)

**Phase 4 / 4.5:** Authentication, authorization, and stabilization — implemented

**Phase 5:** Marketing website — implemented (public pages + strategy blueprints;
see the Public Website boundary above. `next build` still fails with SIGBUS in
this aarch64 container; verification relies on `npm run typecheck`, `npm test`,
and `npm run lint`.)

**Phase 6:** Strategy Creator workflow — implemented (draft, edit, allocations,
updates, owner-gated preview/publish/archive; see the Creator Application
boundary above). DB-backed and connected to a live Neon Postgres project: migrations are
applied and runtime data-layer paths were verified here via Prisma probes.
Interactive browser flows remain unverified in this container (`next`/SWC
crashes with SIGBUS); static verification relied on typecheck, unit tests,
and lint.

**Phase 7:** Strategy Discovery — implemented over the same typed sample-data
boundary as Phase 5 (library-driven, no DB required, runtime-verifiable here).
Adds search + philosophy/asset class/risk/time-horizon filters and risk-forward
cards, and a blueprint detail with creator profile, illustrative quantified
performance/drawdown/volatility, methodology, update history, and disclosures.
Discovery logic lives in `lib/data/strategies.ts` and is covered by unit tests
in `lib/data/strategies.test.ts`. Risk and methodology are always surfaced;
strategies are never ranked by return alone.

**Phase 8:** Following and Notifications — implemented (DB-backed, like
Phase 6). Learners follow/unfollow published strategies; when a followed
strategy publishes a "meaningful" update (published strategy with non-empty
title/description), a notification is fanned out to its followers. Pure,
anti-spam rules live in `lib/services/following-rules.ts` (unit-tested in
`following-rules.test.ts`); persistence lives in `lib/db/repositories/`
(`follow-repository.ts`, `notification-repository.ts`); server actions are in
`app/(learner)/following/actions.ts`; learner UI is under `/learner/following`
and `/learner/notifications` with read/unread state and appropriate loading,
error, and empty states. Notification payloads are safe (display-only title +
message; no emails or other sensitive data), and notifications are only ever
scoped to the authenticated user's own rows.

**Phase 9:** Paper Portfolio — implemented (DB-backed, like Phase 6/8; live Neon database with migrations applied and
runtime data-layer paths verified via Prisma probes; interactive browser flows
remain unverified in this container because `next`/SWC crashes with SIGBUS). Learners create purely hypothetical virtual portfolios with
simulated starting capital, allocate PUBLISHED strategies (with the total
capped at 100%), record manual decisions, and view deterministic performance
plus an illustrative sample benchmark. All figures are clearly labelled
hypothetical — there is no real money, execution, or brokerage anywhere.

Pure, deterministic math and validation live in
`lib/services/portfolio-rules.ts` (valuation, return, allocation-total
enforcement, input/decision validation; unit-tested in
`portfolio-rules.test.ts`). Persistence with ownership-at-the-boundary lives in
`lib/db/repositories/portfolio-repository.ts`; server actions are in
`app/(learner)/portfolio/actions.ts`; learner UI is under `/learner/portfolio`
(list + detail) with client components in `components/learner/`
(`PortfolioCreateForm`, `PortfolioAllocationManager`, `PortfolioDecisionForm`,
`PortfolioDeleteButton`). Portfolio rows are scoped to the authenticated user;
every read/mutation verifies ownership before touching data. Manual decisions
are stored as `REBALANCE` portfolio events (the schema's closest existing
event type) with the decision text in the description.

**Phase 10:** Academy — implemented (DB-backed progress, like Phase 9; live Neon database with migrations applied
and runtime data-layer paths verified via Prisma probes).
Learners follow structured learning paths organized into three levels — Beginner
(investing basics, stocks vs ETFs, diversification, risk, compound growth,
portfolio construction), Intermediate (fundamental analysis, valuation, financial
ratios, DCF concepts, research), and Advanced (macro analysis, factor investing,
scenario analysis, risk management, portfolio optimization). Each course has
ordered lessons with typed content blocks; learners mark lessons complete and
track per-course and per-level progress. All content is educational and clearly
not personalized advice nor a guarantee of any outcome.

The curriculum itself lives in `lib/data/curriculum.ts` as typed sample data
(16 courses, ~48 lessons, content as a `ContentBlock` union rendered directly as
React) shaped to mirror the Prisma `Course`/`Lesson` models so it can be swapped
for DB records without a redesign. Pure, deterministic rules (progress math,
completion-state resolution, input validation, lesson navigation) live in
`lib/services/academy-rules.ts` (unit-tested in `academy-rules.test.ts`).
Persistence with per-user scoping lives in `lib/db/repositories/
academy-repository.ts`; server actions are in `app/(learner)/academy/actions.ts`;
learner UI is under `/learner/academy` (catalog, course detail with progress bar,
lesson content with complete/incomplete toggle and prev/next navigation) plus a
client `LessonCompleteButton`. Progress rows are scoped to the authenticated user.

DESIGN NOTE — lesson identity: `Progress.lessonId` stores the curriculum's
stable `"courseSlug/lessonSlug"` key and deliberately has no FK to `Lesson.id`
while the curriculum is typed sample data. The FK was removed by migration
20260902080805_remove_progress_lesson_fk (constraint-only, non-destructive);
duplicate completion is prevented by `@@unique([userId, lessonId])`. When a
later phase seeds real `Course`/`Lesson` rows, progress must be reconciled to
real lesson ids and the FK restored.

**Phase 11:** Performance & Risk — implemented (no DB dependency; runtime
verifiable via typecheck/tests/lint in this container). Adds a deterministic
metrics engine for: historical/period return, maximum drawdown and recovery
time, annualised volatility (sample std-dev of periodic returns), benchmark
comparison (excess return), allocation (normalised weights), and correlation
(Pearson, where the data supports it). Every calculation honours the phase rule
"performance calculations must state the relevant period and data basis", so the
engine exposes `periodLabel` and `dataBasis` that callers must always surface.

All of the pure, deterministic math lives in `lib/services/performance-rules.ts`
(unit-tested in `performance-rules.test.ts`) and operates over a typed
`ValueSeries` of chronological points. The data fed to the engine is a clearly
labelled SEED/DEMO series in `lib/data/performance-demo.ts` (frozen, monthly,
with an explicit period label and an honest "seed/demo — not real market data"
basis), in line with Phase 11's instruction not to fabricate historical market
data. The metrics are surfaced in a learner-facing `PerformanceRiskPanel`
(server component, under `components/learner/`) added to the paper portfolio
detail page (`/learner/portfolio/[id]`), showing the return/drawdown/volatility/
benchmark/correlation/recovery metrics plus the portfolio's allocation
breakdown and a method-and-basis disclosure. Everything is clearly hypothetical
and educational — never a claim of real results or a guarantee. The panel is
not DB-backed and requires no migrations; a future phase may source a real time
series from a data provider when one is configured.

**Phase 12:** Modular subscription / entitlement architecture — implemented
(comes in three cleanly-separated concerns, as the phase requires; the DB-backed
state cannot be runtime-executed in this container, so verification relied on
typecheck, unit tests, and lint).

1. **Product entitlement** — `lib/services/entitlement-rules.ts` (pure,
   deterministic, unit-tested in `entitlement-rules.test.ts`): a feature catalog
   (`FEATURES`), a `FEATURE_MATRIX` mapping each plan
   (FREE / PRO_LEARNER / PREMIUM_CREATOR) to its granted features, helpers
   (`isPlanEntitled`, `featuresForPlan`, `isAtLeast`, `assertKnownPlan`), and a
   `strategyAccess` rule that decides paid-strategy access from a plan + held
   strategy-subscription state + strategy pricing. Business logic lives here,
   never in a provider.

2. **Subscription state** — `lib/db/repositories/subscription-repository.ts`
   (server-only, wired into `lib/db`): persists a user's `Subscription` row and
   its `Entitlement` rows from the pure feature matrix, records/revokes held
   "paid strategy subscription" state (as an `Entitlement` with feature key
   `strategy:<id>` on the user's own active subscription — matching the existing
   Phase 3 schema, no fabricated model), and exposes a
   `learnerEntitlementSummary` + an `assertCanAccessStrategy` access gate.

3. **Payment provider** — `lib/payments/provider.ts` (server-only): a narrow
   `PaymentProvider` CONTRACT (start/cancel a strategy subscription) with NO
   business/entitlement logic inside it. `getPaymentProvider()` currently always
   returns an unconfigured stub that refuses every operation, enforcing the
   "do not activate real payments without required environment configuration"
   guardrail. Selecting a real provider (e.g. Stripe) happens only here, based
   on env config.

Learner UI: a read-only subscription/entitlement status page under
`/learner/subscription` shows the user's plan and granted features plus a
plan-comparison table derived purely from the rules, and is linked from the
learner dashboard. No payments are charged anywhere. The `Strategy` schema has no
price field yet, so all strategies are treated as free for entitlement purposes;
the `strategyAccess` rule already supports pricing when a price is configured.

**Phase 13:** Security Audit — performed. Reviewed every route and server
action (there are no API routes, file uploads, or external-service calls in
this codebase), the middleware/auth boundary, all repositories, database
queries, and error handling.

Findings: the architecture is already strong — Clerk-backed authentication with
server-side `requireRole`/`assertRole` checks on the local DB user; ownership
verified at the repository boundary on every owned resource (IDOR-protected);
explicit field whitelists in every Prisma `create`/`update` (no mass
assignment); server-side validation via pure rules modules; Prisma
parameterisation (no raw SQL / SQL-injection surface); no XSS sinks
(`dangerouslySetInnerHTML`/`innerHTML` are absent — React escaping + typed
server-rendered content only); no secrets in client components; `server-only`
enforced on all repositories/session/payments; the payment provider stays an
unconfigured stub so payments cannot run.

Confirmed fix (high-impact for the "never expose internals to users" rule):
server-action error handling previously returned a raw `err.message` to the
client, which could leak internal details (query text, stack traces, file
paths) for non-AppError failures. Added `safeErrorMessage` in `lib/errors.ts`
(unit-tested in `lib/errors.test.ts`) that passes through intentional
`AppError` messages but collapses every other error to a generic fallback, and
wired it into all four server-action files. Noted as "Not verified here" (as in
CLAUDE.md): live browser testing, rate limiting on server actions (Clerk guards
auth; there is no unauthenticated brute-force surface), and audit-log
instantiation (`AuditLog` model exists but is not yet written) remain future
phase work.

**Phase 14:** Responsive & Accessibility audit — performed statically (no browser
available in this container; verified via typecheck/eslint/tests). Reviewed all
pages/components against 320–1920px widths for overflow/clipping, touch targets,
keyboard/focus, labels, semantics, heading hierarchy, table/chart accessibility,
error messaging, typography, and contrast.

Fixed within scope (all low-risk class-only changes):

- Contrast: darkened small text that failed WCAG AA on light backgrounds —
  `text-emerald-600` eyebrows/categories/text links → `text-emerald-700`,
  white-on-`emerald-500` CTA button → `emerald-600`, `text-neutral-400`
  notification timestamps → `text-neutral-500`, footer disclaimer
  `text-neutral-500` → `text-neutral-600`, archived status badge
  `text-neutral-500`→`text-neutral-600`.
- Navigation: added "Skip to main content" links (with `id="main"`) to the
  public, learner, and creator layouts for keyboard/screen-reader users.
- Table accessibility: added `scope="col"` to the subscription plan-comparison
  table headers.
- Heading hierarchy: added an sr-only `<h2>` on the strategy discovery page to
  stop the h1→h3 skip.
- Error messaging: made the PortfolioAllocationManager remove-action error
  visibly rendered (it was `sr-only`, invisible to sighted users).
- Responsive/overflow: portfolio-list metric `dl` now stacks on mobile
  (`grid-cols-1 sm:grid-cols-3`), StrategyCard largest-allocation value
  truncates, creator-dashboard strategy name truncates (`min-w-0`).
- Touch targets: added modest hit-area padding to text-only action buttons
  (Remove, Mark as read/unread).

Known not-verifiable here (browser-only, as elsewhere): empirical 320px–1920px
visual confirmation and screen-reader testing remain pending.

**Phase 15:** Performance — measured statically (no live app workload; `next build`
unavailable in this container; verified via typecheck/eslint/tests). Audited all
repositories for N+1 loops, relation over-fetching, and repeated queries; audited
server actions for revalidate breadth; audited client components for unnecessary
client work and client-only dependencies.

Findings: the DB layer was already efficient (no N+1 loops; batched `createMany`
notification fan-out; scoped includes; `take` limits on related reads; scoped
`revalidatePath` calls; 14 lean client components, none pulling a heavy
dependency). Three real, non-speculative contributors were found and fixed:

1. Duplicate query — the paper-portfolio detail page called `getOwned` (a heavy
   `findUnique` with strategies→strategy + positions + events) and then
   `performanceSummary(id, userId)`, which called the SAME `getOwned` again.
   Fixed: `performanceSummary` now accepts the already-loaded portfolio
   (pure compute, no second query). Before: 2× identical heavy queries.
   After: 1×.
2. Serial waterfall — `getOwned` and the public `listPublished` ran one after the
   other; they are independent. Fixed: fetched them in `Promise.all` on the
   portfolio detail page (ownership still enforced inside `getOwned`).
   Before: serial. After: parallel.
3. Repeated ownership queries — the creator edit and preview pages each issued
   `getOwned` + `listAllocations` + `listUpdates`, where the latter two each
   re-ran the ownership `findUnique` (5 queries total). Fixed: added a single
   ownership-checked `getOwnedDetail` (strategy + allocations + updates in one
   query) and used it on both pages. Before: 5 queries. After: 1.

No browser/Lighthouse measurements are possible here; the above are query-count
reductions on hot pages, verifiable by code review.

**Phase 16:** Testing — prioritised automated coverage (not full-coverage chasing)
for the areas MIRROR_MASTER_PROMPT.md flags as highest value: authorization,
strategy ownership/publishing/update behavior, portfolio and allocation
calculations, subscription entitlement logic, input validation, and
security-sensitive operations. The previously-untested authorization
choke-point `lib/auth/session.ts` (`requireAuth`, `getOptionalAuth`,
`getCurrentUser`, `requireRole`) now has its own mock-based suite
(`lib/auth/session.test.ts`, 8 tests) with `server-only`, Clerk, `next/navigation`
and the DB layer mocked. Added strict-equality role-guard assertions (a higher
role never satisfies a lower guard), strategy self-transition/whitespace/weight
boundary cases, entitlement `strategyAccess` denial for paid strategies even on
the highest plan without a subscription, portfolio NaN/0%/allocation-total edge
cases, performance data-quality handling (zero-value/constant series, opposite
correlation, 0% return), and every `AppError` subclass code/status. Suite grew
from 126 to 163 tests across 10 files; typecheck, ESLint, and Prettier all clean.
