#!/usr/bin/env node
// Generate rollback-only Phase 21 smoke SQL for an empty pre-migration staging database.
// This script never opens a database connection or applies a migration.
import { readFileSync } from "node:fs";
import process from "node:process";

const mode = process.argv[2] ?? "preserve";
const expectedErrors = {
  orphan: "Academy migration stopped: unresolved progress lesson keys; review before retrying",
  duplicate: "Academy migration stopped: duplicate progress after lesson reconciliation",
  collision: "Academy migration stopped: conflicting lesson identities",
};
if (mode !== "preserve" && !(mode in expectedErrors)) {
  throw new Error("Choose preserve, orphan, duplicate, or collision");
}
const migration = readFileSync(
  "prisma/migrations/20261007190000_academy_database_curriculum/migration.sql",
  "utf8"
)
  .replace(/^BEGIN;\s*$/m, "")
  .replace(/^COMMIT;\s*$/m, "");
const extraFixture =
  mode === "orphan"
    ? `INSERT INTO "Progress" ("id", "userId", "lessonId") VALUES ('phase21-orphan', 'phase21-user-a', 'unknown-course/unknown-lesson');`
    : mode === "duplicate"
      ? `INSERT INTO "Progress" ("id", "userId", "lessonId") VALUES ('phase21-duplicate', 'phase21-user-a', 'investing-basics/what-is-investing');`
      : mode === "collision"
        ? `INSERT INTO "Course" ("id","slug","title","level","updatedAt") VALUES ('phase21-other-course','other-course','Other','BEGINNER',CURRENT_TIMESTAMP);
         INSERT INTO "Lesson" ("id","courseId","slug","title","content","updatedAt") VALUES ('investing-basics/what-is-investing','phase21-other-course','other-lesson','Other','Other',CURRENT_TIMESTAMP);`
        : "";
const expectedError = expectedErrors[mode];
const assertions =
  mode === "preserve"
    ? `
  IF (SELECT COUNT(*) FROM "Course") <> 16 OR (SELECT COUNT(*) FROM "Lesson") <> 48 THEN
    RAISE EXCEPTION 'Incorrect curriculum seed count';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "Course" WHERE "id"='phase21-legacy-course' AND "slug"='investing-basics'
      AND "title"='Existing edited course' AND "updatedAt"=TIMESTAMP '2026-01-02'
  ) OR NOT EXISTS (
    SELECT 1 FROM "Lesson" WHERE "id"='investing-basics/what-is-investing'
      AND "courseId"='phase21-legacy-course' AND "content"='Existing edited markdown'
      AND "contentBlocks" IS NULL AND "updatedAt"=TIMESTAMP '2026-01-02'
  ) THEN RAISE EXCEPTION 'Existing course or lesson edits were overwritten'; END IF;
  IF (SELECT COUNT(*) FROM "Progress") <> 3 OR NOT EXISTS (
    SELECT 1 FROM "Progress" WHERE "id"='phase21-legacy-progress'
      AND "lessonId"='investing-basics/what-is-investing' AND "completed"
      AND "completedAt"=TIMESTAMP '2026-01-03' AND "createdAt"=TIMESTAMP '2026-01-02'
  ) OR NOT EXISTS (
    SELECT 1 FROM "Progress" WHERE "id"='phase21-natural-progress'
      AND "lessonId"='investing-basics/what-is-investing' AND NOT "completed"
      AND "completedAt" IS NULL AND "createdAt"=TIMESTAMP '2026-01-02'
  ) OR NOT EXISTS (
    SELECT 1 FROM "Progress" WHERE "id"='phase21-seeded-progress'
      AND "lessonId"='investing-basics/why-people-invest' AND "completed"
      AND "completedAt"=TIMESTAMP '2026-01-04'
  ) THEN RAISE EXCEPTION 'Progress identity, completion state or timestamps changed'; END IF;
  IF EXISTS (
    SELECT 1 FROM "Lesson" l JOIN "Course" c ON c."id"=l."courseId"
    WHERE l."id" <> c."slug" || '/' || l."slug"
  ) THEN RAISE EXCEPTION 'Nondeterministic lesson ID'; END IF;
  BEGIN
    INSERT INTO "Progress" ("id","userId","lessonId") VALUES ('phase21-fk-probe','phase21-user-a','unknown-course/unknown-lesson');
    RAISE EXCEPTION 'Missing progress foreign key';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    INSERT INTO "Progress" ("id","userId","lessonId") VALUES ('phase21-unique-probe','phase21-user-a','investing-basics/what-is-investing');
    RAISE EXCEPTION 'Missing user/lesson uniqueness';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  RAISE EXCEPTION USING ERRCODE='PZ021', MESSAGE='Phase 21 preservation test passed; rollback fixtures and DDL';
`
    : `RAISE EXCEPTION 'Migration unexpectedly accepted ${mode} data';`;

const sql = `
DO $phase21_test$
DECLARE passed boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Lesson' AND column_name='contentBlocks')
     OR EXISTS (SELECT 1 FROM "Course") OR EXISTS (SELECT 1 FROM "Lesson") OR EXISTS (SELECT 1 FROM "Progress") THEN
    RAISE EXCEPTION 'Use an empty pre-Phase-21 staging/disposable Academy database';
  END IF;
  BEGIN
    INSERT INTO "User" ("id","clerkId","email","updatedAt") VALUES
      ('phase21-user-a','phase21-test-a','phase21-a@example.invalid',CURRENT_TIMESTAMP),
      ('phase21-user-b','phase21-test-b','phase21-b@example.invalid',CURRENT_TIMESTAMP);
    INSERT INTO "Course" ("id","slug","title","level","createdAt","updatedAt")
      VALUES ('phase21-legacy-course','investing-basics','Existing edited course','BEGINNER',TIMESTAMP '2026-01-02',TIMESTAMP '2026-01-02');
    INSERT INTO "Lesson" ("id","courseId","slug","title","content","createdAt","updatedAt")
      VALUES ('phase21-legacy-lesson','phase21-legacy-course','what-is-investing','Existing edited lesson','Existing edited markdown',TIMESTAMP '2026-01-02',TIMESTAMP '2026-01-02');
    INSERT INTO "Progress" ("id","userId","lessonId","completed","completedAt","createdAt") VALUES
      ('phase21-legacy-progress','phase21-user-a','phase21-legacy-lesson',true,TIMESTAMP '2026-01-03',TIMESTAMP '2026-01-02'),
      ('phase21-natural-progress','phase21-user-b','investing-basics/what-is-investing',false,NULL,TIMESTAMP '2026-01-02'),
      ('phase21-seeded-progress','phase21-user-a','investing-basics/why-people-invest',true,TIMESTAMP '2026-01-04',TIMESTAMP '2026-01-02');
    ${extraFixture}
    ${migration}
    ${assertions}
  EXCEPTION
    WHEN SQLSTATE 'PZ021' THEN
      ${mode === "preserve" ? "passed := true;" : "RAISE;"}
    WHEN raise_exception THEN
      ${expectedError ? `IF SQLERRM = '${expectedError}' THEN passed := true; ELSE RAISE; END IF;` : "RAISE;"}
  END;
  IF NOT passed THEN RAISE EXCEPTION 'Phase 21 smoke test did not pass'; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Lesson' AND column_name='contentBlocks')
     OR EXISTS (SELECT 1 FROM "User" WHERE "id" IN ('phase21-user-a','phase21-user-b')) THEN
    RAISE EXCEPTION 'Smoke test failed to roll back';
  END IF;
END;
$phase21_test$;
`;
process.stdout.write(sql);
