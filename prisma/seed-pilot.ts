/**
 * Seed pilota 15 store × 5 vendor (US-E10-04 / T4.1).
 * Idempotente su slug `pilot-retail`.
 *
 * Credenziali QA (solo locale):
 *   owner@pilot.facilityflow.local / PilotOwner123!
 *   finance@pilot.facilityflow.local / PilotFinance123!
 *   vendor0@pilot.facilityflow.local / PilotVendor123!
 *
 * Uso: npx tsx prisma/seed-pilot.ts
 */
import {
  PrismaClient,
  Role,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensureDefaultSlaPolicies } from "../src/domain/sla/defaults";

const prisma = new PrismaClient();

const CITIES = [
  "Milano",
  "Roma",
  "Torino",
  "Napoli",
  "Bologna",
  "Firenze",
  "Genova",
  "Padova",
  "Verona",
  "Bari",
  "Catania",
  "Palermo",
  "Brescia",
  "Parma",
  "Modena",
];

async function main() {
  const ownerEmail = "owner@pilot.facilityflow.local";
  const financeEmail = "finance@pilot.facilityflow.local";
  const ownerHash = await bcrypt.hash("PilotOwner123!", 12);
  const financeHash = await bcrypt.hash("PilotFinance123!", 12);
  const vendorHash = await bcrypt.hash("PilotVendor123!", 12);

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { passwordHash: ownerHash, name: "Pilot Owner", emailVerified: new Date() },
    create: {
      email: ownerEmail,
      name: "Pilot Owner",
      passwordHash: ownerHash,
      emailVerified: new Date(),
    },
  });

  const finance = await prisma.user.upsert({
    where: { email: financeEmail },
    update: {
      passwordHash: financeHash,
      name: "Pilot Finance",
      emailVerified: new Date(),
    },
    create: {
      email: financeEmail,
      name: "Pilot Finance",
      passwordHash: financeHash,
      emailVerified: new Date(),
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "pilot-retail" },
    update: { name: "Pilota Retail Italia", active: true, region: "EU" },
    create: {
      name: "Pilota Retail Italia",
      slug: "pilot-retail",
      region: "EU",
    },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
    update: { role: Role.owner, deletedAt: null, storeIds: [] },
    create: {
      tenantId: tenant.id,
      userId: owner.id,
      role: Role.owner,
      storeIds: [],
    },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: finance.id } },
    update: { role: Role.viewer_finance, deletedAt: null, storeIds: [] },
    create: {
      tenantId: tenant.id,
      userId: finance.id,
      role: Role.viewer_finance,
      storeIds: [],
    },
  });

  await ensureDefaultSlaPolicies(prisma, tenant.id);

  const stores = [];
  for (let i = 0; i < 15; i++) {
    const name = `PV ${CITIES[i]} ${i + 1}`;
    const existing = await prisma.store.findFirst({
      where: { tenantId: tenant.id, name, deletedAt: null },
    });
    if (existing) {
      stores.push(existing);
      continue;
    }
    stores.push(
      await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name,
          city: CITIES[i],
          timezone: "Europe/Rome",
          address: `Via Demo ${i + 1}`,
        },
      }),
    );
  }

  const vendors = [];
  const trades = ["frigo", "hvac", "elettrico", "idraulico", "porte"];
  for (let i = 0; i < 5; i++) {
    const email = `vendor${i}@pilot.facilityflow.local`;
    const name = `Vendor ${trades[i]} SpA`;
    let vendor = await prisma.vendor.findFirst({
      where: { tenantId: tenant.id, name, deletedAt: null },
    });
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          tenantId: tenant.id,
          name,
          email,
          trades: [trades[i]],
          storeCoverageIds: stores.map((s) => s.id),
        },
      });
    }
    vendors.push(vendor);

    const vUser = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: vendorHash,
        name: `Tecnico ${i}`,
        emailVerified: new Date(),
      },
      create: {
        email,
        name: `Tecnico ${i}`,
        passwordHash: vendorHash,
        emailVerified: new Date(),
      },
    });
    await prisma.membership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: vUser.id } },
      update: {
        role: Role.vendor,
        vendorId: vendor.id,
        deletedAt: null,
        storeIds: [],
      },
      create: {
        tenantId: tenant.id,
        userId: vUser.id,
        role: Role.vendor,
        vendorId: vendor.id,
        storeIds: [],
      },
    });
  }

  // Asset sample + tickets multi-stato
  for (let i = 0; i < 15; i++) {
    const store = stores[i]!;
    const assetLabel = `Asset frigo ${i + 1}`;
    let asset = await prisma.asset.findFirst({
      where: { tenantId: tenant.id, storeId: store.id, label: assetLabel },
    });
    if (!asset) {
      asset = await prisma.asset.create({
        data: {
          tenantId: tenant.id,
          storeId: store.id,
          category: "frigo",
          label: assetLabel,
          preferredVendorId: vendors[0]!.id,
        },
      });
    }

    const existingTk = await prisma.ticket.findFirst({
      where: {
        tenantId: tenant.id,
        storeId: store.id,
        description: `Ticket pilota ${i + 1}`,
      },
    });
    if (existingTk) continue;

    const openedAt = new Date(Date.now() - (i + 1) * 36e5);
    const statusCycle = [
      TicketStatus.open,
      TicketStatus.triaged,
      TicketStatus.assigned,
      TicketStatus.in_progress,
      TicketStatus.done,
      TicketStatus.verified,
      TicketStatus.assigned,
      TicketStatus.open,
      TicketStatus.verified,
      TicketStatus.in_progress,
      TicketStatus.done,
      TicketStatus.assigned,
      TicketStatus.open,
      TicketStatus.verified,
      TicketStatus.triaged,
    ] as const;
    const status = statusCycle[i]!;
    const vendorId =
      status === TicketStatus.open || status === TicketStatus.triaged
        ? null
        : vendors[i % 5]!.id;

    await prisma.ticket.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        assetId: asset.id,
        category: i % 2 === 0 ? "frigo" : "hvac",
        priority:
          i % 3 === 0 ? TicketPriority.critical : TicketPriority.normal,
        status,
        description: `Ticket pilota ${i + 1}`,
        vendorId,
        openedAt,
        slaDueAt: new Date(openedAt.getTime() + 4 * 36e5),
        slaBreachedAt: i % 5 === 0 ? new Date() : null,
        actualCost:
          status === TicketStatus.done || status === TicketStatus.verified
            ? 100 + i * 10
            : null,
        verifiedAt:
          status === TicketStatus.verified
            ? new Date(openedAt.getTime() + 6 * 36e5)
            : null,
        doneAt:
          status === TicketStatus.done || status === TicketStatus.verified
            ? new Date(openedAt.getTime() + 5 * 36e5)
            : null,
        assignedAt: vendorId ? openedAt : null,
      },
    });
  }

  await prisma.onboardingProgress.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      sampleTicketSkipped: true,
    },
    update: { sampleTicketSkipped: true },
  });

  console.log("Seed pilota OK");
  console.log(`  tenant: pilot-retail (${tenant.id})`);
  console.log(`  stores: ${stores.length} · vendors: ${vendors.length}`);
  console.log(`  owner:   ${ownerEmail} / PilotOwner123!`);
  console.log(`  finance: ${financeEmail} / PilotFinance123!`);
  console.log(`  vendor:  vendor0@pilot.facilityflow.local / PilotVendor123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
