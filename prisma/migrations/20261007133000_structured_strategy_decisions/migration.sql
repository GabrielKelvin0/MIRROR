-- Phase 20: structured strategy decision history
-- Existing StrategyUpdate rows remain UPDATE records through the default.
-- No historical reasoning, evidence, assumptions, or allocation deltas are fabricated.

-- CreateEnum
CREATE TYPE "StrategyUpdateKind" AS ENUM ('UPDATE', 'DECISION');

-- AlterTable
ALTER TABLE "StrategyUpdate"
ADD COLUMN "kind" "StrategyUpdateKind" NOT NULL DEFAULT 'UPDATE',
ADD COLUMN "evidence" TEXT,
ADD COLUMN "assumptionChanges" TEXT;

-- CreateTable
CREATE TABLE "StrategyUpdateAllocationDelta" (
    "id" TEXT NOT NULL,
    "strategyUpdateId" TEXT NOT NULL,
    "assetClass" VARCHAR(100) NOT NULL,
    "beforePercentage" DOUBLE PRECISION,
    "afterPercentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyUpdateAllocationDelta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StrategyUpdate_kind_idx" ON "StrategyUpdate"("kind");

-- CreateIndex
CREATE INDEX "StrategyUpdateAllocationDelta_strategyUpdateId_idx"
ON "StrategyUpdateAllocationDelta"("strategyUpdateId");

-- AddForeignKey
ALTER TABLE "StrategyUpdateAllocationDelta"
ADD CONSTRAINT "StrategyUpdateAllocationDelta_strategyUpdateId_fkey"
FOREIGN KEY ("strategyUpdateId") REFERENCES "StrategyUpdate"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
