import { TicketPriority } from "@prisma/client";

export type ParsedInboundEmail = {
  storeHint: string | null;
  category: string;
  priority: TicketPriority;
  description: string;
  subject: string;
};

const STORE_RE = /(?:\[store:([^\]]+)\]|PV:\s*([^\-|–]+))/i;

/**
 * Parsing subject/body → bozza ticket (F2-08).
 * Convenzione IT: subject contiene `[store:Nome PV]` oppure `PV: Nome`.
 */
export function parseInboundEmail(input: {
  subject: string;
  text: string;
  from?: string;
}): ParsedInboundEmail {
  const subject = input.subject.trim() || "(senza oggetto)";
  const text = input.text.trim();
  const storeMatch = subject.match(STORE_RE) ?? text.match(STORE_RE);
  const storeHint =
    storeMatch?.[1]?.trim() || storeMatch?.[2]?.trim() || null;

  const hay = `${subject}\n${text}`.toLowerCase();
  // Allineato a INTAKE_CATEGORIES (F2-01) — niente categorie orphan
  let category = "altro";
  if (/frigo|refriger|banco freddo/.test(hay)) category = "frigo";
  else if (/hvac|clima|condizion/.test(hay)) category = "hvac";
  else if (/cassa|pos|registratore/.test(hay)) category = "casse";
  else if (/elettric|luce|quadro|illumin|neon|lampad/.test(hay))
    category = "illuminazione";
  else if (/porta|serranda|ingresso/.test(hay)) category = "porte";
  else if (/idraul|perdita|acqua/.test(hay)) category = "altro";

  const priority =
    /critic|urgent|emergenza|asap/.test(hay)
      ? TicketPriority.critical
      : /alto|high|priorit/.test(hay)
        ? TicketPriority.high
        : TicketPriority.normal;

  const fromLine = input.from ? `Da: ${input.from}\n` : "";
  const description = `${fromLine}Oggetto: ${subject}\n\n${text || subject}`.slice(
    0,
    4000,
  );

  return { storeHint, category, priority, description, subject };
}
