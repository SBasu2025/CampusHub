import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Inbox,
} from "lucide-react";

import Button from "./Button";

type SortDirection = "asc" | "desc";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor?: keyof T;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (
    row: T,
    index: number,
  ) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];

  rowKey:
    | keyof T
    | ((row: T, index: number) => string | number);

  loading?: boolean;

  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;

  pageSize?: 10 | 15;

  onRowClick?: (row: T) => void;

  className?: string;
}

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function compareValues(
  first: unknown,
  second: unknown,
): number {
  if (
    first === null ||
    first === undefined
  ) {
    return second === null ||
      second === undefined
      ? 0
      : -1;
  }

  if (
    second === null ||
    second === undefined
  ) {
    return 1;
  }

  if (
    typeof first === "number" &&
    typeof second === "number"
  ) {
    return first - second;
  }

  return String(first).localeCompare(
    String(second),
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    },
  );
}

function getSkeletonWidths(
  columnCount: number,
): string[] {
  return Array.from(
    { length: columnCount },
    (_, index) => {
      const widths = [
        "w-24",
        "w-32",
        "w-20",
        "w-28",
        "w-16",
        "w-24",
      ];

      return widths[index % widths.length];
    },
  );
}

export default function DataTable<
  T extends object,
>({
  data,
  columns,
  rowKey,
  loading = false,
  emptyTitle = "No records found",
  emptyMessage =
    "There is no data to display yet.",
  emptyAction,
  pageSize = 10,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] =
    useState<string | null>(null);

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const [currentPage, setCurrentPage] =
    useState(1);

  const sortedData = useMemo(() => {
    if (!sortKey) {
      return data;
    }

    const column = columns.find(
      (item) => item.key === sortKey,
    );

    if (
      !column ||
      !column.accessor
    ) {
      return data;
    }

    return [...data].sort(
      (first, second) => {
        const firstValue =
          first[column.accessor!];

        const secondValue =
          second[column.accessor!];

        const comparison =
          compareValues(
            firstValue,
            secondValue,
          );

        return sortDirection ===
          "asc"
          ? comparison
          : -comparison;
      },
    );
  }, [
    columns,
    data,
    sortDirection,
    sortKey,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedData.length / pageSize,
    ),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedData = useMemo(() => {
    const start =
      (safeCurrentPage - 1) *
      pageSize;

    return sortedData.slice(
      start,
      start + pageSize,
    );
  }, [
    pageSize,
    safeCurrentPage,
    sortedData,
  ]);

  function handleSort(
    column: DataTableColumn<T>,
  ) {
    if (
      !column.sortable ||
      !column.accessor
    ) {
      return;
    }

    if (sortKey === column.key) {
      setSortDirection((current) =>
        current === "asc"
          ? "desc"
          : "asc",
      );
    } else {
      setSortKey(column.key);
      setSortDirection("asc");
    }

    setCurrentPage(1);
  }

  function getRowKey(
    row: T,
    index: number,
  ) {
    if (typeof rowKey === "function") {
      return rowKey(row, index);
    }

    const value = row[rowKey];

    return String(
      value ?? index,
    );
  }

  function goToPage(page: number) {
    setCurrentPage(
      Math.min(
        Math.max(page, 1),
        totalPages,
      ),
    );
  }

  if (loading) {
    const skeletonWidths =
      getSkeletonWidths(
        columns.length,
      );

    return (
      <div
        className={cn(
          "w-full overflow-hidden rounded-lg border border-neutral-200 bg-surface-card shadow-sm",
          className,
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead className="sticky top-0 z-10 bg-neutral-50">
              <tr className="border-b border-neutral-200">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-left text-caption font-semibold uppercase tracking-wide text-muted",
                      column.headerClassName,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from(
                {
                  length: Math.min(
                    pageSize,
                    6,
                  ),
                },
                (_, rowIndex) => (
                  <tr
                    key={`skeleton-${rowIndex}`}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    {columns.map(
                      (
                        column,
                        columnIndex,
                      ) => (
                        <td
                          key={column.key}
                          className="px-4 py-4"
                        >
                          <div
                            aria-hidden="true"
                            className={cn(
                              "h-4 rounded bg-neutral-200 animate-shimmer",
                              skeletonWidths[
                                columnIndex
                              ],
                            )}
                          />
                        </td>
                      ),
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-56 w-full flex-col items-center justify-center rounded-lg border border-neutral-200 bg-surface-card px-6 py-10 text-center shadow-sm",
          className,
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <Inbox
            aria-hidden="true"
            className="h-5 w-5"
          />
        </div>

        <h3 className="mt-4 font-heading text-h3 text-heading">
          {emptyTitle}
        </h3>

        <p className="mt-1 max-w-md text-body-sm text-muted">
          {emptyMessage}
        </p>

        {emptyAction && (
          <div className="mt-4">
            {emptyAction}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border border-neutral-200 bg-surface-card shadow-sm",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="sticky top-0 z-10 bg-neutral-50">
            <tr className="border-b border-neutral-200">
              {columns.map((column) => {
                const isActive =
                  sortKey === column.key;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-left text-caption font-semibold uppercase tracking-wide text-muted",
                      column.headerClassName,
                    )}
                  >
                    {column.sortable &&
                    column.accessor ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleSort(
                            column,
                          )
                        }
                        className="group inline-flex items-center gap-1.5 rounded-sm text-left transition-colors duration-150 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                      >
                        <span>
                          {column.header}
                        </span>

                        {isActive &&
                        sortDirection ===
                          "asc" ? (
                          <ArrowUp
                            aria-hidden="true"
                            className="h-3.5 w-3.5 text-primary-600"
                          />
                        ) : isActive &&
                          sortDirection ===
                            "desc" ? (
                          <ArrowDown
                            aria-hidden="true"
                            className="h-3.5 w-3.5 text-primary-600"
                          />
                        ) : (
                          <ArrowUpDown
                            aria-hidden="true"
                            className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100"
                          />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {paginatedData.map(
              (row, rowIndex) => (
                <tr
                  key={getRowKey(
                    row,
                    rowIndex,
                  )}
                  onClick={() =>
                    onRowClick?.(row)
                  }
                  className={cn(
                    "group relative border-b border-neutral-100 transition-colors duration-150 odd:bg-neutral-50/70 last:border-0",
                    onRowClick
                      ? "cursor-pointer hover:bg-primary-50/50"
                      : "hover:bg-neutral-50",
                  )}
                >
                  {columns.map(
                    (column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "relative px-4 py-3.5 text-body-sm",
                          column.className,
                        )}
                      >
                        {column.render
                          ? column.render(
                              row,
                              rowIndex,
                            )
                          : column.accessor
                            ? String(
                                row[
                                  column
                                    .accessor
                                ] ??
                                  "—",
                              )
                            : "—"}

                        {column ===
                          columns[0] &&
                          onRowClick && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-y-0 left-0 w-0.5 origin-bottom scale-y-0 bg-primary-500 transition-transform duration-200 ease-out group-hover:scale-y-100"
                            />
                          )}
                      </td>
                    ),
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-muted">
            Showing{" "}
            <span className="font-medium text-body">
              {(safeCurrentPage - 1) *
                pageSize +
                1}
            </span>
            {" — "}
            <span className="font-medium text-body">
              {Math.min(
                safeCurrentPage *
                  pageSize,
                sortedData.length,
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-body">
              {sortedData.length}
            </span>{" "}
            records
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={
                safeCurrentPage === 1
              }
              onClick={() =>
                goToPage(
                  safeCurrentPage - 1,
                )
              }
            >
              Previous
            </Button>

            <span className="min-w-16 text-center text-caption text-muted">
              {safeCurrentPage} /{" "}
              {totalPages}
            </span>

            <Button
              variant="secondary"
              size="sm"
              disabled={
                safeCurrentPage ===
                totalPages
              }
              onClick={() =>
                goToPage(
                  safeCurrentPage + 1,
                )
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}