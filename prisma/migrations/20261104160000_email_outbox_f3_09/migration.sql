-- F3-09: harden EmailOutbox (processing/dead, nextAttemptAt, lockToken, template)

-- New enum values via recreate (maps sending→processing, failed→dead)
CREATE TYPE "EmailOutboxStatus_new" AS ENUM ('pending', 'processing', 'sent', 'dead');

ALTER TABLE "EmailOutbox" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "EmailOutbox"
  ALTER COLUMN "status" TYPE "EmailOutboxStatus_new"
  USING (
    CASE "status"::text
      WHEN 'sending' THEN 'processing'::"EmailOutboxStatus_new"
      WHEN 'failed' THEN 'dead'::"EmailOutboxStatus_new"
      WHEN 'pending' THEN 'pending'::"EmailOutboxStatus_new"
      WHEN 'sent' THEN 'sent'::"EmailOutboxStatus_new"
      ELSE 'pending'::"EmailOutboxStatus_new"
    END
  );

DROP TYPE "EmailOutboxStatus";
ALTER TYPE "EmailOutboxStatus_new" RENAME TO "EmailOutboxStatus";
ALTER TABLE "EmailOutbox" ALTER COLUMN "status" SET DEFAULT 'pending'::"EmailOutboxStatus";

ALTER TABLE "EmailOutbox" ADD COLUMN IF NOT EXISTS "template" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "EmailOutbox" ADD COLUMN IF NOT EXISTS "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "EmailOutbox" ADD COLUMN IF NOT EXISTS "lockToken" TEXT;
ALTER TABLE "EmailOutbox" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migrate legacy lockedBy → lockToken
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'EmailOutbox' AND column_name = 'lockedBy'
  ) THEN
    EXECUTE 'UPDATE "EmailOutbox" SET "lockToken" = "lockedBy" WHERE "lockToken" IS NULL AND "lockedBy" IS NOT NULL';
    EXECUTE 'ALTER TABLE "EmailOutbox" DROP COLUMN "lockedBy"';
  END IF;
END $$;

DROP INDEX IF EXISTS "EmailOutbox_status_createdAt_idx";
DROP INDEX IF EXISTS "EmailOutbox_lockedAt_idx";
CREATE INDEX IF NOT EXISTS "EmailOutbox_status_nextAttemptAt_idx" ON "EmailOutbox"("status", "nextAttemptAt");
CREATE INDEX IF NOT EXISTS "EmailOutbox_tenantId_createdAt_idx" ON "EmailOutbox"("tenantId", "createdAt");
