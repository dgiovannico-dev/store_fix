export type SlaBadgeTone = "ok" | "risk" | "breached" | "none";

export type SlaBadge = {
  tone: SlaBadgeTone;
  label: string;
};

export type SlaBadgeLabels = {
  breached: string;
  none: string;
  riskPrefix: string;
  okPrefix: string;
};

const DEFAULT_LABELS: SlaBadgeLabels = {
  breached: "SLA superato",
  none: "SLA —",
  riskPrefix: "SLA a rischio · entro",
  okPrefix: "SLA entro",
};

/**
 * Badge SLA lettura (T3.10).
 * A rischio: &lt;20% tempo rimanente rispetto a opened→due (fallback 4h window).
 */
export function computeSlaBadge(input: {
  slaDueAt: Date | null;
  slaBreachedAt: Date | null;
  openedAt: Date;
  now?: Date;
  dateLocale?: string;
  labels?: SlaBadgeLabels;
}): SlaBadge {
  const now = input.now ?? new Date();
  const loc = input.dateLocale ?? "it-IT";
  const L = input.labels ?? DEFAULT_LABELS;

  if (
    input.slaBreachedAt ||
    (input.slaDueAt && input.slaDueAt.getTime() < now.getTime())
  ) {
    return { tone: "breached", label: L.breached };
  }
  if (!input.slaDueAt) return { tone: "none", label: L.none };

  const total = input.slaDueAt.getTime() - input.openedAt.getTime();
  const remaining = input.slaDueAt.getTime() - now.getTime();
  const due = input.slaDueAt.toLocaleString(loc);
  if (total > 0 && remaining / total < 0.2) {
    return {
      tone: "risk",
      label: `${L.riskPrefix} ${due}`,
    };
  }
  return {
    tone: "ok",
    label: `${L.okPrefix} ${due}`,
  };
}
