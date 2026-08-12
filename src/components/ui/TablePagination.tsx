"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "./Button";
import { Select } from "./Select";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

interface PaginationControls {
  total: number;
  /** Página actual ya acotada al rango válido (0-indexed). */
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: Dispatch<SetStateAction<number>>;
  setPageSize: Dispatch<SetStateAction<number>>;
}

/**
 * Paginación en cliente para cualquier tabla cuyos datos ya vienen completos.
 * Devuelve la porción visible + los controles para <TablePagination>.
 */
export function usePagination<T>(
  items: T[],
  defaultPageSize = DEFAULT_PAGE_SIZE,
): { pageItems: T[]; controls: PaginationControls } {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(
    () =>
      items.slice(currentPage * pageSize, currentPage * pageSize + pageSize),
    [items, currentPage, pageSize],
  );

  return {
    pageItems,
    controls: {
      total,
      page: currentPage,
      pageSize,
      totalPages,
      setPage,
      setPageSize,
    },
  };
}

/** Pie de tabla: filas por página, rango, y navegación con nº de página. */
export function TablePagination({
  controls,
  idPrefix,
}: {
  controls: PaginationControls;
  idPrefix: string;
}) {
  const { total, page, pageSize, totalPages, setPage, setPageSize } = controls;
  // Debajo de 10 registros no aporta.
  if (total <= 10) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <label htmlFor={`${idPrefix}-page-size`}>Filas por página</label>
        <Select
          id={`${idPrefix}-page-size`}
          className="w-20"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
        <span>
          · {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} de{" "}
          {total}
        </span>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(Math.max(0, page - 1))}
          >
            Anterior
          </Button>
          <span className="tabular-nums whitespace-nowrap">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
