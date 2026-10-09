#!/usr/bin/env node
// Print rollback-only SQL. This generator never connects to a database.
import { readFileSync } from "node:fs";
import process from "node:process";

const mode = process.argv[2];
if (mode !== "before" && mode !== "after") {
  throw new Error("Use before for a pre-Phase-23 database or after for the migrated schema");
}
const before = mode === "before";
const migration = readFileSync(
  "prisma/migrations/20261007234500_moderation_audit_targets/migration.sql",
  "utf8"
);
const ddl = migration
  .replace(/--[^\n]*/g, "")
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean)
  .map((statement) => `EXECUTE '${statement.replace(/'/g, "''")}';`)
  .join("\n    ");

process.stdout.write(`
DO $phase23_test$
DECLARE
  passed boolean := false;
  baseline_counts jsonb;
  legacy_audit jsonb;
  legacy_report jsonb;
  legacy_moderation jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM "User" WHERE "id" LIKE 'phase23-smoke-%')
     OR ${before ? "EXISTS" : "NOT EXISTS"} (SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='AuditLog' AND column_name='targetId')
     OR NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='AuditLog_resourceId_fkey'
       AND conrelid='public."AuditLog"'::regclass AND convalidated) THEN
    RAISE EXCEPTION 'Unexpected schema or existing smoke fixture; use the correct staging mode';
  END IF;
  SELECT jsonb_build_array((SELECT count(*) FROM "User"), (SELECT count(*) FROM "Report"),
    (SELECT count(*) FROM "AuditLog"), (SELECT count(*) FROM "ModerationAction")) INTO baseline_counts;
  BEGIN
    -- All synthetic identities and changes are rolled back, including the ADMIN fixture.
    INSERT INTO "User" ("id","clerkId","email","role","updatedAt") VALUES
      ('phase23-smoke-reporter','phase23-smoke-reporter','phase23-reporter@example.invalid','LEARNER',CURRENT_TIMESTAMP),
      ('phase23-smoke-creator','phase23-smoke-creator','phase23-creator@example.invalid','CREATOR',CURRENT_TIMESTAMP),
      ('phase23-smoke-admin','phase23-smoke-admin','phase23-admin@example.invalid','ADMIN',CURRENT_TIMESTAMP);
    INSERT INTO "CreatorProfile" ("id","userId","isVerified","updatedAt")
      VALUES ('phase23-smoke-profile','phase23-smoke-creator',false,CURRENT_TIMESTAMP);
    INSERT INTO "Strategy" ("id","creatorId","name","riskProfile","status","publishedAt","updatedAt")
      VALUES ('phase23-smoke-strategy','phase23-smoke-creator','Original public label','MODERATE','PUBLISHED',TIMESTAMP '2026-01-01',CURRENT_TIMESTAMP);
    INSERT INTO "Report" ("id","reporterId","resourceType","resourceId","reason","description","createdAt","updatedAt")
      VALUES ('phase23-smoke-legacy-report','phase23-smoke-reporter','STRATEGY','phase23-smoke-strategy','Original reason','Original edited report text',TIMESTAMP '2026-01-02',TIMESTAMP '2026-01-03');
    INSERT INTO "AuditLog" ("id","userId","action","resourceType","resourceId","changes","createdAt")
      VALUES ('phase23-smoke-legacy-audit','phase23-smoke-admin','LEGACY_ACTION','STRATEGY','phase23-smoke-strategy','{"original":"kept"}',TIMESTAMP '2026-01-04');
    INSERT INTO "ModerationAction" ("id","adminId","reportId","resourceType","resourceId","action","reason","createdAt")
      VALUES ('phase23-smoke-legacy-moderation','phase23-smoke-admin','phase23-smoke-legacy-report','STRATEGY','phase23-smoke-strategy','WARN','Report status changed to INVESTIGATING',TIMESTAMP '2026-01-05');
    SELECT to_jsonb(a) - 'targetId' INTO legacy_audit FROM "AuditLog" a WHERE "id"='phase23-smoke-legacy-audit';
    SELECT to_jsonb(r) - 'resourceName' INTO legacy_report FROM "Report" r WHERE "id"='phase23-smoke-legacy-report';
    SELECT to_jsonb(m) INTO legacy_moderation FROM "ModerationAction" m WHERE "id"='phase23-smoke-legacy-moderation';

    ${before ? ddl : "-- Schema already migrated; exercise its constraints and writes."}

    IF (SELECT to_jsonb(a) - 'targetId' FROM "AuditLog" a WHERE "id"='phase23-smoke-legacy-audit') IS DISTINCT FROM legacy_audit
       OR (SELECT to_jsonb(r) - 'resourceName' FROM "Report" r WHERE "id"='phase23-smoke-legacy-report') IS DISTINCT FROM legacy_report
       OR (SELECT to_jsonb(m) FROM "ModerationAction" m WHERE "id"='phase23-smoke-legacy-moderation') IS DISTINCT FROM legacy_moderation
       OR EXISTS (SELECT 1 FROM "Report" WHERE "id"='phase23-smoke-legacy-report' AND "resourceName" IS NOT NULL)
       ${before ? `OR (SELECT "targetId" FROM "AuditLog" WHERE "id"='phase23-smoke-legacy-audit') IS DISTINCT FROM 'phase23-smoke-strategy'` : ""} THEN
      RAISE EXCEPTION 'Migration changed original history or invented a report label';
    END IF;

    PERFORM 1 FROM pg_advisory_xact_lock_shared(23023,1);
    IF NOT EXISTS (SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND locktype='advisory'
      AND classid=23023 AND objid=1 AND objsubid=2 AND mode='ShareLock' AND granted) THEN
      RAISE EXCEPTION 'Shared membership lock failed';
    END IF;
    PERFORM 1 FROM pg_advisory_xact_lock(23023,1);
    IF NOT EXISTS (SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND locktype='advisory'
      AND classid=23023 AND objid=1 AND objsubid=2 AND mode='ExclusiveLock' AND granted) THEN
      RAISE EXCEPTION 'Exclusive membership lock failed';
    END IF;
    PERFORM "id" FROM "User" WHERE "id"='phase23-smoke-reporter' FOR UPDATE;
    PERFORM "id" FROM "Strategy" WHERE "id"='phase23-smoke-strategy' FOR UPDATE;
    PERFORM "id" FROM "Report" WHERE "id"='phase23-smoke-legacy-report' FOR UPDATE;

    INSERT INTO "AuditLog" ("id","userId","action","resourceType","targetId") VALUES
      ('phase23-smoke-user-audit','phase23-smoke-admin','ADMIN_CREATOR_VERIFICATION','USER','phase23-smoke-creator'),
      ('phase23-smoke-report-audit','phase23-smoke-admin','ADMIN_REPORT_STATUS','REPORT','phase23-smoke-legacy-report');
    IF EXISTS (SELECT 1 FROM "AuditLog" WHERE "id" IN ('phase23-smoke-user-audit','phase23-smoke-report-audit') AND "resourceId" IS NOT NULL) THEN
      RAISE EXCEPTION 'Polymorphic targets reused the legacy strategy relation';
    END IF;
    BEGIN
      INSERT INTO "AuditLog" ("id","userId","action","resourceId")
        VALUES ('phase23-smoke-bad-strategy','phase23-smoke-admin','INVALID','missing-strategy');
      RAISE EXCEPTION 'Legacy strategy foreign key was lost';
    EXCEPTION WHEN foreign_key_violation THEN NULL; END;

    -- Failing audit persistence rolls back related role, verification, and case writes.
    BEGIN
      UPDATE "User" SET "role"='CREATOR' WHERE "id"='phase23-smoke-reporter';
      UPDATE "CreatorProfile" SET "isVerified"=true WHERE "id"='phase23-smoke-profile';
      UPDATE "Report" SET "status"='INVESTIGATING' WHERE "id"='phase23-smoke-legacy-report';
      INSERT INTO "AuditLog" ("id","userId","action","resourceType","targetId")
        VALUES ('phase23-smoke-invalid-actor','missing-actor','INVALID','USER','phase23-smoke-creator');
      RAISE EXCEPTION 'Orphan audit actor accepted';
    EXCEPTION WHEN foreign_key_violation THEN NULL; END;
    IF (SELECT "role" FROM "User" WHERE "id"='phase23-smoke-reporter') <> 'LEARNER'
       OR (SELECT "isVerified" FROM "CreatorProfile" WHERE "id"='phase23-smoke-profile')
       OR (SELECT to_jsonb(r) - 'resourceName' FROM "Report" r WHERE "id"='phase23-smoke-legacy-report') IS DISTINCT FROM legacy_report THEN
      RAISE EXCEPTION 'Failed audit left a partial role, verification, or case change';
    END IF;

    UPDATE "Strategy" SET "status"='ARCHIVED' WHERE "id"='phase23-smoke-strategy';
    INSERT INTO "ModerationAction" ("id","adminId","reportId","resourceType","resourceId","action","reason")
      VALUES ('phase23-smoke-suspend','phase23-smoke-admin','phase23-smoke-legacy-report','STRATEGY','phase23-smoke-strategy','SUSPEND','Reviewed content concern');
    INSERT INTO "AuditLog" ("id","userId","action","resourceType","resourceId","targetId","changes")
      VALUES ('phase23-smoke-status-audit','phase23-smoke-admin','ADMIN_STRATEGY_STATUS','STRATEGY','phase23-smoke-strategy','phase23-smoke-strategy','{"from":"PUBLISHED","to":"ARCHIVED","reason":"Reviewed content concern"}');
    UPDATE "Report" SET "status"='RESOLVED' WHERE "id"='phase23-smoke-legacy-report';
    IF (SELECT count(*) FROM "ModerationAction" WHERE "reportId"='phase23-smoke-legacy-report') <> 2 THEN
      RAISE EXCEPTION 'Case review created an additional moderation action';
    END IF;
    UPDATE "Strategy" SET "status"='DRAFT',"publishedAt"=NULL WHERE "id"='phase23-smoke-strategy';
    INSERT INTO "ModerationAction" ("id","adminId","resourceType","resourceId","action","reason")
      VALUES ('phase23-smoke-restore','phase23-smoke-admin','STRATEGY','phase23-smoke-strategy','RESTORE','Reviewed for a private draft');
    -- Clearing the optional old relation leaves the factual target snapshot intact.
    UPDATE "AuditLog" SET "resourceId"=NULL WHERE "id"='phase23-smoke-status-audit';
    IF (SELECT "targetId" FROM "AuditLog" WHERE "id"='phase23-smoke-status-audit') <> 'phase23-smoke-strategy'
       OR (SELECT "status" FROM "Strategy" WHERE "id"='phase23-smoke-strategy') <> 'DRAFT'
       OR EXISTS (SELECT 1 FROM "Strategy" WHERE "id"='phase23-smoke-strategy' AND "publishedAt" IS NOT NULL) THEN
      RAISE EXCEPTION 'Restoration or target snapshot semantics failed';
    END IF;
    RAISE EXCEPTION USING ERRCODE='PZ023', MESSAGE='Phase 23 smoke passed; roll back all fixtures and optional DDL';
  EXCEPTION WHEN SQLSTATE 'PZ023' THEN passed := true;
  END;
  IF NOT passed OR EXISTS (SELECT 1 FROM "User" WHERE "id" LIKE 'phase23-smoke-%')
     OR (SELECT jsonb_build_array((SELECT count(*) FROM "User"), (SELECT count(*) FROM "Report"),
       (SELECT count(*) FROM "AuditLog"), (SELECT count(*) FROM "ModerationAction"))) IS DISTINCT FROM baseline_counts
     OR ${before ? "EXISTS" : "NOT EXISTS"} (SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='AuditLog' AND column_name='targetId') THEN
    RAISE EXCEPTION 'Phase 23 smoke did not pass and fully roll back';
  END IF;
END;
$phase23_test$;
`);
