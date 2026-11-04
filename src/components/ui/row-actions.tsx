"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  Archive,
  Check,
  Loader2,
  Pencil,
  TicketPlus,
  Upload,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type RowActionVariant =
  | "edit"
  | "archive"
  | "disable"
  | "cancel"
  | "done"
  | "import"
  | "openTicket";

const VARIANTS: Record<
  RowActionVariant,
  { Icon: LucideIcon; className: string }
> = {
  edit: {
    Icon: Pencil,
    className:
      "text-[var(--primary)] underline-offset-4 hover:underline",
  },
  archive: {
    Icon: Archive,
    className:
      "text-[var(--critical)] underline-offset-4 hover:underline",
  },
  disable: {
    Icon: UserX,
    className:
      "text-[var(--critical)] underline-offset-4 hover:underline",
  },
  cancel: {
    Icon: X,
    className:
      "text-[var(--critical)] underline-offset-4 hover:underline",
  },
  done: {
    Icon: Check,
    className:
      "rounded-[var(--radius)] bg-[var(--primary)] px-3 py-1.5 font-medium text-[var(--primary-foreground)] hover:opacity-90",
  },
  import: {
    Icon: Upload,
    className:
      "font-medium text-[var(--primary)] underline-offset-4 hover:underline",
  },
  openTicket: {
    Icon: TicketPlus,
    className:
      "rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-[var(--foreground)] hover:bg-[var(--muted)]",
  },
};

const baseClass =
  "inline-flex items-center gap-1.5 text-sm transition-opacity";

export function RowActionLink(props: {
  href: string;
  label: string;
  variant?: Extract<RowActionVariant, "edit" | "import" | "openTicket">;
  className?: string;
}) {
  const variant = props.variant ?? "edit";
  const { Icon, className: tone } = VARIANTS[variant];
  return (
    <Link
      href={props.href}
      className={cn(baseClass, tone, props.className)}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>{props.label}</span>
    </Link>
  );
}

export function RowActionSubmit(props: {
  label: string;
  /** Shown while the parent form is submitting (defaults to label + …). */
  pendingLabel?: string;
  variant: Extract<
    RowActionVariant,
    "archive" | "disable" | "cancel" | "done"
  >;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const { Icon, className: tone } = VARIANTS[props.variant];
  const pendingLabel = props.pendingLabel ?? `${props.label}…`;
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        baseClass,
        tone,
        "disabled:opacity-60",
        props.className,
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Icon className="size-3.5 shrink-0" aria-hidden />
      )}
      <span>{pending ? pendingLabel : props.label}</span>
    </button>
  );
}
