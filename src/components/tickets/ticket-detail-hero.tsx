import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlaBadge } from "@/components/tickets/sla-badge";
import type { SlaBadgeTone } from "@/domain/sla/badge";

export function TicketDetailHero(props: {
  backHref: string;
  backLabel: string;
  createdBanner?: string | null;
  title: string;
  descriptionLead: string;
  categoryLabel: string;
  priorityLabel: string;
  statusLabel: string;
  storeName: string;
  storeLabel: string;
  vendorName?: string | null;
  vendorLabel: string;
  assetLabel?: string | null;
  assetPrefix: string;
  ticketId: string;
  ticketIdLabel: string;
  slaTone: SlaBadgeTone;
  slaLabel: string;
  rfqHref?: string | null;
  rfqLabel?: string | null;
  cancelReason?: string | null;
  cancelReasonLabel?: string | null;
  rejectReason?: string | null;
  rejectReasonLabel?: string | null;
}) {
  return (
    <header className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_0_color-mix(in_oklab,var(--foreground)_6%,transparent)]">
      <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_6%,var(--card)),var(--card))] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={props.backHref}>
              <ChevronLeft className="size-4" aria-hidden />
              {props.backLabel}
            </Link>
          </Button>
          {props.rfqHref && props.rfqLabel ? (
            <Button asChild variant="outline" size="sm">
              <Link href={props.rfqHref}>{props.rfqLabel}</Link>
            </Button>
          ) : null}
        </div>

        {props.createdBanner ? (
          <p
            className="mt-3 rounded-[var(--radius)] border border-[var(--success)] bg-[color-mix(in_oklab,var(--success)_8%,var(--card))] px-3 py-2 text-sm text-[var(--success)]"
            role="status"
          >
            {props.createdBanner}{" "}
            <code className="text-xs">{props.ticketId}</code>
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SlaBadge tone={props.slaTone} label={props.slaLabel} />
          <Badge variant="secondary">{props.statusLabel}</Badge>
          <Badge variant="outline">{props.categoryLabel}</Badge>
          <Badge variant="outline">
            {props.priorityLabel}
          </Badge>
        </div>

        <h1 className="mt-4 font-[family-name:var(--font-sora)] text-xl font-semibold leading-snug tracking-tight text-[var(--foreground)] sm:text-2xl">
          {props.title}
        </h1>
        {props.descriptionLead &&
        props.descriptionLead !== props.title ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            {props.descriptionLead}
          </p>
        ) : null}

        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <div className="min-w-0">
            <dt className="text-xs text-[var(--muted-foreground)]">
              {props.storeLabel}
            </dt>
            <dd className="font-medium text-[var(--foreground)]">
              {props.storeName}
            </dd>
          </div>
          {props.vendorName ? (
            <div className="min-w-0">
              <dt className="text-xs text-[var(--muted-foreground)]">
                {props.vendorLabel}
              </dt>
              <dd className="font-medium text-[var(--foreground)]">
                {props.vendorName}
              </dd>
            </div>
          ) : null}
          {props.assetLabel ? (
            <div className="min-w-0">
              <dt className="text-xs text-[var(--muted-foreground)]">
                {props.assetPrefix.replace(/:$/, "")}
              </dt>
              <dd className="font-medium text-[var(--foreground)]">
                {props.assetLabel}
              </dd>
            </div>
          ) : null}
          <div className="min-w-0">
            <dt className="text-xs text-[var(--muted-foreground)]">
              {props.ticketIdLabel}
            </dt>
            <dd>
              <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs text-[var(--foreground)]">
                {props.ticketId}
              </code>
            </dd>
          </div>
        </dl>

        {props.cancelReason ? (
          <p className="mt-3 text-sm text-[var(--critical)]">
            {props.cancelReasonLabel} {props.cancelReason}
          </p>
        ) : null}
        {props.rejectReason ? (
          <p className="mt-2 text-sm text-[var(--critical)]">
            {props.rejectReasonLabel} {props.rejectReason}
          </p>
        ) : null}
      </div>
    </header>
  );
}
