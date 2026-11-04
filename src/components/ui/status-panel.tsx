import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { t, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

type Kind = "empty" | "loading" | "error";

/** Pattern empty / loading / error accessibile (US-E10-02 / F5-UX-00). */
export function StatusPanel(props: {
  kind: Kind;
  title?: string;
  body?: string;
  locale?: Locale;
  children?: ReactNode;
  className?: string;
}) {
  const msg = t(props.locale ?? "it");
  const title =
    props.title ??
    (props.kind === "loading"
      ? msg.common.loading
      : props.kind === "error"
        ? msg.common.error
        : msg.common.empty);

  const Icon =
    props.kind === "loading"
      ? Loader2
      : props.kind === "error"
        ? AlertCircle
        : Inbox;

  return (
    <div
      role={props.kind === "error" ? "alert" : "status"}
      aria-live={props.kind === "loading" ? "polite" : undefined}
      className={cn(
        "flex flex-col items-center gap-3 px-4 py-10 text-center",
        props.className,
      )}
    >
      <Badge
        variant={
          props.kind === "error"
            ? "critical"
            : props.kind === "loading"
              ? "secondary"
              : "outline"
        }
        className="gap-1.5 px-2.5 py-1"
      >
        <Icon
          className={cn(
            "size-3.5",
            props.kind === "loading" && "animate-spin",
          )}
        />
        {props.kind === "error"
          ? "Errore"
          : props.kind === "loading"
            ? "…"
            : "Vuoto"}
      </Badge>
      <p className="font-[family-name:var(--font-sora)] text-[length:var(--text-h3)] font-semibold text-[var(--foreground)]">
        {title}
      </p>
      {props.body ? (
        <p className="max-w-md text-sm text-[var(--muted-foreground)]">
          {props.body}
        </p>
      ) : null}
      {props.children ? <div className="mt-2">{props.children}</div> : null}
    </div>
  );
}
