#!/usr/bin/env node
// Print rollback-only SQL. This generator never connects to a database.
import { readFileSync } from "node:fs";
import process from "node:process";

const migration = readFileSync(
  "prisma/migrations/20261007222000_paper_portfolio_history/migration.sql",
  "utf8"
);
process.stdout.write(`
DO $phase22_test$
DECLARE
  passed boolean := false;
  legacy_event jsonb;
  legacy_portfolio jsonb;
  legacy_position jsonb;
BEGIN
  IF to_regclass('public."PortfolioEventAllocationDelta"') IS NOT NULL
     OR EXISTS (SELECT 1 FROM "User" WHERE "id"='phase22-smoke-user') THEN
    RAISE EXCEPTION 'Use a pre-Phase-22 staging/disposable database without the smoke fixture';
  END IF;
  BEGIN
    INSERT INTO "User" ("id","clerkId","email","updatedAt")
      VALUES ('phase22-smoke-user','phase22-smoke-subject','phase22-smoke@example.invalid',CURRENT_TIMESTAMP);
    INSERT INTO "Strategy" ("id","creatorId","name","status","updatedAt")
      VALUES ('phase22-smoke-strategy','phase22-smoke-user','Original strategy name','PUBLISHED',CURRENT_TIMESTAMP);
    INSERT INTO "PaperPortfolio" ("id","userId","name","startingCapital","currentValue","cashBalance","updatedAt")
      VALUES ('phase22-smoke-portfolio','phase22-smoke-user','Edited legacy portfolio',1000,1050,800,TIMESTAMP '2026-01-02');
    INSERT INTO "PaperPortfolioStrategy" ("id","portfolioId","strategyId","allocationPercentage")
      VALUES ('phase22-smoke-link','phase22-smoke-portfolio','phase22-smoke-strategy',40);
    INSERT INTO "PaperPosition" ("id","portfolioId","symbol","quantity","entryPrice","currentPrice","updatedAt")
      VALUES ('phase22-smoke-position','phase22-smoke-portfolio','TEST',10,20,NULL,TIMESTAMP '2026-01-02');
    INSERT INTO "PortfolioEvent" ("id","portfolioId","eventType","description","createdAt")
      VALUES ('phase22-smoke-legacy','phase22-smoke-portfolio','REBALANCE','Existing learner note',TIMESTAMP '2026-01-03');
    SELECT to_jsonb(e) INTO legacy_event FROM "PortfolioEvent" e WHERE "id"='phase22-smoke-legacy';
    SELECT to_jsonb(p) INTO legacy_portfolio FROM "PaperPortfolio" p WHERE "id"='phase22-smoke-portfolio';
    SELECT to_jsonb(p) INTO legacy_position FROM "PaperPosition" p WHERE "id"='phase22-smoke-position';

    ${migration}

    IF (SELECT to_jsonb(e) - ARRAY['allocatedBefore','allocatedAfter','reasoning'] FROM "PortfolioEvent" e WHERE "id"='phase22-smoke-legacy') <> legacy_event
       OR (SELECT to_jsonb(p) FROM "PaperPortfolio" p WHERE "id"='phase22-smoke-portfolio') <> legacy_portfolio
       OR (SELECT to_jsonb(p) FROM "PaperPosition" p WHERE "id"='phase22-smoke-position') <> legacy_position
       OR (SELECT "allocationPercentage" FROM "PaperPortfolioStrategy" WHERE "id"='phase22-smoke-link') <> 40
       OR EXISTS (SELECT 1 FROM "PortfolioEvent" WHERE "id"='phase22-smoke-legacy' AND ("allocatedBefore" IS NOT NULL OR "allocatedAfter" IS NOT NULL OR "reasoning" IS NOT NULL))
       OR EXISTS (SELECT 1 FROM "PortfolioEventAllocationDelta") THEN
      RAISE EXCEPTION 'Legacy portfolio, holdings, note, or allocation history changed';
    END IF;

    PERFORM "id" FROM "PaperPortfolio" WHERE "id"='phase22-smoke-portfolio' AND "userId"='phase22-smoke-user' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Owned parent lock failed'; END IF;
    PERFORM "id" FROM "PaperPortfolio" WHERE "id"='phase22-smoke-portfolio' AND "userId"='someone-else' FOR UPDATE;
    IF FOUND THEN RAISE EXCEPTION 'Foreign parent was visible to the ownership lock'; END IF;

    UPDATE "PaperPortfolioStrategy" SET "allocationPercentage"=50 WHERE "id"='phase22-smoke-link';
    INSERT INTO "PortfolioEvent" ("id","portfolioId","eventType","description","reasoning","allocatedBefore","allocatedAfter")
      VALUES ('phase22-smoke-event','phase22-smoke-portfolio','REBALANCE','Simulated target change','Learner explanation',40,50);
    INSERT INTO "PortfolioEventAllocationDelta" ("id","portfolioEventId","strategyId","strategyName","beforePercentage","afterPercentage")
      VALUES ('phase22-smoke-delta','phase22-smoke-event','phase22-smoke-strategy','Original strategy name',40,50);
    UPDATE "Strategy" SET "name"='Renamed strategy' WHERE "id"='phase22-smoke-strategy';
    IF (SELECT "strategyName" FROM "PortfolioEventAllocationDelta" WHERE "id"='phase22-smoke-delta') <> 'Original strategy name' THEN
      RAISE EXCEPTION 'Historical strategy identity drifted';
    END IF;

    -- A history persistence failure must undo its associated allocation write.
    BEGIN
      UPDATE "PaperPortfolioStrategy" SET "allocationPercentage"=70 WHERE "id"='phase22-smoke-link';
      INSERT INTO "PortfolioEvent" ("id","portfolioId","eventType","description","allocatedBefore","allocatedAfter")
        VALUES ('phase22-smoke-failed-event','phase22-smoke-portfolio','REBALANCE','Must roll back',50,70);
      INSERT INTO "PortfolioEventAllocationDelta" ("id","portfolioEventId","strategyId","strategyName","beforePercentage","afterPercentage")
        VALUES ('phase22-smoke-invalid-delta','phase22-smoke-failed-event','phase22-smoke-strategy','Renamed strategy',50,150);
      RAISE EXCEPTION 'Invalid snapshot was accepted';
    EXCEPTION WHEN check_violation THEN NULL; END;
    IF (SELECT "allocationPercentage" FROM "PaperPortfolioStrategy" WHERE "id"='phase22-smoke-link') <> 50
       OR EXISTS (SELECT 1 FROM "PortfolioEvent" WHERE "id"='phase22-smoke-failed-event') THEN
      RAISE EXCEPTION 'Failed history insert left a partial allocation mutation';
    END IF;

    BEGIN
      INSERT INTO "PortfolioEventAllocationDelta" ("id","portfolioEventId","strategyId","strategyName","beforePercentage","afterPercentage")
        VALUES ('phase22-smoke-duplicate','phase22-smoke-event','phase22-smoke-strategy','Duplicate',40,50);
      RAISE EXCEPTION 'Duplicate event/strategy snapshot accepted';
    EXCEPTION WHEN unique_violation THEN NULL; END;
    BEGIN
      INSERT INTO "PortfolioEventAllocationDelta" ("id","portfolioEventId","strategyId","strategyName","beforePercentage","afterPercentage")
        VALUES ('phase22-smoke-orphan','missing-event','other','Orphan',40,50);
      RAISE EXCEPTION 'Orphan snapshot accepted';
    EXCEPTION WHEN foreign_key_violation THEN NULL; END;
    BEGIN
      INSERT INTO "PortfolioEventAllocationDelta" ("id","portfolioEventId","strategyId","strategyName","beforePercentage","afterPercentage")
        VALUES ('phase22-smoke-noop','phase22-smoke-event','other','No change',40,40);
      RAISE EXCEPTION 'No-op snapshot accepted';
    EXCEPTION WHEN check_violation THEN NULL; END;
    BEGIN
      INSERT INTO "PortfolioEvent" ("id","portfolioId","eventType","description","allocatedBefore","allocatedAfter")
        VALUES ('phase22-smoke-bad-total','phase22-smoke-portfolio','REBALANCE','Bad total',50,101);
      RAISE EXCEPTION 'Overallocated event totals accepted';
    EXCEPTION WHEN check_violation THEN NULL; END;

    -- NULL endpoints distinguish an addition/removal from a real 0% target.
    INSERT INTO "PortfolioEventAllocationDelta" ("id","portfolioEventId","strategyId","strategyName","beforePercentage","afterPercentage") VALUES
      ('phase22-smoke-added','phase22-smoke-event','added','Added',NULL,10),
      ('phase22-smoke-removed','phase22-smoke-event','removed','Removed',10,NULL);
    RAISE EXCEPTION USING ERRCODE='PZ022', MESSAGE='Phase 22 smoke passed; roll back fixtures and DDL';
  EXCEPTION WHEN SQLSTATE 'PZ022' THEN passed := true;
  END;
  IF NOT passed OR to_regclass('public."PortfolioEventAllocationDelta"') IS NOT NULL
     OR EXISTS (SELECT 1 FROM "User" WHERE "id"='phase22-smoke-user') THEN
    RAISE EXCEPTION 'Phase 22 smoke did not pass and fully roll back';
  END IF;
END;
$phase22_test$;
`);
