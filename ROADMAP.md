# ROADMAP — MIRROR MVP
**Priority Order | Estimated Effort | Blocking Dependencies**

---

## 🚨 PHASE 0: UNBLOCK (Do This First — 2-3 hours)

### Task 0.1: Configure Environment & Database
**Status:** 🔴 BLOCKING  
**Time:** 30-45 min  
**Files to modify:** `.env.local` (create)

**What:**
- [ ] Create `.env.local` from `.env.example`
- [ ] Get Clerk keys (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
- [ ] Configure database URL (Neon or Supabase recommended)
- [ ] Test connection: `npx prisma db push` or `npx prisma migrate dev --name init`

**Why it's a priority:**
- Nothing else can run without this
- Unblocks database initialization
- Required for local dev server

**Connection to vision:**
- Establishes persistent data layer for all features

**Cost-effective choice:**
- **Database:** Use **Neon** (free tier: 3 projects, 10GB, always-free allowance)
  - Better than Supabase for learning projects (Supabase charges after free tier exhaustion)
  - PostgreSQL-native, direct Prisma support
  - No credit card required for free tier
- **Alternative:** Railway or Render.com (also free, but cold-start latency)

---

## 🥇 TASK 1: Create Public Homepage (Marketing Website)
**Status:** 🔴 BLOCKED (needs env setup)  
**Time:** 4-6 hours | ~500 lines  
**Depends on:** PHASE 0  
**Files to create:**
- `app/(public)/layout.tsx`
- `app/(public)/page.tsx` (homepage)
- `components/marketing/Navbar.tsx`
- `components/marketing/Hero.tsx`
- `components/marketing/ValuePillars.tsx`
- `components/marketing/CTA.tsx`
- `components/marketing/Footer.tsx`

**What:**
- Landing page hero section ("See how experienced investors think...")
- Three value pillars: Methodology, Transparency, Education
- Call-to-action (Sign Up / Explore Strategies)
- Navigation bar (Logo, Links to /strategies, /how-it-works, /about)
- Footer with disclosures and legal links
- Fully responsive, mobile-first design

**Why it's a priority:**
- **Conversion funnel starts here** — every user lands here first
- **MVP acceptance criteria #1:** Learner can discover platform
- **Marketing payload:** Communicates MIRROR's differentiation
- **Foundation for Phase 5** (sample strategies discovery)
- **Lowest tech debt:** Pure React, no DB required initially

**How it connects:**
- Drives learners to `/strategies` (discovery)
- Drives creators to sign-up/creator-onboarding
- Sets tone for entire product

**Implementation notes:**
- Use Tailwind utility-first (no new components)
- Keep typography consistent with `app/globals.css`
- Make CTA buttons link to `/sign-up` and `/strategies`
- Add disclaimers: "Educational content only. Not investment advice."

---

## 🥈 TASK 2: Implement Strategy Discovery (Search + Filter + List)
**Status:** 🔴 BLOCKED (needs homepage first)  
**Time:** 5-7 hours | ~600 lines  
**Depends on:** TASK 1 + Database setup  
**Files to create:**
- `app/(public)/strategies/page.tsx` (discovery page)
- `app/(public)/strategies/[slug]/page.tsx` (detail page)
- `components/marketing/StrategyCard.tsx`
- `components/marketing/StrategyFilters.tsx`
- `components/marketing/StrategyDetail.tsx`
- `lib/data/sample-strategies.ts` (seed data)
- `lib/services/strategy-discovery.ts` (search/filter logic)

**What:**
- `/strategies` — grid of published strategies with filtering
  - Filters: Philosophy, Asset Class, Risk Profile, Time Horizon
  - Search box (full-text on name + description)
  - Sort by: Risk (default), Return, Volatility, Created Date
  - **CRITICAL:** Never sort by return alone
- `/strategies/[slug]` — strategy detail with:
  - Creator profile snapshot
  - Investment thesis
  - Allocation breakdown (pie/bar chart)
  - Risk metrics (drawdown, volatility)
  - Performance history (with "demo data" label)
  - Update history
  - "Follow" button
  - Disclaimers ("Hypothetical. Not investment advice.")

**Why it's a priority:**
- **MVP acceptance criteria #2:** "Learner can discover strategies"
- **Core product feature** — strategy marketplace is MIRROR's reason for existing
- **Unblocks paper portfolio workflow** (learners follow strategies)
- **Foundation for Phase 6** (creator-built strategies)
- **Phase 7 requirement** per ARCHITECTURE.md

**How it connects:**
- Learners browse → follow strategy → add to paper portfolio
- Creators see their published strategies here
- Data-driven from database (after Phase 6 creator workflow is live)

**Implementation notes:**
- Start with **seed/demo data** in `lib/data/sample-strategies.ts`
- Pure filter/search logic in `lib/services/strategy-discovery.ts` (unit-tested)
- Use Recharts for allocation pie chart (lightweight, no external API)
- Every metric must show period + data basis ("Demo data — not real market data")
- Accessibility: proper heading hierarchy, skip link, ARIA labels

**Cost-effective choice:**
- No external charting library (Recharts is lightweight)
- No API calls (seed data only for MVP)
- Zero additional dependencies needed

---

## 🥉 TASK 3: Set Up Authentication Routes & Onboarding
**Status:** 🔴 BLOCKED (needs env setup)  
**Time:** 3-4 hours | ~350 lines  
**Depends on:** PHASE 0 + Clerk config  
**Files to create:**
- `app/(auth)/sign-in/[[...sign-in]]/page.tsx` (Clerk component)
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx` (Clerk component)
- `app/(auth)/callback/route.ts` (sync user to DB after signup)
- `app/(public)/onboarding/page.tsx` (role selection)
- `lib/db/repositories/user-repository.ts` (find/create user from clerkId)
- `lib/auth/session.ts` (server-only auth helpers)
- `lib/auth/roles.ts` (role authorization)

**What:**
- `/sign-in` — Clerk sign-in form (Clerk handles UI)
- `/sign-up` — Clerk sign-up form
- Post-signup redirect to `/onboarding`
- Onboarding flow: "Are you a Learner or Creator?"
  - Sets `User.role` (LEARNER or CREATOR)
  - Redirects to `/learner/dashboard` or `/creator/dashboard`
- Server-side session helpers for protected routes
- User sync: when Clerk creates user, sync to MIRROR User table

**Why it's a priority:**
- **MVP acceptance criteria #3:** "Learner can register"
- **Unblocks all protected features** (learner, creator, admin dashboards)
- **Critical for security** — role-based access control
- **Foundational pattern** for all future auth

**How it connects:**
- Every protected route depends on this
- Establishes user identity (Clerk ↔ MIRROR DB mapping)
- Enables ownership checks (your portfolio, your strategies)

**Implementation notes:**
- Clerk provides sign-in/sign-up UI — don't build from scratch
- Post-signup: `POST /api/auth/callback` syncs clerkId → User.id
- `requireAuth()` and `requireRole()` in `lib/auth/session.ts` (reusable)
- Add "Skip to main content" link for a11y
- Test: sign up → onboarding → redirect to dashboard

**Cost-effective choice:**
- Use Clerk's hosted UI (no custom auth forms)
- Leverage Clerk's free tier (25,000 MAU)

---

## 🏅 TASK 4: Build Learner Dashboard & Portfolio UI
**Status:** 🔴 BLOCKED (needs TASK 3)  
**Time:** 6-8 hours | ~700 lines  
**Depends on:** TASK 3 + Database setup  
**Files to create:**
- `app/(learner)/layout.tsx` (sidebar + nav)
- `app/(learner)/dashboard/page.tsx` (learner entry)
- `app/(learner)/portfolio/page.tsx` (list portfolios)
- `app/(learner)/portfolio/[id]/page.tsx` (portfolio detail)
- `app/(learner)/following/page.tsx` (strategies I follow)
- `app/(learner)/notifications/page.tsx` (updates)
- `app/(learner)/academy/page.tsx` (learning paths)
- `components/learner/PortfolioCard.tsx`
- `components/learner/PortfolioForm.tsx`
- `components/learner/AllocationManager.tsx`
- `lib/db/repositories/portfolio-repository.ts`
- `lib/services/portfolio-rules.ts` (valuation + allocation logic)

**What:**
- Learner dashboard: Overview of portfolios, followed strategies, learning progress
- Portfolio list: Cards showing portfolio name, value, allocation
- Portfolio detail: Full portfolio view with:
  - Starting capital, current value, cash balance
  - Strategy allocations (% breakdown)
  - Positions (manual adds)
  - Performance metrics (return, drawdown, volatility)
  - Add/edit/delete controls
- Paper portfolio **never accepts real trades** — calculation-only
- All figures clearly labeled "Simulated/Hypothetical"

**Why it's a priority:**
- **MVP acceptance criteria #4:** "Learner can create paper portfolios"
- **Core value prop** — learn by simulating strategies
- **Unblocks notifications** (portfolio gets updates from followed strategies)
- **Phase 9 feature** per ARCHITECTURE.md
- **Demonstrates education focus** (simulation, not execution)

**How it connects:**
- Learner discovers strategies → follows them → builds portfolio around them
- Portfolio receives notifications when followed strategy updates
- Portfolio shows hypothetical performance (Phase 11 / Performance & Risk)

**Implementation notes:**
- Allocation total must cap at 100% (validation in `portfolio-rules.ts`)
- Positions: ticker symbol, quantity, entry price, current price (seed data initially)
- Performance: use demo data (clearly labeled)
- Use server components for data fetching, client components for interactions
- Ownership enforcement: can only view/edit own portfolio

**Cost-effective choice:**
- No real market data API (use seed data for MVP)
- Recharts for simple charts (already listed in package.json alternatives)
- No external portfolio analytics service

---

## 🎖️ TASK 5: Creator Strategy Workflow (Create → Publish → Update)
**Status:** 🔴 BLOCKED (needs TASK 3)  
**Time:** 7-9 hours | ~800 lines  
**Depends on:** TASK 3 + Database setup  
**Files to create:**
- `app/(creator)/layout.tsx` (creator nav)
- `app/(creator)/dashboard/page.tsx` (creator entry)
- `app/(creator)/strategies/page.tsx` (my strategies list)
- `app/(creator)/strategies/new/page.tsx` (create strategy)
- `app/(creator)/strategies/[id]/edit/page.tsx` (edit draft)
- `app/(creator)/strategies/[id]/preview/page.tsx` (preview before publish)
- `app/(creator)/strategies/[id]/updates/new/page.tsx` (publish update)
- `components/creator/StrategyForm.tsx`
- `components/creator/AllocationManager.tsx`
- `components/creator/UpdateForm.tsx`
- `lib/db/repositories/strategy-repository.ts`
- `lib/services/strategy-rules.ts` (validation, state transitions)

**What:**
- Creator dashboard: Overview of strategies, followers, analytics
- Strategy list: Filter by draft/published/archived
- Create strategy form:
  - Name, description, philosophy, objective
  - Risk profile (LOW/MODERATE/HIGH)
  - Time horizon (e.g., "5-10 years")
  - Investment thesis
  - Decision rules, rebalance policy, exit conditions
  - Save as draft (ownership auto-set to creator)
- Allocation manager:
  - Add asset classes (e.g., "US Large Cap", "International", "Bonds")
  - Set target weights (sum must = 100%)
  - Add reasoning for each allocation
- Preview: See strategy as learners will see it
- Publish: Transition draft → PUBLISHED (publishedAt timestamp set)
- Strategy updates:
  - Title + description
  - Changes summary ("Reduced tech from 25% to 15%")
  - Reasoning
  - Risk assessment
  - Effective date
  - Publishes notification to all followers

**Why it's a priority:**
- **MVP acceptance criteria #5:** "Creator can create + publish strategy"
- **Core feature** — strategy creation is MIRROR's supply side
- **Unblocks strategy discovery** (learners see published strategies)
- **Unblocks notifications** (updates trigger fan-out to followers)
- **Phase 6 feature** per ARCHITECTURE.md
- **Demonstrates education model** (methodology is core, not returns)

**How it connects:**
- Creator builds strategy → publishes → learners discover it → learners follow it
- Followers get notified of updates
- Learners build portfolios around strategies
- System validates strategy ownership (creator can only edit own)

**Implementation notes:**
- State machine: DRAFT → PUBLISHED → ARCHIVED (can't go backward)
- Ownership: only creator can edit unpublished strategies
- Allocation validation: server-side in `strategy-rules.ts` (100% cap enforcement)
- Update publication: fan-out notification to all followers (batch create)
- Use forms with client-side validation (UX) + server-side validation (security)
- Show loading/error/success states

**Cost-effective choice:**
- No external strategy validation API
- No market data provider (yet)
- Pure business logic (can be unit-tested without DB)

---

## 📊 EFFORT & DEPENDENCY MATRIX

```
Phase 0 (Unblock)
  └─ 30-45 min
  
Task 1 (Homepage)
  ├─ Depends: Phase 0 ✓
  ├─ Time: 4-6 hours
  └─ Enables: Task 2
  
Task 2 (Strategy Discovery)
  ├─ Depends: Task 1, Phase 0 ✓
  ├─ Time: 5-7 hours
  └─ Enables: Task 3 (show strategies to choose for portfolio)
  
Task 3 (Auth + Onboarding)
  ├─ Depends: Phase 0 ✓
  ├─ Time: 3-4 hours
  └─ Enables: Task 4, Task 5
  
Task 4 (Learner Dashboard)
  ├─ Depends: Task 3, Phase 0 ✓
  ├─ Time: 6-8 hours
  └─ Enables: Notifications, Academy
  
Task 5 (Creator Workflow)
  ├─ Depends: Task 3, Phase 0 ✓
  ├─ Time: 7-9 hours
  └─ Enables: Admin moderation, Analytics
```

**Total MVP Time: ~30 hours of focused development**

---

## 🎯 WHY THIS ORDER?

1. **Phase 0 unblocks everything** — no code works without env/DB
2. **Task 1 is the "top of funnel"** — everyone sees this first
3. **Task 2 validates product differentiation** — shows why MIRROR is different (methodology-first, risk-forward)
4. **Task 3 enables protected workflows** — both learner and creator need auth
5. **Task 4 and 5 in parallel** — learners and creators need each other:
   - Learners need strategies to follow (Task 5 supplies)
   - Creators need to know strategies are discovered (Task 4 shows impact)

---

## ✅ WHEN EACH TASK IS "DONE"

### Phase 0
- [ ] `.env.local` configured with real Clerk keys
- [ ] Database URL working (`prisma db push` succeeds)
- [ ] Local dev server starts without env errors

### Task 1
- [ ] Homepage renders at `/`
- [ ] All sections visible on desktop + mobile
- [ ] Links work (nav to /strategies, /how-it-works, /about, /sign-up)
- [ ] Tailwind styling matches design intent
- [ ] Accessibility: skip link, heading hierarchy, contrast OK
- [ ] Mobile-responsive: 320px–1920px widths

### Task 2
- [ ] `/strategies` page renders and filters work (search, philosophy, risk, etc.)
- [ ] `/strategies/[slug]` detail page renders correctly
- [ ] Filters show correct subset of strategies
- [ ] Sort order correct (default: risk, never by return alone)
- [ ] Charts render (allocation pie, performance line)
- [ ] Disclaimers visible ("Demo data", "Not investment advice")
- [ ] Mobile-responsive

### Task 3
- [ ] Sign-in form works (Clerk)
- [ ] Sign-up form works (Clerk)
- [ ] Post-signup redirect to onboarding
- [ ] Onboarding sets role (LEARNER or CREATOR)
- [ ] Redirect to appropriate dashboard after onboarding
- [ ] User created in database (`User` table)
- [ ] `requireAuth()` and `requireRole()` work server-side

### Task 4
- [ ] Learner dashboard renders
- [ ] Portfolio list shows all user's portfolios
- [ ] Create new portfolio form works (saves to DB)
- [ ] Edit portfolio form works
- [ ] Delete portfolio works (soft or hard delete, confirmed)
- [ ] Portfolio detail page shows allocation, positions, performance
- [ ] Add/remove positions works
- [ ] All values clearly labeled "Hypothetical/Simulated"
- [ ] Mobile-responsive

### Task 5
- [ ] Creator dashboard renders
- [ ] "Create strategy" form works (saves as DRAFT)
- [ ] Edit strategy works (draft only, ownership enforced)
- [ ] Allocation manager works (100% cap enforced)
- [ ] Preview before publish works
- [ ] Publish button works (status → PUBLISHED, publishedAt set)
- [ ] Published strategy appears in learner discovery
- [ ] Strategy update form works
- [ ] Publishing update sends notifications to followers
- [ ] Mobile-responsive

---

## 🚀 AFTER MVP (Future Phases)

Once these 5 tasks are done:

- **Task 6:** Academy (learning paths)
- **Task 7:** Admin Dashboard (moderation)
- **Task 8:** Notifications & Email
- **Task 9:** Performance & Risk Metrics
- **Task 10:** Subscription/Payments (Stripe)
- **Task 11:** Search Optimization
- **Task 12:** Mobile App (React Native, optional)

---

## 💡 KEY PRINCIPLES FOR EXECUTION

1. **Ship incrementally** — each task should be launchable independently
2. **Database first** ��� write repositories before components
3. **Test business logic** — especially ownership, allocations, role checks
4. **Security by default** — never trust client input
5. **Mobile first** — design for 320px width, then scale up
6. **Accessibility always** — keyboard nav, screen readers, contrast
7. **Demo data clearly labeled** — never mislead about real/simulated
8. **Disclaimers everywhere** — education only, not investment advice
