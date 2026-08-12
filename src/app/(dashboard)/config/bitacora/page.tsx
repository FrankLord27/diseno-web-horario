"use client";

import { Fragment, useState } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";
import { useAuditLog } from "@/hooks/useSchedule";
import { Spinner } from "@/components/ui/Spinner";
import { ExpandPanel } from "@/components/ui/Disclosure";
import {
  TablePagination,
  usePagination,
} from "@/components/ui/TablePagination";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600"
    >
      {copied ? (
        <>
          <Check className="size-3.5" aria-hidden="true" /> Copiado
        </>
      ) : (
        <>
          <Copy className="size-3.5" aria-hidden="true" /> Copiar JSON
        </>
      )}
    </button>
  );
}

export default function BitacoraPage() {
  const log = useAuditLog(200);
  const { pageItems, controls } = usePagination(log.data ?? []);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Bitácora</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registro inmutable: quién hizo qué cambio y cuándo
        </p>
      </header>

      <div className="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-sm">
        {log.isLoading ? (
          <div className="p-6">
            <Spinner label="Cargando bitácora" />
          </div>
        ) : (log.data ?? []).length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Sin registros todavía.</p>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="w-10 px-2 py-3">
                    <span className="sr-only">Expandir</span>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Fecha
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Usuario
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Acción
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Entidad
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((entry) => {
                  const isExpanded = expandedIds.has(entry.id);
                  const pretty = entry.detail
                    ? JSON.stringify(entry.detail, null, 2)
                    : null;
                  return (
                    <Fragment key={entry.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-2 py-3">
                          {pretty && (
                            <button
                              type="button"
                              onClick={() => toggle(entry.id)}
                              aria-expanded={isExpanded}
                              aria-label={
                                isExpanded
                                  ? "Ocultar detalle completo"
                                  : "Ver detalle completo"
                              }
                              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600"
                            >
                              <ChevronDown
                                className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                aria-hidden="true"
                              />
                            </button>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                          {new Date(entry.createdAt).toLocaleString("es-DO")}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {entry.user?.name ?? "Sistema"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700">
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {entry.entity}
                        </td>
                        <td className="max-w-md px-4 py-3">
                          <code className="block truncate text-xs text-gray-400">
                            {pretty ?? "—"}
                          </code>
                        </td>
                      </tr>
                      {pretty && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            <ExpandPanel open={isExpanded}>
                              <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
                                <div className="mb-1.5 flex justify-end">
                                  <CopyButton text={pretty} />
                                </div>
                                <pre className="max-h-80 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                                  {pretty}
                                </pre>
                              </div>
                            </ExpandPanel>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            <TablePagination controls={controls} idPrefix="bitacora" />
          </>
        )}
      </div>
    </div>
  );
}
