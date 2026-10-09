-- Preserve the existing Strategy FK and every original audit/report field.
-- The new snapshot supports USER/REPORT targets and survives strategy deletion.
ALTER TABLE "AuditLog" ADD COLUMN "targetId" TEXT;
UPDATE "AuditLog" SET "targetId" = "resourceId" WHERE "resourceId" IS NOT NULL;
ALTER TABLE "Report" ADD COLUMN "resourceName" VARCHAR(255);

CREATE INDEX "AuditLog_resourceType_targetId_createdAt_idx" ON "AuditLog"("resourceType", "targetId", "createdAt");
CREATE INDEX "Report_reporterId_createdAt_idx" ON "Report"("reporterId", "createdAt");
CREATE INDEX "Report_reporterId_resourceType_resourceId_status_idx" ON "Report"("reporterId", "resourceType", "resourceId", "status");
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "ModerationAction_resourceType_resourceId_createdAt_idx" ON "ModerationAction"("resourceType", "resourceId", "createdAt");
