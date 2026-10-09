# Phase 21 verification record

Source implementation: `d2397e2e688b8550302d78639c1a53024d16ed34`.

Merge request: https://gitlab.com/kelllllllllllvin/MIRROR/-/merge_requests/3

## Implemented behavior

- Runtime Academy catalog, courses, and lessons read PostgreSQL Course/Lesson records.
- Public `/academy` lists course metadata and links to the authenticated learner routes.
- The existing course/lesson URLs and `courseSlug/lessonSlug` progress keys remain stable.
- Completion actions require LEARNER, use the server session identity, reject unknown lessons, and sanitize unexpected errors.
- Existing text content is preserved; structured JSON is validated before React renders it.

## Automated verification

GitLab pipeline `2923640498` passed on the implementation commit:

- Prisma generate and validate; TypeScript; ESLint.
- 212 unit tests across 15 files, including completion authorization, persistence scoping, content validation, and seed fidelity.
- 30-route structure check.
- Production build.
- Production dependency audit. The separate development report retains the previously documented braces advisory.

The same checks and production build passed locally. Generated Next type declarations are excluded from ESLint so lint also passes after a build.

## Staging database verification

Environment: Neon `patient-breeze-08986902`, branch `phase-17b-testing` (`br-shiny-feather-aeilw4nx`), database `neondb`.

Four rollback-only migration scenarios passed before the persistent apply:

1. Preserve an existing course ID and edited course/lesson content; reconcile a legacy lesson ID; retain natural-key progress, completed/incomplete state, and original timestamps.
2. Abort for unknown progress lesson keys and roll back all fixture data and schema changes.
3. Abort for duplicate per-user progress after reconciliation and roll back all changes.
4. Abort for conflicting lesson identities and roll back all changes.

Reproduce these checks on an empty pre-migration staging/disposable Academy database by generating SQL with `node scripts/academy-migration-smoke.mjs preserve|orphan|duplicate|collision`. The generator never connects to a database or applies a migration. Test fixtures and DDL are rolled back by a caught test-only exception.

Migration `20261007190000_academy_database_curriculum` was applied to staging through one Neon SQL transaction, including its completed Prisma migration-history record. Prisma migrate CLI was not used for this apply.

SHA-256: `b50751150aef595c81a3a1865ddab175dc515f5eaac226095be677d582861c6e`.

Post-apply observations:

- 16 courses / 48 lessons; three lessons in each course.
- All Lesson IDs equal their course/lesson slug pair; all seeded structured content is present.
- Progress FK is validated, uses ON DELETE RESTRICT / ON UPDATE CASCADE, and has a lessonId index.
- Migration-history checksum matches the committed SQL.
- Zero Progress rows existed before or after the staging apply; preservation of existing history was tested with rollback-only fixtures.
- Zero test users remained.

## Preview and browser verification

The retry created a Ready Phase 21 preview, deployment `dpl_EHPMcYmvqBDjP9ATBBoqj83ZVjE7`:

https://mirror-96chydqeh-gabriel514uzokwe-3205s-projects.vercel.app/academy

The deployed snapshot is `4d83ac67c0714c69c693641d56e765274689f112`; all 152 uploaded source-file references were checked against that GitLab snapshot. GitLab pipeline `2923961331` passed on the same commit. Later verification-only documentation commits do not change the deployed application.

Observed in Chrome while signed out:

- Public `/academy` loads 16 course cards, each advertising three lessons, grouped as Beginner (6), Intermediate (5), and Advanced (5).
- The desktop catalog fits the 1363-pixel viewport without horizontal overflow.
- Clicking Start learning reaches Clerk sign-in with `/learner/academy` preserved in the redirect destination.
- Clicking Investing Basics reaches Clerk sign-in with `/learner/academy/investing-basics` preserved in the redirect destination.

These checks verify public rendering and signed-out route gating. They do not verify authenticated lesson reading or completion persistence.

## Remaining verification

Mobile widths, keyboard navigation, and screen-reader review remain pending.

Authenticated browser checks remain deferred at the user's request. No creator/admin roles were granted. Phase 20 and Phase 21 are unmerged; Phase 21 targets the Phase 20 branch to isolate its diff. No main, production database, production environment, or production deployment changes were made.
