"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { SlaBadge } from "@/components/tickets/sla-badge";
import {
  DataTable,
  dataTableLabelsFromCommon,
} from "@/components/ui/data-table";
import type { SlaBadgeTone } from "@/domain/sla/badge";
import type { MessageCatalog } from "@/i18n";

export type VendorInboxRow = {
  id: string;
  title: string;
  storeStatus: string;
  slaTone: SlaBadgeTone;
  slaLabel: string;
  description: string;
  searchText: string;
};

export function VendorInboxDataTable(props: {
  rows: VendorInboxRow[];
  common: MessageCatalog["common"];
  titleHeader: string;
  storeHeader: string;
  slaHeader: string;
}) {
  const labels = dataTableLabelsFromCommon(props.common);
  const columns = useMemo<ColumnDef<VendorInboxRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: props.titleHeader,
        cell: ({ row }) => (
          <Link
            href={`/vendor/tickets/${row.original.id}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "storeStatus",
        header: props.storeHeader,
        cell: ({ getValue }) => (
          <span className="text-[var(--muted-foreground)]">
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "slaLabel",
        header: props.slaHeader,
        enableSorting: false,
        cell: ({ row }) => (
          <SlaBadge
            tone={row.original.slaTone}
            label={row.original.slaLabel}
          />
        ),
      },
    ],
    [props],
  );

  return (
    <DataTable
      columns={columns}
      data={props.rows}
      labels={labels}
      initialPageSize={10}
    />
  );
}
