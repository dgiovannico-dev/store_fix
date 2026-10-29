CREATE TABLE "VendorContract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "storeId" TEXT,
    "title" TEXT NOT NULL,
    "reference" TEXT,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,
    "annualFee" DECIMAL(12,2),
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorContract_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VendorContract_tenantId_idx" ON "VendorContract"("tenantId");
CREATE INDEX "VendorContract_tenantId_endsOn_idx" ON "VendorContract"("tenantId", "endsOn");
CREATE INDEX "VendorContract_tenantId_vendorId_idx" ON "VendorContract"("tenantId", "vendorId");
ALTER TABLE "VendorContract" ADD CONSTRAINT "VendorContract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorContract" ADD CONSTRAINT "VendorContract_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorContract" ADD CONSTRAINT "VendorContract_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
