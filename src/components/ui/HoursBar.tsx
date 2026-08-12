import { cn } from "@/lib/utils";

/**
 * Barra de progreso para visualizar horas (periodos semanales) de un vistazo.
 *
 * mode="coverage" — asignadas vs. necesarias (cursos, materias):
 *   completo → verde · faltan ≤4h → ámbar · falta más → rojo.
 * mode="quota" — asignadas vs. máximo permitido (carga del docente):
 *   sobre el máximo → rojo · ≥90% del máximo → ámbar · resto → azul.
 */
export function HoursBar({
  assigned,
  total,
  mode,
  className,
}: {
  assigned: number;
  total: number;
  mode: "coverage" | "quota";
  className?: string;
}) {
  const pct =
    total > 0 ? Math.min(100, Math.round((assigned / total) * 100)) : 0;

  let barClass: string;
  let textClass: string;
  let suffix: string | null = null;

  if (mode === "coverage") {
    const missing = Math.max(0, total - assigned);
    if (total === 0) {
      barClass = "bg-gray-300";
      textClass = "text-gray-500";
    } else if (missing === 0) {
      barClass = "bg-green-500";
      textClass = "text-green-700";
      suffix = "completo";
    } else if (missing <= 4) {
      barClass = "bg-amber-400";
      textClass = "text-amber-700";
      suffix = `faltan ${missing}h`;
    } else {
      barClass = "bg-red-400";
      textClass = "text-red-700";
      suffix = `faltan ${missing}h`;
    }
  } else {
    const over = assigned - total;
    if (over > 0) {
      barClass = "bg-red-500";
      textClass = "text-red-700";
      suffix = `+${over}h sobre el máx.`;
    } else if (total > 0 && assigned / total >= 0.9) {
      barClass = "bg-amber-400";
      textClass = "text-amber-700";
      suffix = "casi al máx.";
    } else {
      barClass = "bg-primary-500";
      textClass = "text-gray-600";
    }
  }

  return (
    <div className={cn("flex min-w-32 flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className={cn("font-semibold tabular-nums", textClass)}>
          {assigned}h / {total}h
        </span>
        {suffix && (
          <span className={cn("text-[11px] whitespace-nowrap", textClass)}>
            {suffix}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={assigned}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${assigned} de ${total} horas semanales`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className={cn("h-full rounded-full transition-[width]", barClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
