export type EmailTemplateId =
  | "ticket_nuovo"
  | "ticket_assign"
  | "ticket_cancelled"
  | "ticket_breach"
  | "ticket_done"
  | "ticket_verified"
  | "ticket_rejected"
  | "email_verify"
  | "pm_reminder";

export type TemplateVars = {
  ticketId?: string;
  storeName?: string;
  vendorName?: string;
  summary?: string;
  verifyUrl?: string;
};

const brand = "FacilityFlow";

export function renderEmailTemplate(
  id: EmailTemplateId,
  vars: TemplateVars = {},
): { subject: string; text: string; html: string } {
  const ticket = vars.ticketId ?? "—";
  const store = vars.storeName ?? "punto vendita";
  const vendor = vars.vendorName ?? "fornitore";
  const summary = vars.summary ?? "";
  const verifyUrl = vars.verifyUrl ?? "#";

  const templates: Record<
    EmailTemplateId,
    { subject: string; text: string; html: string }
  > = {
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
  };

  return templates[id];
}
