import type { Locale } from "@/i18n";

export type EmailTemplateId =
  | "ticket_nuovo"
  | "ticket_assign"
  | "ticket_cancelled"
  | "ticket_breach"
  | "ticket_done"
  | "ticket_verified"
  | "ticket_rejected"
  | "email_verify"
  | "pm_reminder"
  | "rfq_invite"
  | "invite"
  | "password_reset";

export type TemplateVars = {
  ticketId?: string;
  storeName?: string;
  vendorName?: string;
  summary?: string;
  verifyUrl?: string;
  rfqUrl?: string;
  acceptUrl?: string;
  resetUrl?: string;
  role?: string;
};

const brand = "FacilityFlow";

type Rendered = { subject: string; text: string; html: string };

function build(
  locale: Locale,
  vars: TemplateVars,
): Record<EmailTemplateId, Rendered> {
  const ticket = vars.ticketId ?? "—";
  const store =
    vars.storeName ?? (locale === "en" ? "store" : "punto vendita");
  const vendor =
    vars.vendorName ?? (locale === "en" ? "vendor" : "fornitore");
  const summary = vars.summary ?? "";
  const verifyUrl = vars.verifyUrl ?? "#";
  const rfqUrl = vars.rfqUrl ?? "#";
  const acceptUrl = vars.acceptUrl ?? "#";
  const resetUrl = vars.resetUrl ?? "#";
  const role = vars.role ?? "—";

  if (locale === "en") {
    return {
      email_verify: {
        subject: `[${brand}] Confirm your email`,
        text: `Confirm your email address to activate FacilityFlow.\n\nOpen this link (expires in 24 hours):\n${verifyUrl}\n`,
        html: `<p>Confirm your email address to activate <strong>${brand}</strong>.</p><p><a href="${verifyUrl}">Confirm email</a></p><p>The link expires in 24 hours.</p>`,
      },
      ticket_nuovo: {
        subject: `[${brand}] New ticket ${ticket}`,
        text: `A new ticket (${ticket}) was opened for ${store}.\n${summary}\n\nOpen FacilityFlow for triage.`,
        html: `<p>A new ticket <strong>${ticket}</strong> was opened for <strong>${store}</strong>.</p><p>${summary}</p><p>Open FacilityFlow for triage.</p>`,
      },
      ticket_assign: {
        subject: `[${brand}] Ticket ${ticket} assigned`,
        text: `Ticket ${ticket} (${store}) was assigned to ${vendor}.\n${summary}`,
        html: `<p>Ticket <strong>${ticket}</strong> (${store}) was assigned to <strong>${vendor}</strong>.</p><p>${summary}</p>`,
      },
      ticket_cancelled: {
        subject: `[${brand}] Ticket ${ticket} cancelled`,
        text: `Ticket ${ticket} (${store}) was cancelled.\nReason: ${summary}`,
        html: `<p>Ticket <strong>${ticket}</strong> (${store}) was cancelled.</p><p>Reason: ${summary}</p>`,
      },
      ticket_breach: {
        subject: `[${brand}] SLA breached — ticket ${ticket}`,
        text: `WARNING: SLA for ticket ${ticket} (${store}) was breached.\nAct or reassign.`,
        html: `<p><strong>WARNING:</strong> SLA for ticket <strong>${ticket}</strong> (${store}) was breached.</p><p>Act or reassign.</p>`,
      },
      ticket_done: {
        subject: `[${brand}] Work completed — ${ticket}`,
        text: `The vendor marked ticket ${ticket} (${store}) as completed. Verify from the store that everything is OK.`,
        html: `<p>The vendor marked ticket <strong>${ticket}</strong> (${store}) as completed.</p><p>Verify from the store that everything is OK.</p>`,
      },
      ticket_verified: {
        subject: `[${brand}] Ticket verified — ${ticket}`,
        text: `The store positively verified ticket ${ticket} (${store}).`,
        html: `<p>The store positively verified ticket <strong>${ticket}</strong> (${store}).</p>`,
      },
      ticket_rejected: {
        subject: `[${brand}] Verification rejected — ticket ${ticket}`,
        text: `Store verification for ticket ${ticket} (${store}) was rejected.\n${summary}\nThe ticket is back in progress.`,
        html: `<p>Store verification for ticket <strong>${ticket}</strong> (${store}) was rejected.</p><p>${summary}</p><p>The ticket is back in progress.</p>`,
      },
      pm_reminder: {
        subject: `[${brand}] PM reminder — ${store}`,
        text: `Scheduled maintenance visit for ${store}.\n${summary}\n\nOpen FacilityFlow → Calendar.`,
        html: `<p>Scheduled maintenance visit for <strong>${store}</strong>.</p><p>${summary}</p><p>Open FacilityFlow → Calendar.</p>`,
      },
      rfq_invite: {
        subject: `[${brand}] Quote request — ${summary || "RFQ"}`,
        text: `Hi ${vendor},\nyou are invited to submit a quote.\n${summary}\n\nOpen: ${rfqUrl}\n`,
        html: `<p>Hi <strong>${vendor}</strong>,</p><p>you are invited to submit a quote.</p><p>${summary}</p><p><a href="${rfqUrl}">Open RFQ</a></p>`,
      },
      invite: {
        subject: `[${brand}] Workspace invite`,
        text: `You were invited to FacilityFlow with role ${role}.\n\nAccept within 7 days:\n${acceptUrl}\n`,
        html: `<p>You were invited to FacilityFlow with role <strong>${role}</strong>.</p><p><a href="${acceptUrl}">Accept invite</a> (expires in 7 days).</p>`,
      },
      password_reset: {
        subject: `[${brand}] Reset password`,
        text: `You requested a password reset.\n\nOpen (expires in 1 hour):\n${resetUrl}\n\nIf this wasn't you, ignore this email.`,
        html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset password</a> (expires in 1 hour).</p>`,
      },
    };
  }

  return {
    email_verify: {
      subject: `[${brand}] Conferma la tua email`,
      text: `Conferma l'indirizzo email per attivare FacilityFlow.\n\nApri questo link (scade tra 24 ore):\n${verifyUrl}\n`,
      html: `<p>Conferma l'indirizzo email per attivare <strong>${brand}</strong>.</p><p><a href="${verifyUrl}">Conferma email</a></p><p>Il link scade tra 24 ore.</p>`,
    },
    ticket_nuovo: {
      subject: `[${brand}] Nuovo ticket ${ticket}`,
      text: `È stato aperto un nuovo ticket (${ticket}) per ${store}.\n${summary}\n\nApri FacilityFlow per il triage.`,
      html: `<p>È stato aperto un nuovo ticket <strong>${ticket}</strong> per <strong>${store}</strong>.</p><p>${summary}</p><p>Apri FacilityFlow per il triage.</p>`,
    },
    ticket_assign: {
      subject: `[${brand}] Ticket ${ticket} assegnato`,
      text: `Il ticket ${ticket} (${store}) è stato assegnato a ${vendor}.\n${summary}`,
      html: `<p>Il ticket <strong>${ticket}</strong> (${store}) è stato assegnato a <strong>${vendor}</strong>.</p><p>${summary}</p>`,
    },
    ticket_cancelled: {
      subject: `[${brand}] Ticket ${ticket} annullato`,
      text: `Il ticket ${ticket} (${store}) è stato annullato.\nMotivo: ${summary}`,
      html: `<p>Il ticket <strong>${ticket}</strong> (${store}) è stato annullato.</p><p>Motivo: ${summary}</p>`,
    },
    ticket_breach: {
      subject: `[${brand}] SLA superato — ticket ${ticket}`,
      text: `ATTENZIONE: lo SLA del ticket ${ticket} (${store}) è stato superato.\nIntervenire o riassegnare.`,
      html: `<p><strong>ATTENZIONE:</strong> lo SLA del ticket <strong>${ticket}</strong> (${store}) è stato superato.</p><p>Intervenire o riassegnare.</p>`,
    },
    ticket_done: {
      subject: `[${brand}] Intervento completato — ${ticket}`,
      text: `Il vendor ha segnato come completato il ticket ${ticket} (${store}). Verifica dallo store se tutto è a posto.`,
      html: `<p>Il vendor ha segnato come completato il ticket <strong>${ticket}</strong> (${store}).</p><p>Verifica dallo store se tutto è a posto.</p>`,
    },
    ticket_verified: {
      subject: `[${brand}] Ticket verificato — ${ticket}`,
      text: `Lo store ha verificato positivamente il ticket ${ticket} (${store}).`,
      html: `<p>Lo store ha verificato positivamente il ticket <strong>${ticket}</strong> (${store}).</p>`,
    },
    ticket_rejected: {
      subject: `[${brand}] Verifica rifiutata — ticket ${ticket}`,
      text: `La verifica dello store per il ticket ${ticket} (${store}) è stata rifiutata.\n${summary}\nIl ticket è tornato in lavorazione.`,
      html: `<p>La verifica dello store per il ticket <strong>${ticket}</strong> (${store}) è stata rifiutata.</p><p>${summary}</p><p>Il ticket è tornato in lavorazione.</p>`,
    },
    pm_reminder: {
      subject: `[${brand}] Promemoria PM — ${store}`,
      text: `Visita di manutenzione programmata per ${store}.\n${summary}\n\nApri FacilityFlow → Calendario.`,
      html: `<p>Visita di manutenzione programmata per <strong>${store}</strong>.</p><p>${summary}</p><p>Apri FacilityFlow → Calendario.</p>`,
    },
    rfq_invite: {
      subject: `[${brand}] Richiesta preventivo — ${summary || "RFQ"}`,
      text: `Ciao ${vendor},\nsei invitato a presentare un preventivo.\n${summary}\n\nApri: ${rfqUrl}\n`,
      html: `<p>Ciao <strong>${vendor}</strong>,</p><p>sei invitato a presentare un preventivo.</p><p>${summary}</p><p><a href="${rfqUrl}">Apri RFQ</a></p>`,
    },
    invite: {
      subject: `[${brand}] Invito al workspace`,
      text: `Sei stato invitato su FacilityFlow con ruolo ${role}.\n\nAccetta entro 7 giorni:\n${acceptUrl}\n`,
      html: `<p>Sei stato invitato su FacilityFlow con ruolo <strong>${role}</strong>.</p><p><a href="${acceptUrl}">Accetta invito</a> (scade tra 7 giorni).</p>`,
    },
    password_reset: {
      subject: `[${brand}] Reimposta password`,
      text: `Hai richiesto il reset della password.\n\nApri (scade tra 1 ora):\n${resetUrl}\n\nSe non sei stato tu, ignora questa email.`,
      html: `<p>Hai richiesto il reset della password.</p><p><a href="${resetUrl}">Reimposta password</a> (scade tra 1 ora).</p>`,
    },
  };
}

export function renderEmailTemplate(
  id: EmailTemplateId,
  vars: TemplateVars = {},
  locale: Locale = "it",
): Rendered {
  return build(locale, vars)[id];
}
