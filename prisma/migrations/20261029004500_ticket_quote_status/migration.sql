CREATE TYPE "QuoteStatus" AS ENUM ('pending', 'accepted', 'rejected');
ALTER TABLE "Ticket" ADD COLUMN "quoteStatus" "QuoteStatus";
