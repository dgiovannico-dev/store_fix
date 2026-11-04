import { cn } from "@/lib/utils";

/** Card section for ticket detail — consistent hierarchy. */
export function TicketPanelSection(props: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "emphasize" | "danger";
}) {
  const toneClass =
    props.tone === "emphasize"
      ? "border-[color-mix(in_oklab,var(--primary)_28%,var(--border))] bg-[color-mix(in_oklab,var(--primary)_5%,var(--card))]"
      : props.tone === "danger"
        ? "border-[color-mix(in_oklab,var(--critical)_30%,var(--border))] bg-[color-mix(in_oklab,var(--critical)_4%,var(--card))]"
        : "border-[var(--border)] bg-[var(--card)]";

  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border p-4 sm:p-5",
        toneClass,
        props.className,
      )}
    >
      {props.title ? (
        <header className="mb-4 space-y-1">
          <h2 className="font-[family-name:var(--font-sora)] text-sm font-semibold tracking-tight text-[var(--foreground)]">
            {props.title}
          </h2>
          {props.description ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              {props.description}
            </p>
          ) : null}
        </header>
      ) : null}
      <div className="space-y-4">{props.children}</div>
    </section>
  );
}
