"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { controlClass, tableHeadClass, tableRowClass } from "@/lib/ui-classes";

export type DataTableLabels = {
  searchPlaceholder: string;
  empty: string;
  rowsPerPage: string;
  of: string;
  previous: string;
  next: string;
  page: string;
};

type Props<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  labels: DataTableLabels;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  hideSearch?: boolean;
  className?: string;
  toolbar?: React.ReactNode;
};

export function DataTable<TData>({
  columns,
  data,
  labels,
  pageSizeOptions = [10, 25, 50],
  initialPageSize = 10,
  hideSearch = false,
  className,
  toolbar,
}: Props<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "")
        .trim()
        .toLowerCase();
      if (!q) return true;
      const original = row.original as { searchText?: unknown };
      if (typeof original.searchText === "string") {
        return original.searchText.toLowerCase().includes(q);
      }
      return Object.values(row.original as object).some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: initialPageSize, pageIndex: 0 },
    },
  });

  const pageCount = table.getPageCount();
  const { pageIndex, pageSize } = table.getState().pagination;
  const filtered = table.getFilteredRowModel().rows.length;
  const sizeOptions = useMemo(() => pageSizeOptions, [pageSizeOptions]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        {!hideSearch ? (
          <Input
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              table.setPageIndex(0);
            }}
            placeholder={labels.searchPlaceholder}
            className="max-w-xs"
            aria-label={labels.searchPlaceholder}
          />
        ) : (
          <div />
        )}
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <span className="whitespace-nowrap">{labels.rowsPerPage}</span>
            <select
              className={cn(controlClass, "h-9 w-auto")}
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {sizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className={tableHeadClass}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <th key={header.id} className="px-3 py-2.5 font-medium">
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:text-[var(--foreground)]"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: " ↑",
                            desc: " ↓",
                          }[header.column.getIsSorted() as string] ?? null}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-10 text-center text-[var(--muted-foreground)]"
                >
                  {labels.empty}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={tableRowClass}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted-foreground)]">
        <p className="tabular">
          {filtered} {labels.of} {data.length}
        </p>
        <div className="flex items-center gap-2">
          <span className="tabular">
            {labels.page} {pageCount === 0 ? 0 : pageIndex + 1} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            aria-label={labels.previous}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            aria-label={labels.next}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function dataTableLabelsFromCommon(common: {
  searchPlaceholder: string;
  noResults: string;
  rowsPerPage: string;
  of: string;
  previous: string;
  next: string;
  page: string;
}): DataTableLabels {
  return {
    searchPlaceholder: common.searchPlaceholder,
    empty: common.noResults,
    rowsPerPage: common.rowsPerPage,
    of: common.of,
    previous: common.previous,
    next: common.next,
    page: common.page,
  };
}
