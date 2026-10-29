/**
 * Dataset stress opzionale ~50 store × N ticket (T4.2).
 * Non bloccante per DoD S4. Default: 50 store × 100 ticket (veloce).
 * Full: STRESS_TICKETS=5000 npm run db:seed:stress
 *
 * Tenant slug: stress-retail
 */
import {
  Prisma,
  PrismaClient,
  Role,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensureDefaultSlaPolicies } from "../src/domain/sla/defaults";

const prisma = new PrismaClient();
const STORE_N = Number(process.env.STRESS_STORES ?? 50);
const TICKET_N = Number(process.env.STRESS_TICKETS ?? 100);

async function main() {
  const email = "owner@stress.facilityflow.local";
  const hash = await bcrypt.hash("StressOwner123!", 12);
  const owner = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, emailVerified: new Date() },
    create: {
      email,
      name: "Stress Owner",
      passwordHash: hash,
      emailVerified: new Date(),
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "stress-retail" },
    update: { name: "Stress Retail", active: true },
    create: { name: "Stress Retail", slug: "stress-retail", region: "EU" },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
    update: { role: Role.owner, deletedAt: null },
    create: {
      tenantId: tenant.id,
      userId: owner.id,
      role: Role.owner,
      storeIds: [],
    },
  });
  await ensureDefaultSlaPolicies(prisma, tenant.id);

  const stores = [];
  for (let i = 0; i < STORE_N; i++) {
    const name = `Stress PV ${i + 1}`;
    let s = await prisma.store.findFirst({
      where: { tenantId: tenant.id, name, deletedAt: null },
    });
    if (!s) {
      s = await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name,
          city: "Milano",
          timezone: "Europe/Rome",
        },
      });
    }
    stores.push(s);
  }

  const existing = await prisma.ticket.count({ where: { tenantId: tenant.id } });
  const toCreate = Math.max(0, TICKET_N - existing);
  const batch: Prisma.TicketCreateManyInput[] = [];
  const statuses = [
    TicketStatus.open,
    TicketStatus.assigned,
    TicketStatus.in_progress,
    TicketStatus.done,
    TicketStatus.verified,
  ];
  for (let i = 0; i < toCreate; i++) {
    const store = stores[i % stores.length]!;
    const openedAt = new Date(Date.now() - (i % 720) * 3600_000);
    batch.push({
      tenantId: tenant.id,
      storeId: store.id,
      category: i % 2 === 0 ? "frigo" : "hvac",
      priority: i % 5 === 0 ? TicketPriority.critical : TicketPriority.normal,
      status: statuses[i % statuses.length]!,
      description: `Stress ticket ${existing + i + 1}`,
      openedAt,
      slaDueAt: new Date(openedAt.getTime() + 4 * 3600_000),
    });
    if (batch.length >= 500) {
      await prisma.ticket.createMany({ data: batch });
      batch.length = 0;
    }
  }
  if (batch.length) await prisma.ticket.createMany({ data: batch });

  const total = await prisma.ticket.count({ where: { tenantId: tenant.id } });
  console.log(
    `Stress seed OK · stores=${stores.length} · tickets=${total} · slug=stress-retail`,
  );
  console.log(`  login: ${email} / StressOwner123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
