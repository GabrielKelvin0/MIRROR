# MIRROR — SPEC

This is the authoritative product specification for MIRROR.

For engineering standards, see CLAUDE.md.
For application architecture, see ARCHITECTURE.md.

Note: two historical implementation/design documents referenced in earlier
phases — MIRROR_CODEX_PROMPT.md (build phases) and MIRROR_UI_UX.md (design
system) — are not currently present in this repository. This specification
remains the source of truth for product requirements; no replacement
documents have been fabricated in their place. Phased implementation work is
driven by MIRROR_MASTER_PROMPT.md.

Refer to this document before adding features or modifying existing behavior.

---

## Product

**MIRROR**

A transparent investment strategy education platform.

---

## Working Tagline

> See how experienced investors think, across every market, before you invest your own money.

---

## Product Category

Transparent Investment Strategy Education Platform

(NOT: Broker, Execution Platform, Copy-Trading, Signal Service, Gambling Platform)

---

## Vision

MIRROR is a social investment education and strategy-transparency platform.

Experienced investors publish their investment methodologies, model portfolios, research, investment theses, risk frameworks, and strategy updates.

Learners study these strategies, understand why decisions were made, follow strategies, build hypothetical paper portfolios, compare investment philosophies, and learn investment principles—all before risking their own money.

MIRROR is deliberately NOT traditional copy trading. Traditional copy trading answers:

> "What did this investor buy?"

MIRROR answers:

> "Why did this investor make that decision?"

The methodology is the product.

The platform should encourage learning, independent thinking, research, risk awareness, and informed decision-making.

---

## Core Product Principles

1. **Transparency over secrecy** — Investors reveal their thinking
2. **Education over blind copying** — Users learn why decisions are made
3. **Risk awareness over return chasing** — Risk metrics are visible
4. **Methodology over hype** — Strategy reasoning is primary
5. **Historical evidence over unsupported claims** — Data is labeled clearly
6. **Simulation before real capital** — Paper portfolios are completely safe
7. **Clear disclosures** — Legal and product disclaimers are prominent
8. **Independent decision-making** — No manipulative trading mechanics

---

## User Types

### Learner

Users who want to learn about investing and study experienced investors.

**Learners can:**
- Browse strategies
- Search strategies
- Filter strategies
- View investor profiles
- Read investment theses
- Study strategy allocations
- Follow strategies
- Receive strategy updates
- Create paper portfolios
- Compare strategies
- Study educational content
- Track learning progress
- Analyze historical performance

---

### Strategy Creator

Experienced investors who publish strategies.

**Creators can:**
- Create investment strategies
- Define investment philosophy
- Define risk profile
- Define investment horizon
- Create model allocations
- Publish investment theses
- Explain investment decisions
- Publish strategy updates
- Upload supporting research
- Create educational content
- Respond to learner questions
- Monitor strategy analytics

Creators should eventually be able to monetize premium strategies (Phase 16+).

---

### Administrator

Platform operators who manage the platform.

**Admins can:**
- Manage users
- Review creators
- Moderate strategy content
- Review reports
- Manage platform content
- Manage educational content
- Review suspicious activity
- View audit logs
- Manage platform configuration

Admin functionality must be protected server-side.

---

## Core Differentiator

MIRROR should NOT feel like a brokerage platform.

It should feel like:

> A combination of investment research platform + investor education platform + strategy marketplace + simulation environment.

The visual experience should communicate intelligence, transparency, patience, and research.

**Avoid:**
- Casino-style UI
- Excessive neon colors
- "Get rich quick" language
- Fake urgency
- Countdown timers
- Pump-style messaging
- Overly aggressive profit displays
- Blind-copying language

---

## MVP Feature Set

The MVP should include:

1. Marketing website
2. Authentication (sign up, sign in, sign out)
3. User onboarding
4. Learner profiles
5. Strategy creator profiles
6. Strategy creation and editing
7. Strategy publishing
8. Strategy marketplace (search, filter, discover)
9. Strategy detail pages
10. Investment theses
11. Model allocations
12. Strategy updates
13. Strategy following
14. Notifications
15. Paper portfolios
16. Historical performance display (where reliable data exists)
17. Risk metrics (where data exists)
18. Academy (learning content)
19. Learning progress tracking
20. Subscription/entitlement architecture
21. Creator dashboard
22. Admin dashboard
23. Security controls
24. Responsive design
25. Accessibility
26. Testing infrastructure

---

## Features Outside MVP

Do NOT implement these in the first version:

- Automatic copy trading
- Automatic trade execution
- Brokerage integration
- Real-money portfolio execution
- Personalized automated investment advice
- Interactive DCF modeling
- Advanced backtesting arena
- Fractional-share thematic baskets
- Complex social/community systems

These can become future versions after legal/compliance review.

---

## Financial Product Guardrails

MIRROR MVP focuses on education and transparency, NOT execution:

### ✅ Allowed
- Strategy publication and sharing
- Historical strategy analysis
- Paper portfolio simulation
- Educational content
- Risk metrics and analysis

### ❌ Not Allowed
- Automatic trade execution
- Broker integration
- Copy trading
- Real-money management
- Guaranteed return claims

Before introducing real-money execution or regulated financial services, the product must receive appropriate legal/compliance review for intended jurisdictions.

Performance must never be presented as guaranteed.

---

## MVP Acceptance Criteria

**A learner can:**
- Register
- Complete onboarding
- Discover strategies
- Search strategies
- Filter strategies
- Open a strategy
- Read the thesis
- Understand allocation
- Review risk
- Follow a strategy
- Add it to a paper portfolio
- Receive updates
- Learn through Academy

**A creator can:**
- Register
- Complete creator onboarding
- Create a profile
- Create a strategy
- Save a draft
- Preview it
- Publish it
- Publish updates
- Manage strategies

**Admin can:**
- Access admin dashboard
- Manage users
- Moderate content
- Review reports

**Security:**
- Unauthorized users cannot access protected resources
- Users cannot modify resources they do not own
- Admin routes are protected

**Paper portfolio:**
- Never submits real trades
- Is clearly labeled simulated/hypothetical

---

## Technical Stack

**Preferred:**

- Frontend: Next.js + TypeScript
- UI: Tailwind CSS + shadcn/ui (Phase 6)
- Database: PostgreSQL
- ORM: Prisma
- Authentication: Clerk (replaceable)
- Payments: Stripe (behind abstraction)
- Charts: Recharts or Lightweight Charts
- Storage: S3-compatible
- Deployment: Vercel-compatible
- Version control: GitHub

---

## Security

Validate all user-controlled input.

Protect against:
- XSS
- Injection
- IDOR (Insecure Direct Object Reference)
- Path traversal
- Unsafe uploads
- SSRF
- Unsafe deserialization
- Mass assignment
- CSRF
- Unauthorized resource access
- Secret exposure

Protect:
- API keys
- Database credentials
- Authentication secrets
- Payment secrets
- Private research files

Never expose secrets to browser code.

---

## Definition of Done

A feature is complete only when:

- Requested behavior works
- Existing unrelated behavior is preserved
- Authorization is correct
- Inputs are validated
- Secrets are protected
- Loading states exist where appropriate
- Error states exist where appropriate
- Empty states exist where appropriate
- Tests/checks exist where meaningful
- Type checking passes
- Linting passes
- Build passes
- Responsive behavior is acceptable
- Accessibility is acceptable
- Security boundaries are verified
- No unrelated files were modified
- Known limitations are reported

If something cannot be verified:

> Not verified: [reason]

Never claim verification that did not happen.
