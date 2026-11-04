"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  dataTableLabelsFromCommon,
} from "@/components/ui/data-table";
import { RowActionLink, RowActionSubmit } from "@/components/ui/row-actions";
import type { MessageCatalog } from "@/i18n";

type Common = MessageCatalog["common"];

function ArchiveButton(props: {
  label: string;
  action: () => Promise<void>;
}) {
  return (
    <form action={props.action}>
      <RowActionSubmit label={props.label} variant="archive" />
    </form>
  );
}

export type StoreRow = {
  id: string;
  name: string;
  location: string;
  searchText: string;
};

export function StoresDataTable(props: {
  rows: StoreRow[];
  common: Common;
  nameHeader: string;
  locationHeader: string;
  editLabel: string;
  archiveLabel: string;
  canEdit: boolean;
  onArchive: (id: string) => Promise<void>;
}) {
  const labels = dataTableLabelsFromCommon(props.common);
  const columns = useMemo<ColumnDef<StoreRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: props.nameHeader,
        cell: ({ row }) =>
          props.canEdit ? (
            <Link
              href={`/app/stores/${row.original.id}`}
              className="font-medium text-[var(--primary)] hover:underline"
            >
              {row.original.name}
            </Link>
          ) : (
            <span className="font-medium">{row.original.name}</span>
          ),
      },
      {
        accessorKey: "location",
        header: props.locationHeader,
        cell: ({ getValue }) => (
          <span className="text-[var(--muted-foreground)]">
            {String(getValue() || "—")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          props.canEdit ? (
            <div className="flex justify-end gap-3">
              <RowActionLink
                href={`/app/stores/${row.original.id}`}
                label={props.editLabel}
                variant="edit"
              />
              <ArchiveButton
                label={props.archiveLabel}
                action={props.onArchive.bind(null, row.original.id)}
              />
            </div>
          ) : null,
      },
    ],
    [props],
  );

  return (
    <DataTable columns={columns} data={props.rows} labels={labels} />
  );
}

export type VendorRow = {
  id: string;
  name: string;
  meta: string;
  searchText: string;
};

