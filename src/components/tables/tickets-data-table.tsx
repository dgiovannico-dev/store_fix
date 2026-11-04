"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { SlaBadge } from "@/components/tickets/sla-badge";
import {
  DataTable,
  dataTableLabelsFromCommon,
  type DataTableLabels,
} from "@/components/ui/data-table";
import type { SlaBadgeTone } from "@/domain/sla/badge";
import type { MessageCatalog } from "@/i18n";

export type TicketRow = {
  id: string;
  shortId: string;
  storeName: string;
  statusLabel: string;
  priorityLabel: string;
  vendorName: string;
  slaTone: SlaBadgeTone;
  slaLabel: string;
  searchText: string;
};

export function TicketsDataTable(props: {
  rows: TicketRow[];
  common: MessageCatalog["common"];
  headers: MessageCatalog["ticketsList"];
}) {
  const labels: DataTableLabels = dataTableLabelsFromCommon(props.common);
  const columns = useMemo<ColumnDef<TicketRow>[]>(
    () => [
      {
        accessorKey: "shortId",
        header: props.headers.colId,
        cell: ({ row }) => (
          <Link
            href={`/app/tickets/${row.original.id}`}
            className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
          >
            <code className="text-xs">{row.original.shortId}</code>
          </Link>
        ),
      },
      { accessorKey: "storeName", header: props.headers.colStore },
      { accessorKey: "statusLabel", header: props.headers.colStatus },
      { accessorKey: "priorityLabel", header: props.headers.colPriority },
      {
        accessorKey: "slaLabel",
        header: props.headers.colSla,
        cell: ({ row }) => (
          <SlaBadge
            tone={row.original.slaTone}
            label={row.original.slaLabel}
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "vendorName",
        header: props.headers.colVendor,
        cell: ({ getValue }) => (
          <span className="text-[var(--muted-foreground)]">
            {String(getValue() || "—")}
          </span>
        ),
      },
    ],
    [props.headers],
  );

  return (
    <DataTable
      columns={columns}
      data={props.rows}
      labels={labels}
      initialPageSize={25}
    />
  );
}
