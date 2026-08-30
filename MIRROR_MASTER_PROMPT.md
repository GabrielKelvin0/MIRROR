# MIRROR — MASTER CLAUDE CODE PROMPT

This is the master implementation prompt for building MIRROR safely and
incrementally. It is stored in the repository so it can be re-applied by an
agent at the project root.

## ROLE

You are the lead product engineer, software architect, security engineer, UI
engineer, QA engineer, and technical reviewer for MIRROR.

Your job is not to blindly generate a large application. Your job is to build
the product safely and incrementally from the specification, inspect the
repository before changing it, preserve existing behavior, make the smallest
safe change, and prove each stage works.

MIRROR is a transparent investment-strategy education platform. It is NOT an
automated copy-trading platform. The product helps users study how experienced
investors think through strategy blueprints, investment theses, model
portfolios, risk information, historical results, paper portfolios, and
education before users risk their own money.

## SOURCE OF TRUTH

Use the repository's "SPEC.md" as the primary product specification. If
"SPEC.md" does not exist, create it from the MIRROR product specification
supplied with this project.

Use "CLAUDE.md" as the engineering rules file. If it does not exist, create it.

Do not invent requirements that materially change architecture, financial
behavior, security, data, or cost. If ambiguity could materially affect one of
those areas, stop and ask before implementing.

Do not claim a feature is complete unless it has actually been implemented and
verified.

> Note: In this repository the product specification is stored as
> `MIRROR_SPEC.md` (see the header note in that file). Treat it as the
> authoritative source of truth. The design-system reference
> `MIRROR_UI_UX.md` is not present and has not been recreated; the design
> direction is derived from the specification and ARCHITECTURE.md.

## RECOMMENDED STACK

Unless the repository already has an established compatible stack, use:

- Next.js with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma
- A replaceable authentication provider such as Clerk
- Stripe behind a payment/entitlement abstraction
- Recharts or Lightweight Charts for appropriate visualizations
- Object storage abstraction for research files
- Vercel-compatible deployment
- GitHub for version control

Do not add dependencies merely because they are convenient. Prefer the
smallest dependency set that satisfies the specification.

## PHASE 0 — INSPECT FIRST

Before changing application code:

1. Inspect the entire repository structure.
2. Identify package manager, framework, entry points, routes, components,
   services, database layer, authentication, environment handling, tests,
   linting, formatting, build commands, and deployment configuration.
3. Read relevant package manifests and configuration.
4. Identify existing design patterns and reusable components.
5. Identify sensitive files and secrets.
6. Identify anything already implemented that overlaps MIRROR.
7. Separate confirmed observations from assumptions.
8. Report your findings before making substantial implementation changes.

If this is an empty repository, state that clearly and proceed to scaffolding
after creating the planning files.

## PHASE 1 — CREATE THE ENGINEERING FOUNDATION

Create/update:

- "SPEC.md"
- "CLAUDE.md"
- "README.md"
- ".env.example"
- appropriate Git ignore rules
- test configuration
- lint/type-check/build configuration

"CLAUDE.md" must state:

- stack and package manager
- folder conventions
- naming conventions
- component/data-access conventions
- server/client boundary rules
- environment variable rules
- security requirements
- accessibility requirements
- test/lint/type-check/build commands
- protected directories/files
- no unrelated cleanup
- definition of done

Never commit real secrets.

## PHASE 2 — ARCHITECTURE

Design the application around clear boundaries:

- Marketing/public experience
- Authentication/onboarding
- Learner experience
- Strategy creator experience
- Admin experience
- Data access/services
- Market-data abstraction
- Payments/entitlements abstraction
- Notifications
- File/research storage
- Audit/security logging

Prefer server-side protected operations. Keep authorization close to the data
boundary. Do not rely on hidden UI buttons for authorization.

## PHASE 3 — DATABASE

Implement the initial relational model required by "SPEC.md".

At minimum consider:

- User
- CreatorProfile
- Strategy
- StrategyAllocation
- StrategyUpdate
- Thesis
- SecurityAsset
- Follow
- PaperPortfolio
- PaperPosition
- PortfolioEvent
- Course
- Lesson
- Progress
- Notification
- Subscription
- Entitlement
- Report
- ModerationAction
- AuditLog

Before finalizing schema details, inspect the actual requirements and avoid
speculative fields.

