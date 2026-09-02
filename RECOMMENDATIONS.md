# RECOMMENDATIONS — MIRROR TECHNICAL CHOICES
**Database | Deployment | Environment | Performance | Security | Cost Optimization**

---

## 🗄️ DATABASE: NEON vs SUPABASE

### Recommendation: **NEON** ✅

**Why Neon:**
- **Free tier:** 3 projects, 10GB, 0.5M compute hours/month, always-free tier
- **PostgreSQL-native:** Direct Prisma support, no abstraction layer
- **Serverless:** Auto-scales, cold-start OK for MVP
- **Branching:** Create dev branches per feature (useful for CI/CD later)
- **Cost per user:** $0 for MVP (no paid seats needed)
- **No credit card required initially** (free tier is true free, not trial)

**Setup (5 minutes):**
```bash
# 1. Sign up at neon.tech (free)
# 2. Create project "mirror-dev"
# 3. Copy CONNECTION_STRING
# 4. In .env.local:
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/mirror_dev?schema=public&sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.neon.tech/mirror_dev?schema=public&sslmode=require"

# 5. Run migrations
npx prisma migrate dev --name init
```

**When to switch:**
- If you exceed 10GB (unlikely for MVP with demo data)
- If you need advanced features (vector search, etc.)
- Cost is still $0.16/GB for hobby tier

