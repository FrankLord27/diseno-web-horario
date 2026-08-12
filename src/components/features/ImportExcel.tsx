"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";

interface ImportResult {
  created: number;
  errors: { row: number; message: string }[];
}

interface FieldMeta {
  key: string;
  label: string;
  required: boolean;
}

interface InspectResult {
  columns: string[];
  preview: string[][];
  totalRows: number;
  fields: FieldMeta[];
  suggested: Record<string, number | null>;
}

/**
 * Importar una entidad desde Excel: plantilla + mapeo de columnas de cualquier
 * archivo. Los campos los define el backend (`inspect.fields`), así que un solo
 * componente sirve para docentes, aulas, materias y asignaciones.
 */
export function ImportExcel({
  entity,
  title,
  description,
  invalidateKey,
}: {
  entity: string;
  title: string;
  description: string;
  invalidateKey: string;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [inspect, setInspect] = useState<InspectResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, number | null>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function downloadTemplate() {
    try {
      const { blob, filename } = await apiClient.getBlob(
        `/import/${entity}/template`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo descargar la plantilla");
    }
  }

  async function onFile(f: File) {
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", f);
      const data = await apiClient.postForm<InspectResult>(
        `/import/${entity}/inspect`,
        form,
      );
      setFile(f);
      setInspect(data);
      setMapping(data.suggested);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "No se pudo leer el archivo",
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function closeModal() {
    setInspect(null);
    setFile(null);
  }

  const missingRequired = (inspect?.fields ?? [])
    .filter((f) => f.required && typeof mapping[f.key] !== "number")
    .map((f) => f.label);

  async function doImport() {
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mapping", JSON.stringify(mapping));
      const res = await apiClient.postForm<ImportResult>(
        `/import/${entity}`,
        form,
      );
      setResult(res);
      closeModal();
      if (res.created > 0) {
        toast.success(`${res.created} fila(s) importada(s)`);
        void queryClient.invalidateQueries({ queryKey: [invalidateKey] });
      }
      if (res.errors.length > 0) {
        toast.error(`${res.errors.length} fila(s) con error`);
      }
      if (res.created === 0 && res.errors.length === 0) {
        toast.info("No se encontraron filas para importar");
      }
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Error al importar",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void downloadTemplate()}>
            <Download className="size-4" aria-hidden="true" />
            Plantilla
          </Button>
          <Button onClick={() => inputRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            Importar Excel
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </div>
      </div>

      {result && result.errors.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-800">
            {result.created} creado(s) · {result.errors.length} con error:
          </p>
          <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs text-amber-700">
            {result.errors.map((e) => (
              <li key={e.row}>
                Fila {e.row}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={inspect !== null}
        onClose={closeModal}
        title="Conectar columnas de tu archivo"
        size="lg"
      >
        {inspect && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">
              Tu archivo tiene <strong>{inspect.columns.length}</strong>{" "}
              columnas y <strong>{inspect.totalRows}</strong> fila(s). Conecta
              cada campo con tu columna. Los campos con{" "}
              <span className="text-red-500">*</span> son obligatorios.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {inspect.fields.map((fld) => (
                <label key={fld.key} className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-700">
                    {fld.label}
                    {fld.required && <span className="text-red-500"> *</span>}
                  </span>
                  <Select
                    value={
                      typeof mapping[fld.key] === "number"
                        ? String(mapping[fld.key])
                        : ""
                    }
                    invalid={
                      fld.required && typeof mapping[fld.key] !== "number"
                    }
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [fld.key]:
                          e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                  >
                    <option value="">— Ninguna —</option>
                    {inspect.columns.map((c, i) => (
                      <option key={i} value={i}>
                        {c || `Columna ${i + 1}`}
                      </option>
                    ))}
                  </Select>
                </label>
              ))}
            </div>

            {inspect.preview.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      {inspect.columns.map((c, i) => (
                        <th key={i} className="whitespace-nowrap px-2 py-1.5">
                          {c || `Col ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inspect.preview.map((row, r) => (
                      <tr key={r}>
                        {inspect.columns.map((_, i) => (
                          <td
                            key={i}
                            className="whitespace-nowrap px-2 py-1.5 text-gray-700"
                          >
                            {row[i] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
              <span className="text-xs text-red-600">
                {missingRequired.length > 0 &&
                  `Falta conectar: ${missingRequired.join(", ")}`}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={closeModal} type="button">
                  Cancelar
                </Button>
                <Button
                  onClick={() => void doImport()}
                  loading={importing}
                  disabled={missingRequired.length > 0}
                >
                  Importar {inspect.totalRows} fila(s)
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
