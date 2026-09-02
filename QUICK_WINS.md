# QUICK WINS — MIRROR
**Small Changes with Big Impact | <100 lines each | Do These While Database is Syncing**

---

## ✅ QUICK WIN #1: Add Missing Public Routes Structure
**Time:** 15 minutes | **Lines:** ~40  
**Impact:** Unblocks homepage development

### What to Do
Create empty page files so routing structure is complete:

```bash
# Create auth routes (Clerk will handle UI)
mkdir -p app/\(auth\)/sign-in/\[\[...sign-in\]\]
touch app/\(auth\)/sign-in/\[\[...sign-in\]\]/page.tsx

mkdir -p app/\(auth\)/sign-up/\[\[...sign-up\]\]
touch app/\(auth\)/sign-up/\[\[...sign-up\]\]/page.tsx

# Create public routes
mkdir -p app/\(public\)/strategies/\[slug\]
touch app/\(public\)/strategies/page.tsx
touch app/\(public\)/strategies/\[slug\]/page.tsx
touch app/\(public\)/how-it-works/page.tsx
touch app/\(public\)/about/page.tsx

# Create protected routes
mkdir -p app/\(learner\)/dashboard
mkdir -p app/\(learner\)/portfolio/\[id\]
mkdir -p app/\(learner\)/following
mkdir -p app/\(learner\)/notifications
mkdir -p app/\(learner\)/academy

mkdir -p app/\(creator\)/dashboard
mkdir -p app/\(creator\)/strategies/\[id\]/edit

mkdir -p app/\(admin\)/dashboard
```

### Code for Each File
**`app/(auth)/sign-in/[[...sign-in]]/page.tsx`:**
```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <SignIn />
    </div>
  );
}
```

**`app/(auth)/sign-up/[[...sign-up]]/page.tsx`:**
```typescript
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <SignUp />
    </div>
  );
}
```

**For all other placeholder pages:**
```typescript
export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Coming Soon</h1>
    </main>
  );
}
```

### Why It Matters
- ✅ Routes won't 404 during development
- ✅ Clerk auth pages accessible at `/sign-in` and `/sign-up`
- ✅ Middleware can properly redirect to sign-in
- ✅ Team can test route protection without full page implementation

---

## ✅ QUICK WIN #2: Create Core Library Structure
**Time:** 20 minutes | **Lines:** ~80  
**Impact:** Enables all database operations

### What to Do
Create the foundation files for all data access patterns:

```bash
# Create auth layer
mkdir -p lib/auth
touch lib/auth/session.ts
touch lib/auth/roles.ts

# Create database layer
mkdir -p lib/db/repositories
touch lib/db/index.ts

# Create services layer
mkdir -p lib/services
touch lib/services/index.ts

# Create utilities
mkdir -p lib/errors
touch lib/errors.ts
```

### Core Files

**`lib/auth/session.ts`** (server-only auth helpers):
```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  
  // Sync/create user in DB
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })
  
  if (!user) {
    return await prisma.user.create({
      data: {
        clerkId: userId,
        email: '',
        role: 'LEARNER',
      },
    })
  }
  
  return user
}

export async function getCurrentUser() {
  try {
    return await requireAuth()
  } catch {
    return null
  }
}
```

**`lib/auth/roles.ts`** (authorization checks):
```typescript
import type { UserRole } from '@prisma/client'

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    LEARNER: 0,
    CREATOR: 1,
    ADMIN: 2,
  }
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function assertRole(userRole: UserRole, requiredRole: UserRole) {
  if (!hasRole(userRole, requiredRole)) {
    throw new Error(`Requires ${requiredRole} role`)
  }
}
```

**`lib/db/index.ts`**:
```typescript
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
```

**`lib/errors.ts`** (safe error handling):
```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message)
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('UNAUTHORIZED', 401, 'Authentication required')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', 403, message)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', 404, `${resource} not found`)
  }
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message
  return 'Something went wrong. Please try again.'
}
```

### Why It Matters
- ✅ All server actions can import from `lib/auth/session`
- ✅ Consistent error handling across app
- ✅ Reusable authorization patterns
- ✅ Prisma client is singleton (prevents connection leaks)

