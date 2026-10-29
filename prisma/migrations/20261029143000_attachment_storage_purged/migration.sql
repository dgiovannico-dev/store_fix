-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN "storagePurgedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Attachment_deletedAt_storagePurgedAt_idx" ON "Attachment"("deletedAt", "storagePurgedAt");
