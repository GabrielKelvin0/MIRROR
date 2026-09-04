# MIRROR — Browser Smoke-Test Checklist (Phase 17B)

Purpose: deterministic browser tests for the next phase. This is NOT
implementation work — it verifies existing functionality only. Nothing in this
checklist may be recorded as PASS unless it was actually observed in a real
browser against a working runtime.

## How to record results

Every test line has a status and a notes cell:

- `PASS` — expected behavior observed
- `FAIL` — behavior differs from expected (record the actual result in Notes)
- `BLOCKED` — could not run (record why in Notes, e.g. missing account, env)

Do not delete or reword tests to make them pass; fix the app or record the
failure honestly.

## Preconditions (test accounts + data)

1. A running deployment (Vercel preview/staging) or local `next dev` on a
   machine where Next.js runs (this repository's aarch64 dev container cannot
   run `next` — SIGBUS).
2. Clerk test application configured for the deployment URL.
3. Neon **test/dev branch** database (never production) with migrations applied.
4. Accounts:
   - `LEARNER_A`, `LEARNER_B` — created via normal sign-up (both must default to LEARNER)
   - `CREATOR_A`, `CREATOR_B` — learners promoted to CREATOR by an ADMIN via `/admin/users`
   - `ADMIN` — promoted by an existing ADMIN via `/admin/users`
5. One published strategy by `CREATOR_A` (created through the checklist below).

## A. Authentication

| ID | Test | Steps | Expected | Status | Notes |
|----|------|-------|----------|--------|-------|
| A1 | Public homepage loads | Open `/` signed out | Renders marketing homepage, no error | | |
| A2 | Sign-up | Open `/sign-up`, create `LEARNER_A` | Account created; lands on learner dashboard; user is LEARNER | | |
| A3 | Sign-in | Sign out, sign in as `LEARNER_A` | Lands on learner dashboard | | |
| A4 | Sign-out | Use Sign out in the learner header | Returns to signed-out state; protected route now redirects | | |
| A5 | Session persists across refresh | Reload a learner page while signed in | Still signed in (no redirect to /sign-in) | | |
| A6 | Unauthenticated protected route | Open `/learner/dashboard` signed out | Redirected to `/sign-in` (returns to original URL after sign-in) | | |
| A7 | Unauthenticated admin/creator routes | Open `/admin/dashboard` and `/creator/dashboard` signed out | Redirected to `/sign-in` | | |

## B. Learner

| ID | Test | Steps | Expected | Status | Notes |
|----|------|-------|----------|--------|-------|
| B1 | Learner dashboard loads | Open `/learner/dashboard` as `LEARNER_A` | Dashboard renders; no server error | | |
| B2 | Strategy discovery | Open `/strategies` as `LEARNER_A` | Strategy cards render; search and filters are usable | | |
| B3 | Strategy detail | Open a strategy's `/strategies/[slug]` page | Blueprint/methodology, performance, updates render | | |
| B4 | Follow / unfollow | On `/learner/following`, follow a suggested strategy, then unfollow it | Follow state persists server-side; list updates without full reload | | |
| B5 | Notifications | Open `/learner/notifications`; mark one read | Read state persists after refresh | | |
| B6 | Paper portfolio creation | On `/learner/portfolio`, create a portfolio with a name/capital | Portfolio appears in list | | |
| B7 | Allocation editing | Open `/learner/portfolio/[id]`, edit/remove allocations | Totals validate (≤100%); changes persist | | |
| B8 | Portfolio decision/event | Record a manual decision on `/learner/portfolio/[id]` | Decision appears in the portfolio timeline | | |
| B9 | Performance/risk panel | View portfolio detail with performance data | Return/drawdown/volatility panel renders with data basis labels | | |
| B10 | Academy catalog | Open `/learner/academy` | Courses grouped by level render | | |
| B11 | Course page | Open a course under `/learner/academy/[courseSlug]` | Lessons and progress bar render | | |
| B12 | Lesson completion | Open a lesson, click complete | Progress increments for course/level | | |
| B13 | Progress persists after refresh | Reload the course page | Completion state retained (DB-backed) | | |

## C. Creator

| ID | Test | Steps | Expected | Status | Notes |
|----|------|-------|----------|--------|-------|
| C1 | Learner blocked from creator routes | Open `/creator/dashboard` as `LEARNER_A` | Denied: no creator content; error page (403 ForbiddenError) — not a redirect to a functioning creator UI | | |
| C2 | Creator dashboard loads | Open `/creator/dashboard` as `CREATOR_A` | Dashboard renders own strategies | | |
| C3 | Create draft strategy | `/creator/dashboard/strategies/new` → save draft | Draft appears in dashboard; opens edit page | | |
| C4 | Edit methodology | On the draft's edit page, change name/philosophy/thesis and save | Changes persist after refresh | | |
| C5 | Edit allocations | Add/remove allocation lines on the edit page | Weights validate (sum ≤ 100%, boundaries enforced) | | |
| C6 | Publish strategy | Change status to Published | Status becomes PUBLISHED with `publishedAt`; appears in admin list | | |
| C7 | Create strategy update | Add an update with rationale to the published strategy | Update appears on detail/preview; followers get a notification | | |
| C8 | Archive strategy | Change status to Archived | Status becomes ARCHIVED; no longer published-facing | | |
| C9 | Creator isolation | As `CREATOR_B`, attempt to edit/delete/archive `CREATOR_A`'s strategy (direct URL) | Denied with an error; no data mutated | | |

