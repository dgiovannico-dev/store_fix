import type { Prisma, Ticket } from "@prisma/client";
import { NotificationType } from "@/domain/notification/types";
import { enqueueEmail } from "@/infrastructure/email/outbox";
import type { EmailTemplateId } from "@/infrastructure/email/templates";
import {
  pushStoreTicketEvent,
  ticketDeepLink,
} from "@/infrastructure/push/store-push";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";
import {
  resolveHqRecipients,
  resolveStoreRecipients,
  resolveVendorRecipients,
  uniqueRecipients,
  type Recipient,
} from "./recipients";

type TicketWithRelations = Ticket & {
  store?: { name: string } | null;
  vendor?: { id: string; name: string; email: string | null } | null;
};

export type EmitKind =
  | "created"
  | "assigned"
  | "cancelled"
  | "done"
  | "breached"
  | "verified"
  | "rejected";

async function createNotifications(input: {
  tenantId: string;
  userIds: string[];
  type: string;
  ticketId: string;
  payload: Prisma.InputJsonValue;
}) {
  if (input.userIds.length === 0) return;
  await prisma.notification.createMany({
    data: input.userIds.map((userId) => ({
      tenantId: input.tenantId,
      userId,
      type: input.type,
      ticketId: input.ticketId,
      payload: input.payload,
    })),
  });
}

async function sendTemplate(input: {
  emails: string[];
  template: EmailTemplateId;
  vars: {
    ticketId: string;
    storeName?: string;
    vendorName?: string;
    summary?: string;
  };
}) {
  const unique = [...new Set(input.emails.filter(Boolean))];
  await Promise.all(
    unique.map((to) =>
      enqueueEmail({
        to,
        template: input.template,
        vars: {
          ...input.vars,
          summary:
            `${input.vars.summary ?? ""}\n${ticketDeepLink(input.vars.ticketId)}`.trim(),
        },
      }),
    ),
  );
}

async function notify(
  tenantId: string,
  ticketId: string,
  type: string,
  recipients: Recipient[],
  payload: Prisma.InputJsonValue,
  template: EmailTemplateId,
  vars: {
    ticketId: string;
    storeName?: string;
    vendorName?: string;
    summary?: string;
  },
  extraEmails: string[] = [],
) {
  const uniq = uniqueRecipients(recipients);
  await createNotifications({
    tenantId,
    userIds: uniq.map((r) => r.userId),
    type,
    ticketId,
    payload,
  });
  await sendTemplate({
    emails: [...uniq.map((r) => r.email), ...extraEmails],
    template,
    vars,
  });
}

const STORE_PUSH_KINDS = new Set(["created", "assigned", "done"]);

