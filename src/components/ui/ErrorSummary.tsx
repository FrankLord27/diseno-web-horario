import { AlertTriangle } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";

export function ErrorSummary({ error }: { error: unknown }) {
  if (!error) return null;

  const message =
    error instanceof ApiClientError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Ocurrió un error inesperado";
  const violations =
    error instanceof ApiClientError ? error.violations : undefined;

  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {violations && violations.length > 0 && (
        <ul className="ml-6 list-disc space-y-1">
          {violations.map((v, i) => (
            <li key={`${v.type}-${i}`}>{v.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
