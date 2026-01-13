-- Add tokenPrefix columns for fast token lookup (prevents N+1 bcrypt comparisons)
-- AlterTable: Add tokenPrefix to password_resets
ALTER TABLE "password_resets" ADD COLUMN "token_prefix" TEXT;

-- AlterTable: Add tokenPrefix to email_verifications
ALTER TABLE "email_verifications" ADD COLUMN "token_prefix" TEXT;

-- AlterTable: Add tokenPrefix to invitations
ALTER TABLE "invitations" ADD COLUMN "token_prefix" TEXT;

-- CreateIndex: Fast lookup by tokenPrefix for password_resets
CREATE INDEX "password_resets_token_prefix_idx" ON "password_resets"("token_prefix");

-- CreateIndex: Fast expiry filtering for password_resets
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets"("expires_at");

-- CreateIndex: Fast lookup by tokenPrefix for email_verifications
CREATE INDEX "email_verifications_token_prefix_idx" ON "email_verifications"("token_prefix");

-- CreateIndex: Fast expiry filtering for email_verifications
CREATE INDEX "email_verifications_expires_at_idx" ON "email_verifications"("expires_at");

-- CreateIndex: Fast lookup by tokenPrefix for invitations
CREATE INDEX "invitations_token_prefix_idx" ON "invitations"("token_prefix");

-- CreateIndex: Fast expiry filtering for invitations
CREATE INDEX "invitations_expires_at_idx" ON "invitations"("expires_at");
