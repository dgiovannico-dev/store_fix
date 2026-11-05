-- F7-08 lite: pgvector + TicketEmbedding (nomic-embed-text 768-d)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "TicketEmbedding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TicketEmbedding_ticketId_chunkIndex_key" ON "TicketEmbedding"("ticketId", "chunkIndex");
CREATE INDEX "TicketEmbedding_tenantId_idx" ON "TicketEmbedding"("tenantId");
CREATE INDEX "TicketEmbedding_ticketId_idx" ON "TicketEmbedding"("ticketId");
CREATE INDEX "TicketEmbedding_tenantId_ticketId_idx" ON "TicketEmbedding"("tenantId", "ticketId");

-- HNSW cosine (approximate); preserve in hand-written migration (Prisma cannot manage)
CREATE INDEX "TicketEmbedding_embedding_hnsw_idx"
  ON "TicketEmbedding"
  USING hnsw ("embedding" vector_cosine_ops);

ALTER TABLE "TicketEmbedding" ADD CONSTRAINT "TicketEmbedding_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketEmbedding" ADD CONSTRAINT "TicketEmbedding_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
