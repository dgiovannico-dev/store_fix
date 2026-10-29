-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "tenantId" TEXT NOT NULL,
    "skippedAt" TIMESTAMP(3),
    "sampleTicketSkipped" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("tenantId")
);

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
