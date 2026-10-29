CREATE TABLE "InboundEmailMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "ticketId" TEXT,
    "fromAddress" TEXT,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InboundEmailMessage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InboundEmailMessage_tenantId_messageId_key" ON "InboundEmailMessage"("tenantId", "messageId");
CREATE INDEX "InboundEmailMessage_tenantId_idx" ON "InboundEmailMessage"("tenantId");
ALTER TABLE "InboundEmailMessage" ADD CONSTRAINT "InboundEmailMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
