-- CreateTable
CREATE TABLE "ConfigAuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" TEXT NOT NULL,
    "membershipId" TEXT,
    "targetUserId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConfigAuditEvent_tenantId_createdAt_idx" ON "ConfigAuditEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ConfigAuditEvent_tenantId_membershipId_idx" ON "ConfigAuditEvent"("tenantId", "membershipId");

-- AddForeignKey
ALTER TABLE "ConfigAuditEvent" ADD CONSTRAINT "ConfigAuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
