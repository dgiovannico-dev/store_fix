"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type MultiCheckOption = { id: string; label: string };

export function MultiCheckPicker(props: {
  name: string;
  legend: string;
  options: MultiCheckOption[];
  defaultSelected?: string[];
  searchPlaceholder: string;
  selectedCountLabel: string;
  selectAllLabel: string;
  clearLabel: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(props.defaultSelected ?? []),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.options;
    return props.options.filter((o) => o.label.toLowerCase().includes(q));
  }, [props.options, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const o of filtered) next.add(o.id);
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
  }

  return (
    <fieldset className={cn("space-y-2", props.className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <legend className="text-sm font-medium">{props.legend}</legend>
        <p className="text-xs text-[var(--muted-foreground)]">
          {props.selectedCountLabel.replace("{n}", String(selected.size))}
        </p>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={props.searchPlaceholder}
        className="flex h-9 w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none ring-[var(--ring)] placeholder:text-[var(--muted-foreground)] focus-visible:ring-2"
        aria-label={props.searchPlaceholder}
      />
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={selectFiltered}
          className="text-[var(--primary)] underline-offset-4 hover:underline"
        >
          {props.selectAllLabel}
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="text-[var(--muted-foreground)] underline-offset-4 hover:underline"
        >
          {props.clearLabel}
        </button>
      </div>
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] p-2">
        {filtered.length === 0 ? (
          <p className="px-1 py-2 text-sm text-[var(--muted-foreground)]">—</p>
        ) : (
          filtered.map((o) => {
            const checked = selected.has(o.id);
            return (
              <label
                key={o.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-[calc(var(--radius)-2px)] px-2 py-1.5 text-sm hover:bg-[var(--muted)]/50",
                  checked && "bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]",
                )}
              >
                <input
                  type="checkbox"
                  name={props.name}
                  value={o.id}
                  checked={checked}
                  onChange={() => toggle(o.id)}
                  className="accent-[var(--primary)]"
                />
                <span className="min-w-0 truncate">{o.label}</span>
              </label>
            );
          })
        )}
      </div>
    </fieldset>
  );
}
