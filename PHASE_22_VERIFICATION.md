# Phase 22 verification record

Branch: `phase-22-paper-portfolio-maturity`, stacked on the unmerged Phase 21 branch.

## Implemented behavior

- Add/edit/remove/rebalance allocation mutations record strategy ID/name snapshots, before/after percentages, allocation/reserve totals, and learner reasoning.
- All allocation writes lock the owned portfolio in a Read Committed transaction. Weight changes, history, and simulated valuation commit or roll back together.
- Multi-strategy rebalances require a complete current mix and explanation; stale IDs/expected weights, duplicate strategies, no-op changes, invalid numbers, and totals above 100% are rejected.
- Existing unpublished targets may be reduced or removed; increases require a published strategy. The older single-weight edit path also requires an explanation.
- Every server action requires LEARNER and uses the server session identity. Reads include ownership in the database predicate; unexpected errors are sanitized.
- Target capital and reserve use simulated starting capital. Recorded paper holdings remain separate and read-only; rebalances do not create asset units or change recorded cash/positions.
- Holdings show quantities, entry/recorded prices, cost basis, value, and simulated gain/loss. Missing prices make value/return unavailable; stale cached value/weight fields are ignored.
- Legacy event text and timestamps are preserved with NULL metadata and no invented snapshots. Manual notes do not change allocations. The most recent 100 events are displayed; older events remain stored.

## Automated checks

Local Prisma generate/validate, typecheck, ESLint, unit tests, 30-route structure check, and production build passed. The suite contains 250 tests across 19 files, including authorization, owner scoping, atomic mutation boundaries, stale-form rejection, snapshot correctness, recorded-price math, escaped legacy notes, and unknown-price presentation.

Vitest uses the automatic JSX runtime for component rendering tests; no dependency versions changed. GitLab CI [pipeline 2924312407](https://gitlab.com/kelllllllllllvin/MIRROR/-/pipelines/2924312407) passed on source commit `d1b42a0e030efcd0ab4a85f2700531213e4af834`. The verify job confirmed 250 tests across 19 files, 30 routes, and the production build. The production dependency audit and separate development report also succeeded.

## Staging migration

Neon project `patient-breeze-08986902`, branch `phase-17b-testing` (`br-shiny-feather-aeilw4nx`), database `neondb`.

Migration: `20261007222000_paper_portfolio_history`.

SHA-256: `dcf5ce2c97b22748a2d42d4738ddd7b8fa3a687442bbc1f950554ac0e1aa97fd`.

The additive DDL and completed Prisma migration-history row were applied in one Neon SQL transaction. Prisma migrate CLI was not used for the apply. An initial multi-command prepared statement was rejected before any DDL/history row was applied; submitting each SQL statement separately in the same transaction succeeded.

Rollback-only SQL checks passed before the persistent apply:

- Preserve complete legacy portfolio, holding, and event records, including edited text/timestamps and an unpriced holding.
- Keep new event metadata NULL and avoid backfilling history.
- Scope the ownership lock; snapshot names survive later strategy renaming.
- Roll back the associated weight/event writes when a snapshot CHECK fails.
- Reject orphan snapshots, duplicate event/strategy snapshots, identical before/after values, and totals above 100%.
- Accept distinct addition/removal NULL endpoints; roll back all fixture data and DDL afterward.

`node scripts/portfolio-migration-smoke.mjs` prints these checks for a pre-Phase-22 staging/disposable database. It never connects or applies SQL itself.

Post-apply: nullable event columns, validated event/snapshot checks and FK, unique snapshot index and timeline index are present; completed migration checksum matches. Zero portfolios, allocations, positions, events, or deltas existed on staging before or after the apply. Legacy preservation was verified with rollback-only fixtures. Zero smoke users remain. Academy remains 16 courses / 48 lessons.

## Preview and remaining verification

Preview: [Phase 22 Academy catalog](https://mirror-3dfj2vaa8-gabriel514uzokwe-3205s-projects.vercel.app/academy).

Deployment `dpl_5KqH5AhXj4NUjS1oymbxS1irf5Gt` is READY with `target: null` (preview), built from source commit `d1b42a0e030efcd0ab4a85f2700531213e4af834`. All 163 uploaded file references / 1,042,758 source bytes were checked against that immutable GitLab commit. This review-record update is documentation only; the preview retains the tested implementation snapshot.

Observed in Chrome on this preview:

- Public `/academy` renders 16 course cards with three lessons each. At 1363px, there is no horizontal overflow.
- Signed-out `/learner/portfolio` redirects to `/sign-in` with the original portfolio destination preserved in `redirect_url`.
- The application is signed out in this browser. No sign-in, portfolio mutation, or authenticated Phase 22 UI test was attempted.

Authenticated browser flows, concurrent live browser submissions, mobile widths, keyboard navigation, screen-reader review, and full browser E2E remain deferred. Transaction behavior is covered by repository tests and PostgreSQL rollback/constraint checks; parallel application-session execution was not observed.

No main merge, production schema/environment/deployment changes, creator/admin role grants, live market feed, payment flow, or real-money execution was performed.
