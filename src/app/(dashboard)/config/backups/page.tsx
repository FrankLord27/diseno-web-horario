"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BackupEntry } from "@horarios/shared-types";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { formatDate } from "@/lib/utils";
import { DatabaseBackup, Download, RefreshCw } from "lucide-react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupsPage() {
  const queryClient = useQueryClient();

  const list = useQuery<BackupEntry[]>({
    queryKey: ["backups"],
    queryFn: () => apiClient.get<BackupEntry[]>("/admin/backups"),
  });

  const create = useMutation({
    mutationFn: () => apiClient.post<BackupEntry>("/admin/backups"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });

  async function download(entry: BackupEntry) {
    const { blob } = await apiClient.getBlob(
      `/admin/backups/${entry.name}/download`,
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = entry.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4 motion-safe:animate-fade-in-up">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Respaldos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Copias de seguridad de la base de datos completa (docentes, cursos,
            asignaciones, horario)
          </p>
        </div>
        <Button onClick={() => create.mutate()} loading={create.isPending}>
          <DatabaseBackup className="size-4" aria-hidden="true" />
          Crear respaldo ahora
        </Button>
      </header>

      <div className="flex items-start gap-3 rounded-card border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900">
        <RefreshCw className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Además de los respaldos manuales, el sistema guarda uno
          automáticamente <strong>todas las noches a las 2:00am</strong> y
          conserva los últimos 14 — no necesitas hacer nada para que esto siga
          funcionando.
        </p>
      </div>

      <ErrorSummary error={create.error} />

      <div className="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card">
        {list.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : list.isError ? (
          <div className="p-6">
            <ErrorSummary error={list.error} />
          </div>
        ) : list.data && list.data.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3">
                  Tamaño
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.data.map((entry) => (
                <tr key={entry.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatSize(entry.sizeBytes)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void download(entry)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-primary-700 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-700">
              Aún no hay respaldos.
            </p>
            <p className="text-xs text-gray-400">
              Haz clic en «Crear respaldo ahora» o espera al respaldo automático
              de esta noche.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