---

## ✅ QUICK WIN #3: Add Utility Types File
**Time:** 10 minutes | **Lines:** ~50  
**Impact:** Improves TypeScript DX across codebase

### What to Do
Create **`lib/types/index.ts`**:

```typescript
import type { User, Strategy, PaperPortfolio } from '@prisma/client'

// User with relations
export type UserWithProfile = User & {
  creatorProfile: any | null
}

// Strategy with allocations
export type StrategyWithDetails = Strategy & {
  allocations: any[]
  updates: any[]
}

// Form inputs
export interface CreateStrategyInput {
  name: string
  description?: string
  philosophy?: string
  riskProfile?: 'LOW' | 'MODERATE' | 'HIGH'
  timeHorizon?: string
}

export interface UpdateStrategyInput extends Partial<CreateStrategyInput> {}

export interface CreateAllocationInput {
  strategyId: string
  assetClass: string
  targetWeight: number
  reasoning?: string
}

export interface CreatePortfolioInput {
  name: string
  description?: string
  startingCapital: number
}

// API responses
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Filter options
export interface StrategyFilters {
  philosophy?: string
  riskProfile?: string
  assetClass?: string
  searchQuery?: string
}
```

### Why It Matters
- ✅ Forms have type safety
- ✅ No need to repeat type definitions
- ✅ IDE autocomplete for all forms
- ✅ API responses are consistent

---

## ✅ QUICK WIN #4: Add Navigation Component
**Time:** 20 minutes | **Lines:** ~70  
**Impact:** Makes app feel complete, unblocks UI development

### What to Do
Create **`components/layout/Navbar.tsx`**:

```typescript
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'

export async function Navbar() {
  const { userId } = await auth()

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600" />
          <span className="text-lg font-bold">MIRROR</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/strategies" className="text-sm text-neutral-600 hover:text-neutral-900">
            Strategies
          </Link>
          <Link href="/how-it-works" className="text-sm text-neutral-600 hover:text-neutral-900">
            How It Works
          </Link>
          <Link href="/about" className="text-sm text-neutral-600 hover:text-neutral-900">
            About
          </Link>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-4">
          {userId ? (
            <>
              <Link href="/learner/dashboard" className="text-sm font-medium text-emerald-600">
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm text-neutral-600 hover:text-neutral-900">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
```

Create **`components/layout/Footer.tsx`**:

```typescript
export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-neutral-900">Product</h4>
            <ul className="mt-4 space-y-2">
              <li><a href="/strategies" className="text-sm text-neutral-600 hover:text-neutral-900">Strategies</a></li>
              <li><a href="/academy" className="text-sm text-neutral-600 hover:text-neutral-900">Academy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900">Company</h4>
            <ul className="mt-4 space-y-2">
              <li><a href="/about" className="text-sm text-neutral-600 hover:text-neutral-900">About</a></li>
              <li><a href="/how-it-works" className="text-sm text-neutral-600 hover:text-neutral-900">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900">Legal</h4>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-sm text-neutral-600 hover:text-neutral-900">Terms</a></li>
              <li><a href="#" className="text-sm text-neutral-600 hover:text-neutral-900">Privacy</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs text-neutral-500">
              MIRROR is educational only. Not investment advice.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-8 text-center text-xs text-neutral-600">
          © 2026 MIRROR. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
```

