/**
 * Seed DEMO locale — non usare in produzione.
 * Credenziali: owner@demo.facilityflow.local / DemoOwner123!
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensureDefaultSlaPolicies } from "../src/domain/sla/defaults";

const prisma = new PrismaClient();

async function main() {
  const email = "owner@demo.facilityflow.local";
  const passwordHash = await bcrypt.hash("DemoOwner123!", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: "Demo Owner" },
    create: {
      email,
      name: "Demo Owner",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-retail" },
    update: { name: "Demo Retail Italia", active: true },
    create: {
      name: "Demo Retail Italia",
      slug: "demo-retail",
      region: "EU",
    },
  });

  await prisma.membership.upsert({
    where: {
      tenantId_userId: { tenantId: tenant.id, userId: user.id },
    },
    update: { role: Role.owner, deletedAt: null, storeIds: [] },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: Role.owner,
      storeIds: [],
    },
  });

  await ensureDefaultSlaPolicies(prisma, tenant.id);

  await prisma.onboardingProgress.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, sampleTicketSkipped: true },
    update: {},
  });

  console.log("Seed OK");
  console.log(`  tenant: ${tenant.slug} (${tenant.id})`);
  console.log(`  owner:  ${email} / DemoOwner123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
