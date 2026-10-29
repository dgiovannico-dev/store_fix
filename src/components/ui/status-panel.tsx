import type { ReactNode } from "react";
import { t } from "@/i18n";

type Kind = "empty" | "loading" | "error";

/** Pattern empty / loading / error accessibile (US-E10-02). */
export function StatusPanel(props: {
  kind: Kind;
  title?: string;
  body?: string;
  children?: ReactNode;
}) {
  const msg = t("it");
  const title =
    props.title ??
    (props.kind === "loading"
      ? msg.common.loading
      : props.kind === "error"
        ? msg.common.error
        : msg.common.empty);

  return (
    <div
      role={props.kind === "error" ? "alert" : "status"}
      aria-live={props.kind === "loading" ? "polite" : undefined}
      className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-6 text-center"
    >
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      {props.body ? (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{props.body}</p>
      ) : null}
      {props.children ? <div className="mt-4">{props.children}</div> : null}
    </div>
  );
}
