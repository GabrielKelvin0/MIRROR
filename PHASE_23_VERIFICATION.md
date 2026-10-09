# Phase 23 verification record

Branch: `phase-23-admin-moderation-completion`, stacked on the unmerged Phase 22
branch. Scope: report submission, moderation completion, creator verification,
and administrative audit review.

## Implemented behavior

- Public database strategy/creator details link to an authenticated report form.
  LEARNER and CREATOR can submit; identity comes from the server session. Only
  PUBLISHED strategies and public CREATOR users are reportable; sample blueprints
  and unavailable/private targets are rejected.
- Submission locks the reporter and rechecks their role/target. It rejects active
  duplicates and limits submissions to five per hour. Original public labels are
  captured at submission. Report and submission audit commit together.
- `/learner/reports` and `/creator/reports` query only the current reporter's
  records. They expose the original concern and case status, without private
  admin reasons, reporter emails, or moderation internals. Latest 50 are shown.
- All privileged server actions require ADMIN outside their error catch; the
  repository rechecks the database role under a transaction membership lock.
  Role writes use that lock exclusively, reject self-demotion, and protect the
  final administrator. Other admin changes use its shared form and row locks.
- Role, verification, strategy, and case changes require an explanation and
  expected state; stale or no-op forms are rejected. Data and audit commit in one
  Read Committed transaction. Errors are sanitized and shown inline.
- Actual strategy archiving/restoration records SUSPEND/RESTORE. Only ADMIN may
  restore ARCHIVED to a private DRAFT. Publishing requires a name/risk profile.
  Creator status writes follow the same membership/strategy locking protocol;
  stale creator publishing cannot overwrite an admin archive.
- Case transitions are separate from content moderation. Terminal cases may be
  reopened only if another active report does not already cover the same target
  for that reporter. Case review creates audit history, not a fake warning or
  restoration. Linked strategy controls verify the report refers to that strategy.
- Creator verification toggles an existing profile after an admin records their
  review reason. It neither provisions a role nor establishes endorsement,
  licensing, or performance approval. No real person's identity was verified.
- `/admin/reports` shows the latest 100 cases, up to 10 linked moderation actions
  per case, and a batch of up to 200 case audit entries. `/admin/audit` shows the
  latest 100 entries. Older records remain stored. Only recognized scalar review
  fields render; original user text is React-escaped. Earlier generated case-status
  moderation records are labelled legacy records rather than actual warnings.

## Automated checks

Local Prisma generate/validate, typecheck, ESLint, unit tests, 34-route structure
check, and the production build passed. The suite contains 302 tests across 26
files, including role/session boundaries, owner-scoped report DTOs, public target
validation, duplicate/rate limits, stale review/publish protection, atomic audit
boundaries, creator verification, self/final-admin guards, and server-rendered
form labels/error/pending states. Repository transaction tests mock Prisma;
component tests render HTML and are not interactive browser E2E.

No dependency versions or CI workflow changed. CI and the deployed immutable
source snapshot will be recorded after the draft review pipeline completes.

## Staging migration

Neon project `patient-breeze-08986902`, branch `phase-17b-testing`
(`br-shiny-feather-aeilw4nx`), database `neondb`.

Migration: `20261007234500_moderation_audit_targets`.

SHA-256: `a82971434caaea6b58d30c29563962224e0e02d6b91f4c08394560a8d324ac16`.

Eight additive DDL/data-copy statements and the completed Prisma migration-history
row were applied in one Neon SQL transaction. No migration CLI apply was used.
The existing Strategy FK on `AuditLog.resourceId` remains validated. Nullable
`AuditLog.targetId` holds a separate target snapshot; known existing strategy IDs
are copied without changing original audit fields. Nullable `Report.resourceName`
preserves unknown legacy labels as NULL. Five new query indexes are present.

`node scripts/moderation-migration-smoke.mjs before|after` prints rollback-only
SQL and never connects itself. Both modes passed on staging. Synthetic fixtures
verified preservation of original audit/report/moderation fields and timestamps,
factual target copying before apply, old FK enforcement, USER/REPORT targets
independent of that FK, shared/exclusive advisory locks, and rollback of associated
role/verification/case writes after an audit actor FK failure. Archive/restore and
target-snapshot semantics were exercised. These PostgreSQL subtransaction checks
do not claim concurrent application-session execution or real browser reviews.

Post-apply: checksum matches a completed migration, both columns are nullable,
the legacy FK and five indexes remain present. Staging retains one existing
user, zero reports/audits/moderation actions, and no smoke users. Academy remains
16 courses / 48 lessons. Legacy preservation uses rolled-back fixtures because
staging held no report/audit records before this change.

## Preview and remaining verification

Preview creation and limited signed-out routing checks are the next review step.
Authenticated report submissions, admin review/verification, creator flows,
concurrent live sessions, mobile widths, keyboard navigation, screen-reader
review, and full browser E2E remain deferred at the user's request.

No main merge, production schema/environment/deployment changes, persistent
creator/admin role grants, notification delivery, payments, or real-money
execution was performed. Phase 24 has not started.
