-- T4.17: composite indexes for HQ list / dashboard filters
CREATE INDEX IF NOT EXISTS "Ticket_tenantId_slaDueAt_idx" ON "Ticket"("tenantId", "slaDueAt");
CREATE INDEX IF NOT EXISTS "Ticket_tenantId_verifiedAt_idx" ON "Ticket"("tenantId", "verifiedAt");