export function VendorsDataTable(props: {
  rows: VendorRow[];
  common: Common;
  nameHeader: string;
  metaHeader: string;
  editLabel: string;
  archiveLabel: string;
  canEdit: boolean;
  onArchive: (id: string) => Promise<void>;
}) {
  const labels = dataTableLabelsFromCommon(props.common);
  const columns = useMemo<ColumnDef<VendorRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: props.nameHeader,
        cell: ({ row }) => (
          <Link
            href={`/app/vendors/${row.original.id}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "meta",
        header: props.metaHeader,
        cell: ({ getValue }) => (
          <span className="text-[var(--muted-foreground)]">
            {String(getValue() || "—")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          props.canEdit ? (
            <div className="flex justify-end gap-3">
              <RowActionLink
                href={`/app/vendors/${row.original.id}`}
                label={props.editLabel}
                variant="edit"
              />
              <ArchiveButton
                label={props.archiveLabel}
                action={props.onArchive.bind(null, row.original.id)}
              />
            </div>
          ) : null,
      },
    ],
    [props],
  );

  return (
    <DataTable columns={columns} data={props.rows} labels={labels} />
  );
}

export type AssetRow = {
  id: string;
  label: string;
  category: string;
  detail: string;
  storeName: string;
  searchText: string;
};

export function AssetsDataTable(props: {
  rows: AssetRow[];
  common: Common;
  labelHeader: string;
  storeHeader: string;
  archiveLabel: string;
  onArchive: (id: string) => Promise<void>;
}) {
  const labels = dataTableLabelsFromCommon(props.common);
  const columns = useMemo<ColumnDef<AssetRow>[]>(
    () => [
      {
        accessorKey: "label",
        header: props.labelHeader,
        cell: ({ row }) => (
          <div>
            <span className="font-medium">{row.original.label}</span>
            <span className="ml-1 text-[var(--muted-foreground)]">
              · {row.original.category}
            </span>
            <p className="text-xs text-[var(--muted-foreground)]">
              {row.original.detail || "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "storeName",
        header: props.storeHeader,
        cell: ({ getValue }) => (
          <span className="text-[var(--muted-foreground)]">
            {String(getValue() || "—")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ArchiveButton
              label={props.archiveLabel}
              action={props.onArchive.bind(null, row.original.id)}
            />
          </div>
        ),
      },
    ],
    [props],
  );

  return (
    <DataTable columns={columns} data={props.rows} labels={labels} />
  );
}

export type ContractRow = {
  id: string;
  vendorId: string;
  title: string;
  reference: string;
  vendorName: string;
  scope: string;
  period: string;
  toneClass: string;
  searchText: string;
};

export function ContractsDataTable(props: {
  rows: ContractRow[];
  common: Common;
  titleHeader: string;
  vendorHeader: string;
  endsHeader: string;
  archiveLabel: string;
  canEdit: boolean;
  onArchive: (id: string, vendorId: string) => Promise<void>;
}) {
  const labels = dataTableLabelsFromCommon(props.common);
  const columns = useMemo<ColumnDef<ContractRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: props.titleHeader,
        cell: ({ row }) => (
          <div>
            <span className="font-medium">{row.original.title}</span>
            {row.original.reference ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                {row.original.reference}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "vendorName",
        header: props.vendorHeader,
        cell: ({ row }) => (
          <div>
            <Link
              href={`/app/vendors/${row.original.vendorId}`}
              className="text-[var(--primary)] hover:underline"
            >
              {row.original.vendorName}
            </Link>
            <p className="text-xs text-[var(--muted-foreground)]">
              {row.original.scope}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "period",
        header: props.endsHeader,
        cell: ({ row }) => (
          <span className={`tabular ${row.original.toneClass}`}>
            {row.original.period}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          props.canEdit ? (
            <div className="flex justify-end">
              <ArchiveButton
                label={props.archiveLabel}
                action={props.onArchive.bind(
                  null,
                  row.original.id,
                  row.original.vendorId,
                )}
              />
            </div>
          ) : null,
      },
    ],
    [props],
  );

  return (
    <DataTable columns={columns} data={props.rows} labels={labels} />
  );
}

export type RfqRow = {
  id: string;
  title: string;
  status: string;
  offers: string;
  min: string;
  ticketHint: string;
  searchText: string;
};

export function RfqDataTable(props: {
  rows: RfqRow[];
  common: Common;
  titleHeader: string;
  statusHeader: string;
  offersHeader: string;
  minHeader: string;
}) {
  const labels = dataTableLabelsFromCommon(props.common);
  const columns = useMemo<ColumnDef<RfqRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: props.titleHeader,
        cell: ({ row }) => (
          <div>
            <Link
              href={`/app/rfq/${row.original.id}`}
              className="font-medium text-[var(--primary)] hover:underline"
            >
              {row.original.title}
            </Link>
            {row.original.ticketHint ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                {row.original.ticketHint}
              </p>
            ) : null}
          </div>
        ),
      },
      { accessorKey: "status", header: props.statusHeader },
      {
        accessorKey: "offers",
        header: props.offersHeader,
        cell: ({ getValue }) => (
          <span className="tabular text-[var(--muted-foreground)]">
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "min",
        header: props.minHeader,
        cell: ({ getValue }) => (
          <span className="tabular">{String(getValue())}</span>
        ),
      },
    ],
    [props],
  );

  return (
    <DataTable columns={columns} data={props.rows} labels={labels} />
  );
}

export type PmRow = {
  id: string;
  title: string;
  when: string;
  storeName: string;
  vendorName: string;
  status: string;
  searchText: string;
};

export function PmEventsDataTable(props: {
  rows: PmRow[];
  common: Common;
  titleHeader: string;
  whenHeader: string;
  storeHeader: string;
  statusHeader: string;
}) {
  const labels = dataTableLabelsFromCommon(props.common);
  const columns = useMemo<ColumnDef<PmRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: props.titleHeader,
        cell: ({ row }) => (
          <div>
            <span className="font-medium">{row.original.title}</span>
            {row.original.vendorName ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                {row.original.vendorName}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "when",
        header: props.whenHeader,
        cell: ({ getValue }) => (
          <span className="tabular">{String(getValue())}</span>
        ),
      },
      { accessorKey: "storeName", header: props.storeHeader },
      { accessorKey: "status", header: props.statusHeader },
    ],
    [props],
  );

  return (
    <DataTable columns={columns} data={props.rows} labels={labels} />
  );
}

export type SimpleLinkRow = {
  id: string;
  title: string;
  meta: string;
  href: string;
  searchText: string;
};

export function SimpleLinkDataTable(props: {
  rows: SimpleLinkRow[];
  common: Common;
  titleHeader: string;
  metaHeader: string;
}) {
  const labels = dataTableLabelsFromCommon(props.common);
  const columns = useMemo<ColumnDef<SimpleLinkRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: props.titleHeader,
        cell: ({ row }) => (
          <Link
            href={row.original.href}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "meta",
        header: props.metaHeader,
        cell: ({ getValue }) => (
          <span className="text-[var(--muted-foreground)]">
            {String(getValue())}
          </span>
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
