-- CreateEnum
CREATE TYPE "QuoteRequestStatus" AS ENUM ('open', 'awarded', 'cancelled');

-- CreateEnum
CREATE TYPE "QuoteBidStatus" AS ENUM ('invited', 'submitted', 'withdrawn');

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketId" TEXT,
    "storeId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMP(3),
    "awardedBidId" TEXT,
    "createdByUserId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteBid" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "QuoteBidStatus" NOT NULL DEFAULT 'invited',
    "amountEur" DECIMAL(12,2),
    "note" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteRequest_tenantId_status_idx" ON "QuoteRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "QuoteRequest_tenantId_ticketId_idx" ON "QuoteRequest"("tenantId", "ticketId");

-- CreateIndex
CREATE INDEX "QuoteBid_tenantId_vendorId_idx" ON "QuoteBid"("tenantId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteBid_quoteRequestId_vendorId_key" ON "QuoteBid"("quoteRequestId", "vendorId");

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuoteBid" ADD CONSTRAINT "QuoteBid_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuoteBid" ADD CONSTRAINT "QuoteBid_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuoteBid" ADD CONSTRAINT "QuoteBid_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
