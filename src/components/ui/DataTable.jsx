"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, SearchX, X } from "lucide-react";
import cx from "@/lib/cx";
import { fieldBase } from "./Field";
import { TableSkeleton } from "./Skeleton";
import { EmptyState, ErrorState } from "./States";

export function SearchInput({ value, onChange, placeholder = "Search", label = "Search", className }) {
  return (
    <div className={cx("relative", className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cx(fieldBase, "h-10 pl-10 pr-9 text-sm [&::-webkit-search-cancel-button]:appearance-none")}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-mist hover:text-fg"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function PageButton({ active, className, children, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        "tabular flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-35",
        active ? "bg-ink text-white" : "text-fg-2 hover:bg-mist",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Pagination({ page, pageCount, total, pageSize, onPage, noun = "results" }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pages = [];
  for (let p = 1; p <= pageCount; p += 1) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "gap") pages.push("gap");
  }
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
      <p className="text-[13px] text-muted">
        Showing <span className="tabular font-semibold text-fg">{from}–{to}</span> of{" "}
        <span className="tabular font-semibold text-fg">{total}</span> {noun}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-1">
          <PageButton aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)}>
            <ChevronLeft aria-hidden="true" className="size-4" />
          </PageButton>
          {pages.map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-[13px] text-subtle">
                ...
              </span>
            ) : (
              <PageButton key={p} active={p === page} aria-current={p === page ? "page" : undefined} onClick={() => onPage(p)}>
                {p}
              </PageButton>
            )
          )}
          <PageButton aria-label="Next page" disabled={page === pageCount} onClick={() => onPage(page + 1)}>
            <ChevronRight aria-hidden="true" className="size-4" />
          </PageButton>
        </div>
      ) : null}
    </nav>
  );
}

