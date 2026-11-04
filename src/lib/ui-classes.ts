/** Shared native control classes (select/textarea) aligned to Input/Button. */
export const controlClass =
  "flex h-10 w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-base outline-none ring-[var(--ring)] placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export const textareaClass =
  "flex min-h-[5rem] w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-base outline-none ring-[var(--ring)] placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export const tableHeadClass =
  "border-b border-[var(--border)] text-[length:var(--text-caption)] uppercase tracking-wide text-[var(--muted-foreground)]";

export const tableRowClass =
  "border-b border-[var(--border)]/70 hover:bg-[var(--muted)]/40";