Update **`app/(public)/layout.tsx`**:
```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

### Why It Matters
- ✅ App looks professional immediately
- ✅ Navigation works everywhere
- ✅ Unclicks the "Coming Soon" pages
- ✅ Users can sign in/sign up from anywhere

---

## ✅ QUICK WIN #5: Add Sample Data & Seed Script
**Time:** 25 minutes | **Lines:** ~120  
**Impact:** Enables testing without manual data entry

### What to Do
Create **`prisma/seed.ts`**:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test users
  const learner = await prisma.user.upsert({
    where: { email: 'learner@example.com' },
    update: {},
    create: {
      clerkId: 'test_learner',
      email: 'learner@example.com',
      firstName: 'Alice',
      lastName: 'Investor',
      role: 'LEARNER',
    },
  })

  const creator = await prisma.user.upsert({
    where: { email: 'creator@example.com' },
    update: {},
    create: {
      clerkId: 'test_creator',
      email: 'creator@example.com',
      firstName: 'Bob',
      lastName: 'Manager',
      role: 'CREATOR',
      creatorProfile: {
        create: {
          bio: 'Experienced portfolio manager',
          investmentPhilosophy: 'Value investing with a focus on fundamentals',
          yearsOfExperience: 10,
          isVerified: true,
        },
      },
    },
  })

  // Create sample strategy
  const strategy = await prisma.strategy.create({
    data: {
      creatorId: creator.id,
      name: 'Dividend Growth Portfolio',
      description: 'A strategy focused on dividend-paying stocks',
      philosophy: 'Income-focused',
      riskProfile: 'MODERATE',
      timeHorizon: '10+ years',
      status: 'PUBLISHED',
      thesis: 'High-quality dividend payers provide stable income',
      publishedAt: new Date(),
    },
  })

  // Add allocations
  await prisma.strategyAllocation.createMany({
    data: [
      {
        strategyId: strategy.id,
        assetClass: 'US Dividend Stocks',
        targetWeight: 60,
        reasoning: 'Core holding for income',
      },
      {
        strategyId: strategy.id,
        assetClass: 'Bonds',
        targetWeight: 30,
        reasoning: 'Stability and diversification',
      },
      {
        strategyId: strategy.id,
        assetClass: 'International',
        targetWeight: 10,
        reasoning: 'Global diversification',
      },
    ],
  })

  console.log('✅ Seed data created!')
  console.log(`   - Learner: ${learner.email}`)
  console.log(`   - Creator: ${creator.email}`)
  console.log(`   - Strategy: ${strategy.name}`)
}

main().catch(console.error)
```

Update **`package.json`** to add seed script:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run seed:
```bash
npx prisma db seed
```

### Why It Matters
- ✅ No need to manually create test data
- ✅ Same data every time (`npm run dev`)
- ✅ Can test strategy discovery immediately
- ✅ Can test following/portfolio workflows
- ✅ Helpful for demo/screenshots

---

## ✅ QUICK WIN #6: Add Loading & Error Components
**Time:** 15 minutes | **Lines:** ~60  
**Impact:** Every page feels responsive

### What to Do
Create **`components/ui/Loading.tsx`**:
```typescript
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-emerald-600" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 p-4">
      <div className="h-6 w-1/3 animate-pulse rounded bg-neutral-200" />
      <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
    </div>
  )
}
```

Create **`components/ui/Error.tsx`**:
```typescript
interface ErrorProps {
  message?: string
  onRetry?: () => void
}

export function ErrorMessage({ message = 'Something went wrong', onRetry }: ErrorProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
        >
          Try again
        </button>
      )}
    </div>
  )
}
```

### Why It Matters
- ✅ Pages feel snappy during loading
- ✅ Errors are visible and recoverable
- ✅ Reusable components across all pages
- ✅ Better UX = higher perceived quality

---

## 📋 SUMMARY: Do These First

1. **QUICK WIN #1** (15 min) → Routing structure complete
2. **QUICK WIN #2** (20 min) → Auth & DB layer ready
3. **QUICK WIN #3** (10 min) → Types everywhere
4. **QUICK WIN #4** (20 min) → App looks professional
5. **QUICK WIN #5** (25 min) → Can test immediately with data
6. **QUICK WIN #6** (15 min) → Loading/error states everywhere

**Total time: ~105 minutes**  
**Massive payoff:** All routes work, app looks great, data layer solid

Then start on ROADMAP Task 1 (Homepage) with confidence!

---

## 🚀 BONUS QUICK WIN #7: Add GitHub Actions CI (Optional)

Create **`.github/workflows/ci.yml`**:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
```

This ensures code quality on every commit (no extra cost, GitHub Actions is free).

**Time:** 10 minutes | **Impact:** Prevents bugs before they merge
