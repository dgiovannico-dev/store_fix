import { redirect } from "next/navigation";
import { TicketStatus } from "@prisma/client";
import { auth } from "@/auth";
import { WallboardClient } from "@/components/wallboard/wallboard-client";
import { prisma } from "@/infrastructure/db/prisma";

/** F6-09 — TV mode aperti + breach. */
export default async function WallboardPage() {
  const session = await auth();
  if (!session?.tenantId) redirect("/login");

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId: session.tenantId,
      deletedAt: null,
      OR: [
        {
          status: {
            in: [
              TicketStatus.open,
              TicketStatus.assigned,
              TicketStatus.in_progress,
              TicketStatus.waiting_parts,
            ],
          },
        },
        { slaBreachedAt: { not: null }, status: { not: TicketStatus.verified } },
      ],
    },
    include: { store: { select: { name: true } } },
    orderBy: [{ slaBreachedAt: "desc" }, { openedAt: "asc" }],
    take: 80,
  });

  return (
    <WallboardClient
      tickets={tickets.map((t) => ({
        id: t.id,
        storeName: t.store.name,
        category: t.category,
        priority: t.priority,
        status: t.status,
        breached: Boolean(t.slaBreachedAt),
        openedAt: t.openedAt.toISOString(),
      }))}
    />
  );
}
