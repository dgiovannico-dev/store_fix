-- F9-01 DigestAck + F9-03 TicketVendorNudge
CREATE TABLE "DigestAck" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigestAck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DigestAck_tenantId_userId_weekKey_key" ON "DigestAck"("tenantId", "userId", "weekKey");
CREATE INDEX "DigestAck_tenantId_weekKey_idx" ON "DigestAck"("tenantId", "weekKey");

ALTER TABLE "DigestAck" ADD CONSTRAINT "DigestAck_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TicketVendorNudge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketVendorNudge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TicketVendorNudge_ticketId_key" ON "TicketVendorNudge"("ticketId");
CREATE INDEX "TicketVendorNudge_tenantId_idx" ON "TicketVendorNudge"("tenantId");

ALTER TABLE "TicketVendorNudge" ADD CONSTRAINT "TicketVendorNudge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
