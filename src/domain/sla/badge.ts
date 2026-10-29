export type SlaBadgeTone = "ok" | "risk" | "breached" | "none";

export type SlaBadge = {
  tone: SlaBadgeTone;
  label: string;
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
}): SlaBadge {
  const now = input.now ?? new Date();
  if (input.slaBreachedAt || (input.slaDueAt && input.slaDueAt.getTime() < now.getTime())) {
    return { tone: "breached", label: "SLA superato" };
  }
  if (!input.slaDueAt) return { tone: "none", label: "SLA —" };

  const total = input.slaDueAt.getTime() - input.openedAt.getTime();
  const remaining = input.slaDueAt.getTime() - now.getTime();
  if (total > 0 && remaining / total < 0.2) {
    return {
      tone: "risk",
      label: `SLA a rischio · entro ${input.slaDueAt.toLocaleString("it-IT")}`,
    };
  }
  return {
    tone: "ok",
    label: `SLA entro ${input.slaDueAt.toLocaleString("it-IT")}`,
  };
}
