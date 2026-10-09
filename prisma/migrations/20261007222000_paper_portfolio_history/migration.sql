-- AlterTable
ALTER TABLE "PortfolioEvent" ADD COLUMN     "allocatedAfter" DOUBLE PRECISION,
ADD COLUMN     "allocatedBefore" DOUBLE PRECISION,
ADD COLUMN     "reasoning" TEXT;

-- CreateTable
CREATE TABLE "PortfolioEventAllocationDelta" (
    "id" TEXT NOT NULL,
    "portfolioEventId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "strategyName" VARCHAR(255) NOT NULL,
    "beforePercentage" DOUBLE PRECISION,
    "afterPercentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioEventAllocationDelta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioEventAllocationDelta_portfolioEventId_strategyId_key" ON "PortfolioEventAllocationDelta"("portfolioEventId", "strategyId");

-- CreateIndex
CREATE INDEX "PortfolioEvent_portfolioId_createdAt_idx" ON "PortfolioEvent"("portfolioId", "createdAt");

-- AddForeignKey
ALTER TABLE "PortfolioEventAllocationDelta" ADD CONSTRAINT "PortfolioEventAllocationDelta_portfolioEventId_fkey" FOREIGN KEY ("portfolioEventId") REFERENCES "PortfolioEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing events remain unchanged with NULL metadata; no history is invented.
ALTER TABLE "PortfolioEvent" ADD CONSTRAINT "PortfolioEvent_allocation_totals_check" CHECK (
    ("allocatedBefore" IS NULL AND "allocatedAfter" IS NULL)
    OR ("allocatedBefore" IS NOT NULL AND "allocatedAfter" IS NOT NULL
        AND "allocatedBefore" BETWEEN 0 AND 100 AND "allocatedAfter" BETWEEN 0 AND 100)
);

ALTER TABLE "PortfolioEventAllocationDelta" ADD CONSTRAINT "PortfolioEventAllocationDelta_percentages_check" CHECK (
    ("beforePercentage" IS NULL OR "beforePercentage" BETWEEN 0 AND 100)
    AND ("afterPercentage" IS NULL OR "afterPercentage" BETWEEN 0 AND 100)
    AND ("beforePercentage" IS NOT NULL OR "afterPercentage" IS NOT NULL)
    AND "beforePercentage" IS DISTINCT FROM "afterPercentage"
);

