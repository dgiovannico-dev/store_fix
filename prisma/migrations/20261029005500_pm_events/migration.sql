CREATE TYPE "PmEventStatus" AS ENUM ('planned', 'done', 'cancelled');
CREATE TABLE "PlannedMaintenanceEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorContractId" TEXT,
    "assetId" TEXT,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "PmEventStatus" NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "ticketId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlannedMaintenanceEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlannedMaintenanceEvent_tenantId_idx" ON "PlannedMaintenanceEvent"("tenantId");
CREATE INDEX "PlannedMaintenanceEvent_tenantId_scheduledAt_idx" ON "PlannedMaintenanceEvent"("tenantId", "scheduledAt");
CREATE INDEX "PlannedMaintenanceEvent_tenantId_status_idx" ON "PlannedMaintenanceEvent"("tenantId", "status");
ALTER TABLE "PlannedMaintenanceEvent" ADD CONSTRAINT "PlannedMaintenanceEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlannedMaintenanceEvent" ADD CONSTRAINT "PlannedMaintenanceEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlannedMaintenanceEvent" ADD CONSTRAINT "PlannedMaintenanceEvent_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlannedMaintenanceEvent" ADD CONSTRAINT "PlannedMaintenanceEvent_vendorContractId_fkey" FOREIGN KEY ("vendorContractId") REFERENCES "VendorContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlannedMaintenanceEvent" ADD CONSTRAINT "PlannedMaintenanceEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
