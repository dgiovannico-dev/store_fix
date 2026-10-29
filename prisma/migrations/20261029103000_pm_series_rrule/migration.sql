-- CreateTable
CREATE TABLE "PmSeries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorContractId" TEXT,
    "assetId" TEXT,
    "title" TEXT NOT NULL,
    "rrule" TEXT NOT NULL,
    "dtstart" TIMESTAMP(3) NOT NULL,
    "until" TIMESTAMP(3),
    "generateAheadDays" INTEGER NOT NULL DEFAULT 90,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PmSeries_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "PlannedMaintenanceEvent" ADD COLUMN "seriesId" TEXT,
ADD COLUMN "remindedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PmSeries_tenantId_idx" ON "PmSeries"("tenantId");

-- CreateIndex
CREATE INDEX "PmSeries_tenantId_deletedAt_idx" ON "PmSeries"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "PlannedMaintenanceEvent_remindedAt_idx" ON "PlannedMaintenanceEvent"("remindedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlannedMaintenanceEvent_seriesId_scheduledAt_key" ON "PlannedMaintenanceEvent"("seriesId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "PmSeries" ADD CONSTRAINT "PmSeries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PmSeries" ADD CONSTRAINT "PmSeries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PmSeries" ADD CONSTRAINT "PmSeries_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PmSeries" ADD CONSTRAINT "PmSeries_vendorContractId_fkey" FOREIGN KEY ("vendorContractId") REFERENCES "VendorContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PmSeries" ADD CONSTRAINT "PmSeries_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlannedMaintenanceEvent" ADD CONSTRAINT "PlannedMaintenanceEvent_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "PmSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
