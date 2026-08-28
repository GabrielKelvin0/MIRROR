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

**Route:** `/` (public, no authentication required)

**Purpose:** Marketing, product education, conversion to signup

**Sections:**
- Homepage hero with core message
- Why MIRROR section
- How it works (4-step process)
- Featured strategies (demo data, clearly labeled)
- Research preview
- Paper portfolio demo
- Academy overview
- Creator section
- Pricing
- Footer with disclosures

**Components:** Marketing pages, no data access, no user identity

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
- Abstract authentication provider (Clerk by default, replaceable)
- User identity synchronization (Clerk ID ↔ MIRROR User record)
- Session token validation
- No password storage (delegated to provider)

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

**Features:**
- Strategy CRUD (Create, Read, Update, Delete)
- Strategy publishing workflow (draft → published)
- Strategy updates publication
- Creator profile management
- Strategy analytics
- Follower management
- Research upload

**Authorization:** Must be authenticated with CREATOR role

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

**Current:** Clerk (replaceable)

**Interface:** `lib/auth/provider.ts`

```typescript
export interface AuthProvider {
  validateSession(token: string): Promise<AuthSession | null>;
  getUserIdentity(clerkId: string): Promise<ProviderIdentity | null>;
  createUser(identity: ProviderIdentity): Promise<User>;
}
```

**Why Replaceable:**
- Clerk can be swapped for Auth0, Supabase, Firebase, or custom solution
- Business logic does not reference Clerk-specific concepts
- Only the provider interface matters to the rest of the app

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

**Phase 3:** Implement the complete database schema

**Phase 4:** Implement authentication flows and route protection

**Phase 5:** Build the marketing website