### Alternative: Supabase
- ✅ Also free (10GB, no cold starts claimed)
- ❌ Adds abstraction layer (Auth + Postgre + Realtime)
- ❌ Free tier expires after 1 month (then $5/month minimum)
- ❌ Overkill for MVP (you're using Clerk, not Supabase Auth)

### Alternative: Railway / Render
- ✅ Free tier available
- ❌ Cold-start issues (slower first request)
- ❌ More complex setup

**Final choice: NEON — simplest, most cost-effective, PostgreSQL-pure.**

---

## 🚀 DEPLOYMENT: VERCEL

### Recommendation: **VERCEL** ✅ (with Neon Database)

**Why Vercel:**
- **Next.js native:** Zero-config deployment
- **Free tier:** 100GB bandwidth, unlimited deployments
- **Clerk integration:** First-class support
- **Environment variables:** Secure, easy to manage
- **Preview deployments:** Test before production
- **Serverless functions:** API routes scale automatically
- **Database URL injection:** Automatic env management

**Setup (10 minutes):**
```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Go to vercel.com, sign in with GitHub
# 3. Click "Add New Project" → Select MIRROR repo
# 4. Add environment variables:
#    - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
#    - CLERK_SECRET_KEY
#    - DATABASE_URL (Neon connection string)
#    - DIRECT_URL (Neon direct connection)
# 5. Click Deploy

# Vercel automatically runs:
# - npm install
# - npm run build
# - npx prisma migrate deploy (if migrations exist)
```

**Cost:**
- **Free:** Perfect for MVP
- **Pro ($20/mo):** Only if you need priority support (not needed yet)

### Alternative: Railway
- ✅ Also free, easy GitHub sync
- ❌ Deprecated free tier, now $5/month minimum
- ❌ Less Next.js-optimized

### Alternative: Self-host (DigitalOcean, Fly.io)
- ✅ More control
- ❌ More complexity, requires DevOps knowledge
- ❌ Not free ($5-25/month)

**Final choice: VERCEL — free, zero-config, Next.js-native.**

---

## 🔑 ENVIRONMENT VARIABLES CHECKLIST

### `.env.local` (Local Development)
Create this file with:

```dotenv
# Next.js
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxx...
CLERK_SECRET_KEY=sk_test_xxxx...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (Neon)
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/mirror_dev?schema=public&sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.neon.tech/mirror_dev?schema=public&sslmode=require"
```

### Vercel Environment Variables (Production)
Same as above, but with production URLs:

```
NEXT_PUBLIC_APP_URL=https://mirror.vercel.app
DATABASE_URL=production_neon_string
DIRECT_URL=production_neon_direct_string
CLERK keys for production app
```

### Missing Variables (Future Phases)
```dotenv
# Stripe (Phase 12 - Payments)
# STRIPE_PUBLIC_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...

# Market Data API (Phase 11 - Real prices)
# MARKET_DATA_API_KEY=...

# Email Service (Phase 8 - Notifications)
# SENDGRID_API_KEY=... or RESEND_API_KEY=...

# AWS S3 (Phase X - File uploads)
# AWS_S3_BUCKET=...
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

**Never commit `.env.local` to GitHub** — add to `.gitignore` (already there).

---

## ⚡ PERFORMANCE: OPTIMIZATION STRATEGY

### Database Optimization
**Already good:**
- ✅ Proper indexes on frequently queried fields (clerkId, role, status, publishedAt, riskProfile)
- ✅ Unique constraints (email, clerkId, strategy+assetClass pairs)
- ✅ Relationship includes scoped (not over-fetching)
- ✅ Batch operations for notifications (createMany)

**Potential future improvements:**
- Cache strategies list (ISR: revalidate every 60 seconds)
- Materialized views for performance dashboard
- Read replicas for analytics (when you have >10k users)

### Next.js Optimization
**Current:**
- ✅ Server components by default (less JavaScript sent to browser)
- ✅ API routes use server actions (no separate API layer)
- ✅ Image optimization via Next.js Image (when you add images)

**Recommendations for MVP:**
- Use `revalidatePath()` after mutations (ISR invalidation)
- Keep client components small and focused
- Use `Suspense` for slow-loading data
- Lazy-load non-critical components

### Example Optimization Pattern:
```typescript
// lib/db/repositories/strategy-repository.ts
async findPublished(filters?: StrategyFilters) {
  // Include relations selectively
  const strategies = await prisma.strategy.findMany({
    where: { status: 'PUBLISHED', ...filters },
    include: {
      allocations: true,        // only this strategy's allocations
      creator: { select: { id: true, firstName: true } }  // select fields, not *
    },
    take: 20,  // paginate, don't fetch all
  });
  return strategies;
}
```

### Monitoring
- **Free:** Vercel Analytics (included with Vercel)
- **Free:** Prisma Cloud metrics
- **Upgrade:** DataDog or New Relic when you have users

---

## 🔐 SECURITY: ARCHITECTURE & IMPLEMENTATION

### Already Secure (per Phase 13 audit in ARCHITECTURE.md)
- ✅ Clerk handles session management (no JWT in localStorage)
- ✅ Middleware blocks unauthenticated access to /learner/*, /creator/*, /admin/*
- ✅ Ownership checked server-side (IDOR prevention)
- ✅ Server-only repositories (Prisma client protected)
- ✅ Input validation via Prisma types + explicit field whitelists
- ✅ No raw SQL (parameterized queries only)
- ✅ Error sanitization (no stack traces to client)
- ✅ No secrets in browser code

### Server Actions Security Pattern
Every mutation must follow this:
```typescript
'use server'

import { requireAuth } from '@/lib/auth/session'
import { assertRole } from '@/lib/auth/roles'

export async function updateStrategy(id: string, data: UpdateStrategyInput) {
  // 1. Authenticate
  const user = await requireAuth()
  
  // 2. Authorize (role)
  await assertRole(user, 'CREATOR')
  
  // 3. Fetch & authorize (ownership)
  const strategy = await strategyRepo.findById(id)
  if (strategy.creatorId !== user.id) {
    throw new ForbiddenError('Not your strategy')
  }
  
  // 4. Validate input
  const validated = validateStrategyUpdate(data)
  
  // 5. Mutate
  return strategyRepo.update(id, validated)
}
```

### Security Checklist (for every feature)
- [ ] Is authentication required? (requireAuth)
- [ ] Is authorization required? (requireRole, ownership check)
- [ ] Is input validated server-side? (not just client)
- [ ] Are secrets protected? (no env vars in browser code)
- [ ] Is error handling safe? (no stack traces)
- [ ] Are DB queries parameterized? (Prisma only, no string concat)
- [ ] Is the mutation idempotent? (safe to retry)

### Rate Limiting
**MVP:** Clerk provides free rate limiting (per-user auth attempts)  
**Future:** Consider Upstash Redis ($0 for free tier) for API rate limits

### HTTPS & Encryption
- ✅ Vercel auto-enables HTTPS
- ✅ Neon requires SSL for connections (sslmode=require)
- ✅ Clerk uses encrypted tokens
- **Future:** Add database encryption at rest when you handle sensitive user data

---

## 💰 COST-EFFECTIVE MODEL SELECTION

### For MVP (Free Tier Only)

| Component | Recommendation | Cost | Why |
|-----------|---|---|---|
| **Frontend** | Vercel Free | $0 | 100GB bandwidth, unlimited deploys |
| **Database** | Neon Free | $0 | 10GB, always-free tier |
| **Authentication** | Clerk Free | $0 | 25k MAU, first-class Next.js support |
| **Search** | Prisma Client | $0 | No Elasticsearch needed for MVP |
| **Email** | None (Phase 8) | $0 | Skip for MVP, use in-app notifications |
| **Monitoring** | Vercel Analytics | $0 | Built-in with Vercel |
| **Storage** | None (Phase X) | $0 | Skip for MVP, no file uploads |
| ****TOTAL** | | **$0/month** | |

### Cost When You Add Monetization (Phase 12+)

| Component | Recommendation | Cost | When |
|-----------|---|---|---|
| **Payments** | Stripe | 2.9% + $0.30/txn | Phase 12 (subscriptions) |
| **Email** | Resend or SendGrid | $0-20/mo | Phase 8 (notifications) |
| **Database** | Neon Pro | $0.16/GB + $0.10/hr compute | When >10GB or high traffic |
| **Analytics** | Vercel Pro | $20/mo | When you need detailed metrics |
| **CDN** | Included (Vercel) | $0 | Automatic edge caching |

### Budget Strategy: **Start Free, Pay Only When You Scale**
- **Phase 1-7 (MVP):** $0/month
- **Phase 8-12 (Paid features):** ~$20-50/month (Stripe + Email + Analytics)
- **Phase 13+ (Scale):** ~$100-500/month (database, infrastructure)

### Avoid These Expensive Mistakes
❌ **Don't use:** Supabase (adds Auth costs), Firebase (lock-in), self-hosted (DevOps time)  
❌ **Don't add:** Datadog, Sentry, PagerDuty until you have users  
❌ **Don't upgrade:** Vercel Pro/Clerk Pro until you're revenue-positive  
❌ **Don't integrate:** Braintree, Zuora, custom payment processor (Stripe is simplest)

---

## 📊 RECOMMENDED TECH STACK SUMMARY

```
┌─────────────────────────────────────────────────────┐
│          MIRROR MVP TECH STACK (Free Tier)          │
├─────────────────────────────────────────────────────┤
│ Frontend:    Next.js 15 + React 19 + TypeScript     │
│ Styling:     Tailwind CSS 3.4 + shadcn/ui (future)  │
│ Database:    PostgreSQL (Neon) + Prisma ORM         │
│ Auth:        Clerk (25k MAU free)                    │
│ Deployment:  Vercel (100GB bandwidth free)          │
│ Monitoring:  Vercel Analytics (free)                 │
│ Testing:     Vitest + @testing-library (free)        │
│ Charts:      Recharts (free, lightweight)            │
│ Email:       SKIP (Phase 8, use Resend)              │
│ Payments:    SKIP (Phase 12, use Stripe)             │
│ Storage:     SKIP (Phase X, use Cloudflare R2)       │
│                                                      │
│ TOTAL COST:  $0/month (until Phase 12)               │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 MODEL SELECTION FOR LLM GENERATION

### For Code Generation (This Project)
**Use:** Claude 3.5 Sonnet (or GPT-4o)
- **Why:** Financial product = needs careful reasoning
- **Cost:** ~$0.003-0.01 per 1K tokens (cheap)
- **Alternative:** GPT-4o is slightly cheaper at $0.01/$0.03

### When to Use Cheap Models
- ✅ Tests and specs (use Claude 3 Haiku, $0.00025 per 1K input)
- ✅ Documentation (use Claude 3 Haiku)
- ✅ Refactoring existing code (use Claude 3 Haiku)
- ✅ Bug fixes (use Claude 3.5 Sonnet if complex)

### When to Use Premium Models
- ✅ Architecture decisions (use Claude 3.5 Sonnet)
- ✅ Security-sensitive code (use Claude 3.5 Sonnet)
- ✅ Database schema design (use Claude 3.5 Sonnet)
- ✅ Financial calculations (use Claude 3.5 Sonnet)

### Budget for Development
- **MVP development:** ~$50-100 in LLM credits
- **Per feature:** $5-15 depending on complexity
- **Monthly ongoing:** $20-30 for maintenance + improvements

**Recommendation: Use Sonnet for this project's complexity. ROI is worth it.**

---

## 🔄 MIGRATION & DEPLOYMENT CHECKLIST

### Local Setup (First Time)
```bash
# 1. Clone repo
git clone https://github.com/GabrielKelvin0/MIRROR.git
cd MIRROR

# 2. Install dependencies
npm install

# 3. Create .env.local with Clerk + Neon keys
cp .env.example .env.local
# Edit .env.local with your keys

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev --name init

# 6. Start dev server
npm run dev

# 7. Test
# - Open http://localhost:3000
# - Click "Sign Up"
# - Verify Clerk form appears
# - Sign up successfully
# - Check database: npx prisma studio
```

### First Deployment to Vercel
```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Connect on Vercel dashboard
# - Import project
# - Add environment variables (same as .env.local)

# 3. Vercel auto-runs:
# - npm run build
# - npx prisma migrate deploy
# - npm start

# 4. Verify
# - Visit https://mirror.vercel.app
# - Check Vercel logs for errors
```

### Database Backups
**Neon free tier includes:**
- ✅ Automatic daily backups (7-day retention)
- ✅ Point-in-time restore (24 hours)
- ❌ No manual backup control

**When to upgrade:** When you have >1 month of production data

---

## 📋 FINAL CHECKLIST BEFORE CODING

- [ ] Neon account created, connection string copied
- [ ] `.env.local` file created with Clerk + Neon keys
- [ ] `npx prisma migrate dev --name init` succeeds
- [ ] `npx prisma studio` opens successfully
- [ ] `npm run dev` starts without errors
- [ ] Vercel account linked to GitHub repo
- [ ] Environment variables added to Vercel
- [ ] First deploy to Vercel succeeds
- [ ] Clerk dashboard created production app keys
- [ ] Production `.env` added to Vercel
- [ ] Database is 100% configured and ready

**Once this checklist is complete, all 5 roadmap tasks can proceed in parallel.**

---

## ❓ COMMON SETUP QUESTIONS

**Q: Do I need a credit card for Neon?**  
A: No. Free tier is always free. You can add a card later if you exceed limits.

**Q: Can I change databases later (Neon → Supabase)?**  
A: Yes. Prisma is database-agnostic. Just export/import data.

**Q: Should I use TypeScript?**  
A: Yes, already configured. Catches bugs, improves DX.

**Q: Do I need Docker?**  
A: No, not for MVP. Vercel handles deployment.

**Q: How do I scale after MVP?**  
A: Same stack, just upgrade: Vercel Pro, Neon tier, Stripe Live.

**Q: What's the maximum free tier in Neon?**  
A: 3 projects, 10GB total, 0.5M compute hours/month. Usually enough for 10k+ users in test/demo mode.

---

## 🎬 NEXT STEP

**Start with PHASE 0 of ROADMAP.md** — configure `.env.local` and database.

Once database is running, all other tasks unlock.