## D. Admin

| ID | Test | Steps | Expected | Status | Notes |
|----|------|-------|----------|--------|-------|
| D1 | Non-admin blocked from admin routes | Open `/admin/dashboard` as `LEARNER_A` and as `CREATOR_A` | Denied: no admin content; error page (403 ForbiddenError) | | |
| D2 | Admin dashboard | Open `/admin/dashboard` as `ADMIN` | Overview renders counts/lists | | |
| D3 | Users page | Open `/admin/users` | User list renders with role controls | | |
| D4 | Role management | Change `CREATOR_A`'s role to LEARNER, then back to CREATOR | Role updates persist; ADMIN cannot demote the last ADMIN | | |
| D5 | Creators page | Open `/admin/creators` | CREATOR users list with profile info | | |
| D6 | Strategies page | Open `/admin/strategies` | All strategies render | | |
| D7 | Status filters | Use All/Draft/Published/Archived filter links | List filters server-side per status | | |
| D8 | Strategy moderation | Set a strategy to Draft, then back to Published | Status changes persist and are auditable | | |
| D9 | Report resolution | Open `/admin/reports`; resolve/dismiss a report | Status changes persist; moderation action logged | | |

Note: reports can only be tested if a report row exists in the test database
(report submission is not yet exposed in the UI; create a row via a DB probe on
the test branch or skip as BLOCKED).

## E. Public content

| ID | Test | Steps | Expected | Status | Notes |
|----|------|-------|----------|--------|-------|
| E1 | Research index | Open `/research` | Article cards render | | |
| E2 | Research detail | Open `/research/[slug]` | Article renders; unknown slug → 404 | | |
| E3 | Marketing pages | Open `/about`, `/how-it-works` | Pages render with working links | | |

## F. Mobile (test at 360–414 px width)

| ID | Test | Steps | Expected | Status | Notes |
|----|------|-------|----------|--------|-------|
| M1 | No horizontal overflow | Load public, learner, creator, admin pages at mobile width | `document.documentElement.scrollWidth` ≤ viewport width | | |
| M2 | Navigation works | Open the nav on mobile (public homepage and learner dashboard) | Menu opens and links navigate | | |
| M3 | Forms usable | Sign-in, strategy create/edit, portfolio create, role form | Inputs/selects usable at mobile width | | |
| M4 | Tables/cards readable | Admin tables, portfolio allocation list, strategy cards | No clipped columns; readable (scroll or reflow as designed) | | |
| M5 | Touch targets | Tap primary actions/links | Targets are comfortably tappable (≈44 px or visually adequate) | | |
| M6 | Dialogs/forms fit viewport | Open any modal/dialog used by the flows | Fits viewport without clipping | | |
| M7 | Text not clipped | Spot-check headings/buttons/labels | No truncated text | | |

## G. Accessibility

| ID | Test | Steps | Expected | Status | Notes |
|----|------|-------|----------|--------|-------|
| X1 | Keyboard navigation | Tab through public, learner, creator pages | All interactive elements reachable by keyboard | | |
| X2 | Visible focus | Observe Tab focus ring on links/buttons/inputs | Focus indicator clearly visible | | |
| X3 | Headings | Audit page structure (axe or manual) | One `h1` per page; logical heading order | | |
| X4 | Form labels | Inspect sign-in, forms on learner/creator/admin | Every input has an associated label | | |
| X5 | Error messages | Trigger a validation error (e.g. allocation > 100%) | Error is visible and associated with the field | | |
| X6 | Skip links | On public, learner, creator pages press the skip link | Skips to `#main`; (admin layout currently has no skip link) | | |
| X7 | Screen-reader semantics | Run a basic screen-reader or axe pass over key pages | Landmarks (`main`, `nav`) present; tables have scope/headers | | |
| X8 | Color contrast | Check key text/CTA contrast (axe or contrast tool) | Passes AA for body text/CTAs | | |

## H. Phase 17B — Staging deployment readiness (external setup)

No deployment is performed during Phase 17A. The intended future environment is:

`GitHub` → `Vercel staging/preview` → `Clerk development/test application` → `Neon development/test branch`

External setup required in Phase 17B (accounts/secrets are intentionally NOT
created during Phase 17A):

1. **Vercel**: import `GabrielKelvin0/MIRROR`; create a staging/preview project.
2. **Clerk**: create/keep a development or test instance; add the Vercel preview
   domain to the instance's allowed origins/redirect URLs.
3. **Neon**: create a test/dev branch from the existing branch; copy the pooled
   (`DATABASE_URL`) and direct/unpooled (`DIRECT_URL`) connection strings.
4. **Environment variables** on the Vercel project (never in the repo):
   `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `CLERK_SECRET_KEY` (optionally `NEXT_PUBLIC_CLERK_SIGN_IN_URL` /
   `NEXT_PUBLIC_CLERK_SIGN_UP_URL`).
5. **Migrations**: run `npx prisma migrate deploy` once against the test branch
   (2 committed migrations). Never run migrations from CI; CI never touches any
   database.
6. **Test roles**: create LEARNER accounts via sign-up; promote CREATOR/ADMIN
   via `/admin/users` after signing in as an ADMIN.
7. Run checklist sections A–G against the preview URL; test mobile widths via
   the browser device toolbar.

Point staging tests at a Neon test branch; do not point them at the production
data source.