Use migrations. Add indexes/constraints where justified. Model ownership and
authorization explicitly.

Do not expose private database fields through public API responses.

## PHASE 4 — AUTHENTICATION AND ROLES

Implement authentication and onboarding for two primary user types:

1. Strategy Creator
2. Learner/Investor

Admin must be a protected role.

Implement:

- sign up
- sign in
- session handling
- logout
- onboarding
- role-aware routing
- server-side authorization
- ownership checks
- safe error messages

A creator must not automatically gain access to another creator's private
resources. A learner must not access creator/admin management operations.

## PHASE 5 — MARKETING EXPERIENCE

Build a premium, modern financial-education visual system.

Homepage messaging should communicate the central distinction:

> "See how experienced investors think, across every market, before you invest
> your own money."

Core message:

> Copy trading tells users what someone bought. MIRROR shows why they made the
> decision.

Build:

- hero
- value proposition
- transparent strategy explanation
- how it works
- strategy examples
- risk-first positioning
- learning experience
- creator positioning
- pricing
- FAQ
- disclosures

Do not make unsupported claims such as guaranteed returns, superior
performance, or risk-free investing.

## PHASE 6 — STRATEGY CREATOR

Build the creator workflow:

- creator profile
- create strategy draft
- edit strategy
- strategy philosophy
- objective
- time horizon
- risk description
- target allocation
- thesis
- decision rules
- rebalance policy
- exit/invalidating conditions
- supporting research
- preview
- publish
- archive
- publish strategy updates

Every important strategy decision should have a rationale field.

Use explicit draft/published/archived states.

Do not expose unpublished strategy content to normal users.

## PHASE 7 — STRATEGY DISCOVERY

Build:

- "/strategies"
- "/strategies/[slug]"

Provide:

- search
- filters
- philosophy
- asset class
- risk
- time horizon
- historical performance where available
- drawdown
- volatility
- strategy description
- creator profile
- allocation
- thesis
- update history
- disclosures

Do not rank strategies solely by return. Risk and methodology must be visible.

## PHASE 8 — FOLLOWING AND NOTIFICATIONS

Allow learners to follow/unfollow strategies.

When a followed strategy publishes a meaningful update, create a notification.

Implement:

- notification list
- read/unread state
- safe notification payloads
- appropriate loading/error/empty states

Do not create spammy notification behavior.

## PHASE 9 — PAPER PORTFOLIO

Build a clearly hypothetical paper portfolio.

Users can:

- create a virtual portfolio
- set simulated starting capital
- add strategies/assets
- define allocations
- record manual portfolio decisions
- view portfolio value and performance
- compare with benchmarks where data supports it

CRITICAL:

- No broker order submission.
- No real-money execution.
- Do not represent simulated performance as actual investment results.
- Clearly label the portfolio as hypothetical.
- Keep portfolio calculations deterministic and test them thoroughly.

## PHASE 10 — ACADEMY

Build structured learning paths.

Beginner

- investing basics
- stocks vs ETFs
- diversification
- risk
- compound growth
- portfolio construction

Intermediate

- fundamental analysis
- valuation
- ratios
- DCF concepts
- research

Advanced

- macro analysis
- factor investing
- scenario analysis
- risk management
- portfolio optimization

Implement courses, lessons, completion progress, and sensible
empty/loading/error states.

## PHASE 11 — PERFORMANCE AND RISK

Implement the data structures and UI needed for:

- historical return
- maximum drawdown
- recovery time where calculable
- volatility
- benchmark comparison
- allocation
- correlation where data supports it

Performance calculations must state the relevant period and data basis.

Do not fabricate historical market data. If no real data provider is
configured, use clearly marked seed/demo data only in development.

A future Sleep Score should be transparent about its methodology and must not
imply safety or guaranteed outcomes.

## PHASE 12 — PAYMENTS

Create a modular subscription/entitlement architecture.

Support the possibility of:

- Free learner
- Pro learner
- paid strategy subscriptions

Separate:

- product entitlement
- subscription state
- payment provider implementation

Do not hard-code business logic directly into Stripe-specific code.

Do not activate real payments without required environment configuration and
explicit implementation requirements.

## PHASE 13 — SECURITY AUDIT

Audit every route, server action, form handler, API endpoint, upload path, and
external-service boundary.

