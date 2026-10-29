import { RRule, rrulestr } from "rrule";

const MAX_OCCURRENCES = 120;

/**
 * Espande RRULE in date di occorrenza entro [from, to] (F3-05).
 * Accetta body `FREQ=…` o stringa completa con DTSTART.
 */
export function expandRruleOccurrences(input: {
  rrule: string;
  dtstart: Date;
  until?: Date | null;
  from: Date;
  to: Date;
}): Date[] {
  const body = input.rrule.trim().replace(/^RRULE:/i, "");
  if (!body) return [];

  let rule: RRule;
  try {
    if (/DTSTART/i.test(input.rrule)) {
      rule = rrulestr(input.rrule) as RRule;
    } else {
      rule = rrulestr(`DTSTART:${toIcalUtc(input.dtstart)}\nRRULE:${body}`) as RRule;
    }
  } catch {
    return [];
  }

  const windowEnd =
    input.until && input.until < input.to ? input.until : input.to;
  const dates = rule.between(input.from, windowEnd, true);
  return dates.slice(0, MAX_OCCURRENCES);
}

function toIcalUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Preset UI → RRULE body. */
export function rrulePreset(preset: "weekly" | "monthly" | "quarterly"): string {
  switch (preset) {
    case "weekly":
      return "FREQ=WEEKLY;INTERVAL=1";
    case "monthly":
      return "FREQ=MONTHLY;INTERVAL=1";
    case "quarterly":
      return "FREQ=MONTHLY;INTERVAL=3";
  }
}