const HIDE_BELOW = { md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell", "2xl": "hidden 2xl:table-cell" };

function keyOf(row, rowKey, index) {
  if (typeof rowKey === "function") return rowKey(row, index);
  return row?.[rowKey] ?? index;
}

function sortValueOf(column, row) {
  if (column.sortValue) return column.sortValue(row);
  return row?.[column.key];
}

function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function searchText(row, searchKeys) {
  if (typeof searchKeys === "function") return String(searchKeys(row) ?? "");
  return searchKeys.map((key) => row?.[key] ?? "").join(" ");
}

function SelectAll({ checked, indeterminate, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all rows on this page"
      checked={checked}
      onChange={onChange}
      className="size-4 cursor-pointer accent-brand-700"
    />
  );
}

/*
  columns: [{ key, header, render?(row), sortable?, sortValue?(row), align?, className?,
              primary?, secondary?, hideOnMobile?, hideBelow?: "md" | "lg" | "xl" | "2xl" }]
  The first column (or the one marked `primary`) becomes the card title on mobile.
*/
export default function DataTable({
  columns,
  rows = [],
  rowKey = "_id",
  loading = false,
  error = null,
  onRetry,
  searchKeys,
  searchPlaceholder = "Search",
  filters,
  toolbar,
  pageSize = 10,
  empty = {},
  onRowClick,
  rowActions,
  selectable = false,
  bulkActions,
  caption,
  initialSort = null,
  noun = "results",
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchKeys) return rows;
    return rows.filter((row) => searchText(row, searchKeys).toLowerCase().includes(q));
  }, [rows, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return filtered;
    const out = [...filtered].sort((a, b) => compare(sortValueOf(column, a), sortValueOf(column, b)));
    return sort.dir === "desc" ? out.reverse() : out;
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);

  const primary = columns.find((c) => c.primary) || columns[0];
  const secondary = columns.find((c) => c.secondary);
  const detailColumns = columns.filter((c) => c !== primary && c !== secondary && !c.hideOnMobile);

  const pageKeys = pageRows.map((row, i) => keyOf(row, rowKey, i));
  const allOnPage = pageKeys.length > 0 && pageKeys.every((k) => selectedKeys.has(k));
  const someOnPage = pageKeys.some((k) => selectedKeys.has(k));
  const selectedRows = rows.filter((row, i) => selectedKeys.has(keyOf(row, rowKey, i)));

  const toggleSort = (column) => {
    setSort((prev) => {
      if (!prev || prev.key !== column.key) return { key: column.key, dir: "asc" };
      if (prev.dir === "asc") return { key: column.key, dir: "desc" };
      return null;
    });
  };

  const toggleRow = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePage = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allOnPage) pageKeys.forEach((k) => next.delete(k));
      else pageKeys.forEach((k) => next.add(k));
      return next;
    });
  };

  const clearSelection = () => setSelectedKeys(new Set());

  if (loading) return <TableSkeleton columns={Math.min(columns.length + 1, 5)} />;

  const hasToolbar = searchKeys || filters || toolbar;
  const cell = (column, row) => (column.render ? column.render(row) : row?.[column.key] ?? "—");
  const rowInteractive = (row) =>
    onRowClick
      ? {
          onClick: () => onRowClick(row),
          onKeyDown: (event) => {
            if (event.key === "Enter" && event.target === event.currentTarget) onRowClick(row);
          },
          tabIndex: 0,
        }
      : {};
  const stop = (event) => event.stopPropagation();

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-paper">
      {hasToolbar ? (
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {searchKeys ? (
              <SearchInput
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full sm:w-72"
              />
            ) : null}
            {filters}
          </div>
          {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}

      {selectable && selectedKeys.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-ink px-4 py-2.5 text-sm text-white">
          <span className="font-semibold">
            <span className="tabular">{selectedKeys.size}</span> selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions?.(selectedRows, clearSelection)}
            <button type="button" onClick={clearSelection} className="rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-on-dark/70 hover:bg-white/10 hover:text-white">
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {error && !rows.length ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : sorted.length === 0 ? (
        query ? (
          <EmptyState
            icon={SearchX}
            title="No matches"
            description={`Nothing matches "${query}". Try a different name or keyword.`}
            action={
              <button type="button" onClick={() => setQuery("")} className="link-draw text-sm font-semibold text-brand-700">
                Clear search
              </button>
            }
          />
        ) : (
          <EmptyState icon={empty.icon} title={empty.title || "Nothing here yet"} description={empty.description} action={empty.action} />
        )
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              {caption ? <caption className="sr-only">{caption}</caption> : null}
              <thead>
                <tr className="border-b border-line bg-canvas">
                  {selectable ? (
                    <th scope="col" className="w-12 pl-4">
                      <SelectAll checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={togglePage} />
                    </th>
                  ) : null}
                  {columns.map((column) => {
                    const active = sort?.key === column.key;
                    const SortIcon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
                    return (
                      <th
                        key={column.key}
                        scope="col"
                        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className={cx(
                          "eyebrow h-11 whitespace-nowrap px-4 align-middle text-[0.66rem] text-muted",
                          column.align === "right" && "text-right",
                          HIDE_BELOW[column.hideBelow],
                          column.headerClassName
                        )}
                      >
                        {column.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column)}
                            className={cx("eyebrow inline-flex items-center gap-1.5 text-[0.66rem] transition-colors hover:text-fg", active && "text-fg")}
                          >
                            {column.header}
                            <SortIcon aria-hidden="true" className={cx("size-3", active ? "text-brand-700" : "text-subtle")} />
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    );
                  })}
                  {rowActions ? (
                    <th scope="col" className="px-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => {
                  const key = pageKeys[i];
                  const selected = selectedKeys.has(key);
                  return (
                    <tr
                      key={key}
                      {...rowInteractive(row)}
                      className={cx(
                        "border-b border-line transition-colors last:border-0",
                        selected ? "bg-mint/70" : "hover:bg-canvas",
                        onRowClick && "cursor-pointer focus-visible:bg-canvas focus-visible:outline-offset-[-2px]"
                      )}
                    >
                      {selectable ? (
                        <td className="w-12 pl-4" onClick={stop}>
                          <input
                            type="checkbox"
                            aria-label={`Select row ${i + 1}`}
                            checked={selected}
                            onChange={() => toggleRow(key)}
                            className="size-4 cursor-pointer accent-brand-700"
                          />
                        </td>
                      ) : null}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cx(
                            "px-4 py-3.5 align-middle text-fg-2",
                            column.align === "right" && "text-right",
                            HIDE_BELOW[column.hideBelow],
                            column.className
                          )}
                        >
                          {cell(column, row)}
                        </td>
                      ))}
                      {rowActions ? (
                        <td className="px-4 py-3 text-right" onClick={stop}>
                          <div className="flex items-center justify-end gap-1.5">{rowActions(row)}</div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-line md:hidden">
            {pageRows.map((row, i) => {
              const key = pageKeys[i];
              const selected = selectedKeys.has(key);
              return (
                <li key={key} {...rowInteractive(row)} className={cx("flex gap-3 p-4", selected && "bg-mint/70")}>
                  {selectable ? (
                    <div onClick={stop} className="pt-0.5">
                      <input
                        type="checkbox"
                        aria-label={`Select row ${i + 1}`}
                        checked={selected}
                        onChange={() => toggleRow(key)}
                        className="size-4 cursor-pointer accent-brand-700"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-fg">{cell(primary, row)}</div>
                    {secondary ? <div className="mt-0.5 text-[13px] text-muted">{cell(secondary, row)}</div> : null}
                    {detailColumns.length ? (
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                        {detailColumns.map((column) => (
                          <div key={column.key} className="min-w-0">
                            <dt className="eyebrow text-[0.6rem] text-subtle">{column.header}</dt>
                            <dd className="mt-1 break-words text-[13px] text-fg-2">{cell(column, row)}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {rowActions ? (
                      <div onClick={stop} className="mt-4 flex flex-wrap gap-2">
                        {rowActions(row)}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Pagination page={current} pageCount={pageCount} total={sorted.length} pageSize={pageSize} onPage={setPage} noun={noun} />
    </div>
  );
}