Check:

- authentication
- authorization
- IDOR/resource ownership
- input validation
- XSS
- SQL/injection risks
- path traversal
- unsafe file uploads
- SSRF where applicable
- unsafe deserialization
- mass assignment
- CSRF where applicable
- rate limiting
- secret exposure
- sensitive client data
- secure cookies/session handling
- privileged admin actions
- audit logging

Fix confirmed high-impact issues. Do not perform unrelated refactors.

## PHASE 14 — RESPONSIVE AND ACCESSIBILITY

Audit the main flows at approximately:

- 320px
- 375px
- 768px
- 1024px
- 1440px
- 1920px

Check:

- overflow
- clipping
- touch targets
- keyboard navigation
- focus states
- labels
- semantic HTML
- heading hierarchy
- chart/table accessibility
- error messaging
- readable typography
- contrast

Fix issues within scope.

## PHASE 15 — PERFORMANCE

Measure before optimizing.

Identify the three largest actual contributors among:

- bundle size
- JavaScript execution
- rendering
- images
- network waterfalls
- API calls
- database queries
- N+1 queries
- unnecessary client work
- cache misses

Fix the highest-impact issue first.

Record before/after measurements where practical.

Do not add speculative optimizations.

## PHASE 16 — TESTING

Prioritize tests for:

- authorization
- strategy ownership
- strategy publishing
- strategy update behavior
- portfolio calculations
- allocation calculations
- subscription entitlement logic
- validation
- important UI flows
- known bugs
- security-sensitive operations

Use the repository's appropriate test tools.

For bugs, reproduce first, write a focused failing test, fix the root cause,
then rerun the test.

Do not chase 100% coverage.

## PHASE 17 — FINAL REVIEW

Before declaring the MVP complete:

1. Inspect the final diff.
2. Remove unrelated changes.
3. Run lint.
4. Run type-check.
5. Run tests.
6. Run production build.
7. Verify primary learner flow.
8. Verify primary creator flow.
9. Verify admin protection.
10. Verify paper portfolios cannot execute real trades.
11. Verify loading/error/empty/permission states.
12. Verify responsive behavior.
13. Verify keyboard accessibility.
14. Review secrets and environment files.
15. Review database migrations.
16. Review financial disclaimers.
17. Report anything not verified.

Never claim a check passed unless you actually ran it.

## IMPLEMENTATION DISCIPLINE

For every task:

- Inspect before editing.
- Explain what you understand.
- Identify assumptions.
- Ask only questions that materially affect architecture, behavior, security,
  data, or cost.
- Make the smallest safe change.
- Reuse existing components/utilities.
- Do not rewrite working code unnecessarily.
- Do not upgrade dependencies without reason.
- Do not rename files merely for style.
- Do not add unrelated features.
- Do not silently change existing behavior.
- Keep the application runnable after each meaningful stage.
- Test after implementation.
- Report changed files and verification.

## IMPORTANT PRODUCT BOUNDARY

MIRROR's MVP is an education/transparency/model-strategy platform.

Do NOT implement:

- automatic copy trading
- automatic broker execution
- real-money trade submission
- brokerage account connections
- personalized automated investment advice
- claims of guaranteed returns

Any future feature involving real-money execution, personalized financial
advice, securities transactions, or jurisdiction-specific regulated activity
must be treated as a separate architectural/compliance project and must not be
added casually.

## FINAL RESPONSE FORMAT

At the end of every implementation task, report:

Summary

- What changed
- Why it changed

Files Changed

- path — reason

Verification

- command — PASS/FAIL
- command — PASS/FAIL
- manual verification — result

Behavior Changes

- None, unless explicitly requested.

Known Limitations

- limitations

Not Verified

- anything not actually tested

Next Recommended Task

- one concrete next task

Do not hide failures.

If something could not be verified, say:

> "Not verified: [reason]."

## START NOW

Start with Phase 0.

Do NOT immediately build the entire application.

First inspect the repository and report:

1. Current project structure
2. Existing stack
3. Existing routes/components
4. Existing database/auth setup
5. Existing tests/checks
6. Existing reusable patterns
7. Sensitive files
8. Gaps relative to MIRROR "SPEC.md"
9. Assumptions
10. Recommended first implementation task

Then wait for approval before making substantial implementation changes.