async function maybePushStore(input: {
  kind: EmitKind;
  tenantId: string;
  storeId: string;
  storeName: string;
  ticketId: string;
  summary: string;
}) {
  if (!STORE_PUSH_KINDS.has(input.kind)) return;
  const store = await prisma.store.findFirst({
    where: {
      id: input.storeId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
    select: { webhookUrl: true, ntfyTopic: true, name: true },
  });
  if (!store?.webhookUrl && !store?.ntfyTopic) return;

  const titles: Record<string, string> = {
    created: "Nuovo ticket",
    assigned: "Ticket assegnato",
    done: "Intervento completato",
  };
  await pushStoreTicketEvent(
    { webhookUrl: store.webhookUrl, ntfyTopic: store.ntfyTopic },
    {
      event: `ticket.${input.kind}`,
      ticketId: input.ticketId,
      storeId: input.storeId,
      storeName: store.name || input.storeName,
      title: titles[input.kind] ?? "FacilityFlow",
      body: input.summary,
      url: ticketDeepLink(input.ticketId),
    },
  ).catch((e) => console.error("[store-push]", e));
}

/**
 * Notification in-app + email outbox (T3.1).
 * Regole: docs/product/NOTIFICATION_RULES.md
 */
export async function emitTicketNotification(input: {
  kind: EmitKind;
  tenantId: string;
  ticket: TicketWithRelations;
  actorUserId: string;
}) {
  requireTenantId(input.tenantId);
  const storeName = input.ticket.store?.name ?? "punto vendita";
  const ticketId = input.ticket.id;
  const summary = input.ticket.description.slice(0, 200);
  const vendor = input.ticket.vendor;
  const base = {
    storeName,
    actorUserId: input.actorUserId,
  };

  if (input.kind === "created") {
    await notify(
      input.tenantId,
      ticketId,
      NotificationType.ticketCreated,
      await resolveHqRecipients(input.tenantId),
      base,
      "ticket_nuovo",
      { ticketId, storeName, summary },
    );
    await maybePushStore({
      kind: "created",
      tenantId: input.tenantId,
      storeId: input.ticket.storeId,
      storeName,
      ticketId,
      summary,
    });
    return;
  }

  if (input.kind === "assigned") {
    const vendorUsers = vendor
      ? await resolveVendorRecipients(input.tenantId, vendor.id)
      : [];
    await notify(
      input.tenantId,
      ticketId,
      NotificationType.ticketAssigned,
      vendorUsers,
      { ...base, vendorId: vendor?.id, vendorName: vendor?.name },
      "ticket_assign",
      {
        ticketId,
        storeName,
        vendorName: vendor?.name,
        summary,
      },
      vendor?.email ? [vendor.email] : [],
    );
    await maybePushStore({
      kind: "assigned",
      tenantId: input.tenantId,
      storeId: input.ticket.storeId,
      storeName,
      ticketId,
      summary,
    });
    return;
  }

  if (input.kind === "cancelled") {
    const storePeople = await resolveStoreRecipients(
      input.tenantId,
      input.ticket.storeId,
    );
    const vendorUsers = input.ticket.vendorId
      ? await resolveVendorRecipients(input.tenantId, input.ticket.vendorId)
      : [];
    await notify(
      input.tenantId,
      ticketId,
      NotificationType.ticketCancelled,
      uniqueRecipients([...storePeople, ...vendorUsers]),
      { ...base, reason: input.ticket.cancelReason },
      "ticket_cancelled",
      {
        ticketId,
        storeName,
        vendorName: vendor?.name,
        summary: input.ticket.cancelReason ?? summary,
      },
      vendor?.email ? [vendor.email] : [],
    );
    return;
  }

  if (input.kind === "done") {
    const hq = await resolveHqRecipients(input.tenantId);
    const storePeople = await resolveStoreRecipients(
      input.tenantId,
      input.ticket.storeId,
    );
    await notify(
      input.tenantId,
      ticketId,
      NotificationType.ticketDone,
      uniqueRecipients([...hq, ...storePeople]),
      base,
      "ticket_done",
      { ticketId, storeName, vendorName: vendor?.name, summary },
    );
    await maybePushStore({
      kind: "done",
      tenantId: input.tenantId,
      storeId: input.ticket.storeId,
      storeName,
      ticketId,
      summary,
    });
    return;
  }

  if (input.kind === "breached") {
    await notify(
      input.tenantId,
      ticketId,
      NotificationType.ticketBreached,
      await resolveHqRecipients(input.tenantId),
      base,
      "ticket_breach",
      { ticketId, storeName, summary },
    );
    return;
  }

  if (input.kind === "verified") {
    const vendorUsers = input.ticket.vendorId
      ? await resolveVendorRecipients(input.tenantId, input.ticket.vendorId)
      : [];
    const hq = await resolveHqRecipients(input.tenantId);
    await notify(
      input.tenantId,
      ticketId,
      NotificationType.ticketVerified,
      uniqueRecipients([...hq, ...vendorUsers]),
      base,
      "ticket_verified",
      { ticketId, storeName, vendorName: vendor?.name, summary },
      vendor?.email ? [vendor.email] : [],
    );
    return;
  }

  // rejected
  const vendorUsers = input.ticket.vendorId
    ? await resolveVendorRecipients(input.tenantId, input.ticket.vendorId)
    : [];
  const hq = await resolveHqRecipients(input.tenantId);
  await notify(
    input.tenantId,
    ticketId,
    NotificationType.ticketRejected,
    uniqueRecipients([...hq, ...vendorUsers]),
    { ...base, reason: input.ticket.rejectReason },
    "ticket_rejected",
    {
      ticketId,
      storeName,
      vendorName: vendor?.name,
      summary: input.ticket.rejectReason ?? summary,
    },
    vendor?.email ? [vendor.email] : [],
  );
}
