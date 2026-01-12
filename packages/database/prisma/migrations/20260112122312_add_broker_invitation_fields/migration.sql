-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "target_user_id" TEXT;

-- CreateIndex
CREATE INDEX "invitations_target_user_id_idx" ON "invitations"("target_user_id");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
