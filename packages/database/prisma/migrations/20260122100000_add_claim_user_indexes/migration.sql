-- Add indexes on Claim user foreign keys for faster queries
-- These indexes improve performance when filtering claims by reporter or driver

-- CreateIndex
CREATE INDEX "claims_reporter_user_id_idx" ON "claims"("reporter_user_id");

-- CreateIndex
CREATE INDEX "claims_driver_user_id_idx" ON "claims"("driver_user_id");
