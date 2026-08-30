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
        status: 'PUBLISHED',
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
  if (strategy.status === 'PUBLISHED' && !canEditPublished()) {
    throw new BusinessRuleError('Published strategies cannot be edited');
  }

  // 5. Persist
  const updated = await strategyRepo.update(id, validated);

  // 6. Audit
  await auditLog.create({
    userId: session.userId,
    action: 'STRATEGY_UPDATED',
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
    message: string,
  ) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('UNAUTHORIZED', 401, 'Authentication required');
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('FORBIDDEN', 403, 'You do not have permission');
  }
}

export class ValidationError extends AppError {
  constructor(public fields: Record<string, string>) {
    super('VALIDATION_ERROR', 400, 'Validation failed');
  }
}
```

---

## Next Steps

**Phase 3:** Database schema — implemented (validated; migrations pending)

**Phase 4 / 4.5:** Authentication, authorization, and stabilization — implemented

**Phase 5:** Marketing website — implemented (public pages + strategy blueprints;
see the Public Website boundary above. `next build` still fails with SIGBUS in
this aarch64 container; verification relies on `npm run typecheck`, `npm test`,
and `npm run lint`.)

**Phase 6:** Strategy Creator workflow — implemented (draft, edit, allocations,
updates, owner-gated preview/publish/archive; see the Creator Application
boundary above). DB-backed: requires migrations + a live PostgreSQL, which are
not available in this container (missing OpenSSL and `DATABASE_URL`), so runtime
was not executed here; verification relied on typecheck, unit tests, and lint.

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

**Phase 9:** Paper Portfolio — implemented (DB-backed, like Phase 6/8;
requires migrations + a live PostgreSQL, not available in this container, so
runtime was not executed here; verification relied on typecheck, unit tests,
and lint). Learners create purely hypothetical virtual portfolios with
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
