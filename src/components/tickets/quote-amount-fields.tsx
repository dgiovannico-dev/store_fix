type Props = {
  defaultAmount?: number | string | null;
  defaultNote?: string | null;
  /** Obbligatorio: niente default IT hardcoded (passare da catalogo). */
  amountLabel: string;
  noteLabel: string;
  noteRequired?: boolean;
  className?: string;
};

/**
 * Campi condivisi preventivo / RFQ bid (retro F3).
 * `name=amountEur` + `name=note` per server actions esistenti.
 */
export function QuoteAmountFields({
  defaultAmount,
  defaultNote,
  amountLabel,
  noteLabel,
  noteRequired = false,
  className = "mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-base",
}: Props) {
  const defaultValue =
    defaultAmount === null || defaultAmount === undefined
      ? undefined
      : String(defaultAmount);

  return (
    <>
      <label className="block text-sm font-medium">
        {amountLabel}
        <input
          name="amountEur"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaultValue}
          className={className}
        />
      </label>
      <label className="block text-sm font-medium">
        {noteLabel}
        <input
          name="note"
          maxLength={500}
          required={noteRequired}
          defaultValue={defaultNote ?? undefined}
          className={className}
        />
      </label>
    </>
  );
}
