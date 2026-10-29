-- CreateIndex
CREATE INDEX "Ticket_tenantId_storeId_idx" ON "Ticket"("tenantId", "storeId");

-- CreateIndex
CREATE INDEX "Ticket_tenantId_vendorId_idx" ON "Ticket"("tenantId", "vendorId");

-- CreateIndex
CREATE INDEX "TicketEvent_tenantId_ticketId_createdAt_idx" ON "TicketEvent"("tenantId", "ticketId", "createdAt");
