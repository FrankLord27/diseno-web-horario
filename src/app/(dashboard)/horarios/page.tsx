"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, Play, Printer, TriangleAlert } from "lucide-react";
import type {
  DayOfWeek,
  GenerationMode,
  GenerationResultDto,
  ScheduleCellDto,
  ValidSlotDto,
} from "@horarios/shared-types";
import type { Course, Room, Shift, Subject, Teacher } from "@/types/entities";
import { useCrudResource } from "@/hooks/useCrud";
import { useCurrentUser } from "@/hooks/useAuth";
import {
  useConflicts,
  useGenerateSchedule,
  useMoveEntry,
  useScheduleView,
  type ViewType,
} from "@/hooks/useSchedule";
import { BLOCK_KIND_LABELS, DAY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK } from "@horarios/shared-types";
import { ApiClientError, apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { EntryEditModal } from "./entry-edit-modal";

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "course", label: "Por curso" },
  { value: "teacher", label: "Por docente" },
  { value: "subject", label: "Por materia" },
  { value: "room", label: "Por aula" },
];

const MODE_INFO: { value: GenerationMode; label: string; help: string }[] = [
  {
    value: "COMPLETA",
    label: "Completa",
    help: "Borra todo el horario y lo genera desde cero.",
  },
  {
    value: "CON_BLOQUEO",
    label: "Con bloqueo",
    help: "Respeta las clases bloqueadas 🔒 y regenera el resto.",
  },
  {
    value: "INCREMENTAL",
    label: "Incremental",
    help: "Mantiene todo lo existente y solo coloca las horas que faltan.",
  },
];

export default function HorariosPage() {
  const { isAdmin } = useCurrentUser();
  const [viewType, setViewType] = useState<ViewType>("general");
  const [entityId, setEntityId] = useState<string>("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<ScheduleCellDto | null>(null);

  const shifts = useCrudResource<Shift>("shifts").list;
  const courses = useCrudResource<Course>("courses").list;
  const teachers = useCrudResource<Teacher>("teachers").list;
  const subjects = useCrudResource<Subject>("subjects").list;
  const rooms = useCrudResource<Room>("rooms").list;

  const view = useScheduleView(
    viewType,
    viewType === "general" ? undefined : entityId || undefined,
  );
  const conflicts = useConflicts();
  const move = useMoveEntry();
  const [dragEntry, setDragEntry] = useState<ScheduleCellDto | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  // Franjas válidas (día|bloque) para la clase que se está arrastrando
  const [validKeys, setValidKeys] = useState<Set<string> | null>(null);

  function handleDrop(day: DayOfWeek, timeBlockId: string) {
    const entry = dragEntry;
    setDragEntry(null);
    setDropKey(null);
    if (!entry) return;
    // Mismo lugar: nada que mover
    if (entry.day === day && entry.timeBlockId === timeBlockId) return;
    move.mutate(
      { id: entry.entryId, data: { day, timeBlockId } },
      {
        onSuccess: () => toast.success("Clase movida"),
        onError: (err) => {
          const msg =
            err instanceof ApiClientError
              ? (err.violations?.[0]?.message ?? err.message)
              : err instanceof Error
                ? err.message
                : "No se pudo mover: rompe una regla";
          toast.error(msg);
        },
      },
    );
  }

  const entityOptions = useMemo(() => {
    switch (viewType) {
      case "course":
        return (courses.data ?? []).map((c) => ({
          value: c.id,
          label: c.name,
        }));
      case "teacher":
        return (teachers.data ?? []).map((t) => ({
          value: t.id,
          label: `${t.firstName} ${t.lastName}`,
        }));
      case "subject":
        return (subjects.data ?? []).map((s) => ({
          value: s.id,
          label: s.name,
        }));
      case "room":
        return (rooms.data ?? []).map((r) => ({ value: r.id, label: r.name }));
      default:
        return [];
    }
  }, [viewType, courses.data, teachers.data, subjects.data, rooms.data]);

  // Estructura de filas: bloques del turno del curso (vista por curso)
  // o unión de bloques de todos los turnos (demás vistas)
  const blockRows = useMemo(() => {
    const allShifts = shifts.data ?? [];
    if (viewType === "course" && entityId) {
      const course = (courses.data ?? []).find((c) => c.id === entityId);
      const shift = allShifts.find((s) => s.id === course?.shiftId);
      return shift?.timeBlocks ?? [];
    }
    return allShifts
      .flatMap((s) => s.timeBlocks)
      .sort(
        (a, b) => a.startTime.localeCompare(b.startTime) || a.order - b.order,
      );
  }, [shifts.data, courses.data, viewType, entityId]);

  const cellsByKey = useMemo(() => {
    const map = new Map<string, ScheduleCellDto[]>();
    for (const cell of view.data ?? []) {
      const key = `${cell.day}|${cell.timeBlockId}`;
      const list = map.get(key) ?? [];
      list.push(cell);
      map.set(key, list);
    }
    return map;
  }, [view.data]);

  // Franjas BLOQUEADAS del docente seleccionado (vista Por docente) → "No disponible"
  const teacherBlocked = useMemo(() => {
    if (viewType !== "teacher" || !entityId) return new Set<string>();
    const t = (teachers.data ?? []).find((x) => x.id === entityId);
    return new Set(
      (t?.availabilities ?? [])
        .filter((a) => a.type === "BLOQUEADO")
        .map((a) => `${a.day}|${a.timeBlockId}`),
    );
  }, [viewType, entityId, teachers.data]);

  const needsEntity = viewType !== "general";
  const hardConflicts = (conflicts.data ?? []).filter(
    (c) => c.severity === "DURA",
  );
  const softConflicts = (conflicts.data ?? []).filter(
    (c) => c.severity === "BLANDA",
  );

  return (
    <div className="flex flex-col gap-4 motion-safe:animate-fade-in-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Horario semanal
          </h1>
          <p className="mt-1 text-sm text-gray-500 print:hidden">
            Lunes a viernes · clic en una celda para editarla
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Imprimir / PDF
          </Button>
          {isAdmin && (
            <Button onClick={() => setGenerateOpen(true)}>
              <Play className="size-4" aria-hidden="true" />
              Generar horario
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Select
          aria-label="Tipo de vista"
          value={viewType}
          onChange={(e) => {
            setViewType(e.target.value as ViewType);
            setEntityId("");
          }}
          className="w-44"
        >
          {VIEW_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {needsEntity && (
          <Select
            aria-label="Selecciona la entidad"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="w-64"
          >
            <option value="">— Selecciona —</option>
            {entityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        )}
      </div>

      {isAdmin && (view.data ?? []).length > 0 && (
        <p className="text-xs text-gray-400 print:hidden">
          Arrastra una clase a otra celda para moverla. Un movimiento que rompa
          una regla dura se rechaza automáticamente.
        </p>
      )}

      {/* Resumen de un vistazo: clases colocadas y estado de conflictos */}
      {(view.data ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 print:hidden">
          <Badge tone="blue">
            {(view.data ?? []).length} clases colocadas
          </Badge>
          <Badge tone={hardConflicts.length > 0 ? "red" : "green"}>
            {hardConflicts.length > 0
              ? `${hardConflicts.length} conflicto(s) duro(s)`
              : "Sin conflictos duros"}
          </Badge>
          {softConflicts.length > 0 && (
            <Badge tone="amber">
              {softConflicts.length} preferencia(s) sin cumplir
            </Badge>
          )}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px] print:grid-cols-1 print:gap-0">
        <section className="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card">
          {view.isLoading || shifts.isLoading ? (
            <div className="p-6">
              <Spinner label="Cargando horario" />
            </div>
          ) : needsEntity && !entityId ? (
            <p className="p-6 text-sm text-gray-500">
              Selecciona{" "}
              {viewType === "course"
                ? "un curso"
                : viewType === "teacher"
                  ? "un docente"
                  : viewType === "subject"
                    ? "una materia"
                    : "un aula"}{" "}
              para ver su horario.
            </p>
          ) : (view.data ?? []).length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No hay horario generado todavía.{" "}
              {isAdmin && "Usa el botón “Generar horario”."}
            </p>
          ) : (
            <table className="w-full min-w-[900px] border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-24 border-b border-gray-200 px-2 py-2 text-left font-semibold text-gray-500">
                    Hora
                  </th>
                  {DAYS_OF_WEEK.map((day) => (
                    <th
                      key={day}
                      className="border-b border-l border-gray-200 px-2 py-2 text-left font-semibold text-gray-600"
                    >
                      {DAY_LABELS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blockRows.map((block) => (
                  <tr key={block.id} className="align-top">
                    <td className="border-b border-gray-100 px-2 py-1.5 font-medium text-gray-500">
                      {block.startTime}
                      <span className="text-gray-300">–</span>
                      {block.endTime}
                    </td>
                    {DAYS_OF_WEEK.map((day) => {
                      if (block.kind !== "CLASE") {
                        return (
                          <td
                            key={day}
                            className="border-b border-l border-gray-100 bg-gray-100/70 px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-gray-400"
                          >
                            {BLOCK_KIND_LABELS[block.kind]}
                          </td>
                        );
                      }
                      const cells = cellsByKey.get(`${day}|${block.id}`) ?? [];
                      const cellKey = `${day}|${block.id}`;
                      return (
                        <td
                          key={day}
                          onDragOver={
                            isAdmin
                              ? (e) => {
                                  e.preventDefault();
                                  setDropKey(cellKey);
                                }
                              : undefined
                          }
                          onDragLeave={
                            isAdmin
                              ? () =>
                                  setDropKey((k) => (k === cellKey ? null : k))
                              : undefined
                          }
                          onDrop={
                            isAdmin
                              ? (e) => {
                                  e.preventDefault();
                                  handleDrop(day, block.id);
                                }
                              : undefined
                          }
                          className={cn(
                            "border-b border-l border-gray-100 p-1 transition-colors",
                            dragEntry &&
                              validKeys?.has(cellKey) &&
                              "bg-green-50 ring-1 ring-inset ring-green-300",
                            dropKey === cellKey &&
                              "bg-primary-50 outline-2 -outline-offset-2 outline-primary-400",
                          )}
                        >
                          <div className="flex flex-col gap-1">
                            {cells.map((cell) => (
                              <button
                                key={cell.entryId}
                                type="button"
                                disabled={!isAdmin}
                                draggable={isAdmin && !cell.locked}
                                onDragStart={(e) => {
                                  setDragEntry(cell);
                                  setValidKeys(null);
                                  e.dataTransfer.effectAllowed = "move";
                                  // Resalta en verde dónde SÍ cabe la clase
                                  void apiClient
                                    .get<ValidSlotDto[]>(
                                      `/schedule/entries/${cell.entryId}/valid-slots`,
                                    )
                                    .then((slots) =>
                                      setValidKeys(
                                        new Set(
                                          slots.map(
                                            (s) => `${s.day}|${s.timeBlockId}`,
                                          ),
                                        ),
                                      ),
                                    )
                                    .catch(() => setValidKeys(null));
                                }}
                                onDragEnd={() => {
                                  setDragEntry(null);
                                  setDropKey(null);
                                  setValidKeys(null);
                                }}
                                onClick={() => setEditingCell(cell)}
                                style={{
                                  backgroundColor: `${cell.subjectColor}22`,
                                  borderColor: `${cell.subjectColor}66`,
                                }}
                                className={cn(
                                  "w-full rounded-md border px-1.5 py-1 text-left transition-[transform,box-shadow,opacity] duration-150 ease-out",
                                  isAdmin &&
                                    "motion-safe:hover:-translate-y-px hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-primary-600",
                                  isAdmin &&
                                    !cell.locked &&
                                    "cursor-grab active:cursor-grabbing",
                                  dragEntry?.entryId === cell.entryId &&
                                    "opacity-40",
                                )}
                                title={
                                  cell.locked
                                    ? `${cell.subjectName} — ${cell.teacherName} (${cell.roomName}) · bloqueada, no se puede arrastrar`
                                    : `${cell.subjectName} — ${cell.teacherName} (${cell.roomName})`
                                }
                              >
                                <span className="flex items-center gap-1 font-semibold text-gray-800">
                                  {cell.subjectAbbreviation}
                                  {viewType !== "course" && (
                                    <span className="font-normal text-gray-500">
                                      · {cell.courseName}
                                    </span>
                                  )}
                                  {cell.locked && (
                                    <Lock
                                      className="ml-auto size-3 text-gray-500"
                                      aria-label="Bloqueada"
                                    />
                                  )}
                                </span>
                                <span className="block truncate text-[11px] text-gray-600">
                                  {cell.teacherName}
                                </span>
                                <span className="block truncate text-[11px] text-gray-400">
                                  {cell.roomName}
                                </span>
                              </button>
                            ))}
                            {cells.length === 0 &&
                              teacherBlocked.has(cellKey) && (
                                <div className="rounded-md border border-dashed border-red-200 bg-red-50 px-1.5 py-1 text-center text-[11px] font-medium text-red-600">
                                  No disponible
                                </div>
                              )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="flex flex-col gap-3 print:hidden">
          <div className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <TriangleAlert
                className="size-4 text-amber-500"
                aria-hidden="true"
              />
              Conflictos
            </h2>
            {conflicts.isLoading ? (
              <div className="py-3">
                <Spinner label="Analizando conflictos" />
              </div>
            ) : (conflicts.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">
                Sin conflictos. El horario cumple todas las restricciones duras.
              </p>
            ) : (
              <ul className="mt-3 flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                {[...hardConflicts, ...softConflicts].map((c, i) => (
                  <li
                    key={`${c.type}-${i}`}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Badge tone={c.severity === "DURA" ? "red" : "amber"}>
                        {c.severity}
                      </Badge>
                      {typeof c.weight === "number" && (
                        <span className="text-[11px] text-gray-400">
                          peso {c.weight}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-gray-700">{c.message}</p>
                    {c.suggestion && (
                      <p className="mt-1 text-[11px] text-gray-400">
                        💡 {c.suggestion}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
      />

      {editingCell && (
        <EntryEditModal
          cell={editingCell}
          onClose={() => setEditingCell(null)}
          teachers={teachers.data ?? []}
          rooms={rooms.data ?? []}
          shifts={shifts.data ?? []}
          courses={courses.data ?? []}
          courseCells={(view.data ?? []).filter(
            (c) =>
              c.courseId === editingCell.courseId &&
              c.entryId !== editingCell.entryId,
          )}
        />
      )}
    </div>
  );
}

function GenerateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<GenerationMode>("COMPLETA");
  const generate = useGenerateSchedule();
  const result: GenerationResultDto | undefined = generate.data;

  return (
    <Modal open={open} onClose={onClose} title="Generar horario" size="md">
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-gray-700">
            Modo de generación
          </legend>
          {MODE_INFO.map((m) => (
            <label
              key={m.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                mode === m.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
                className="mt-0.5 accent-primary-600"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">
                  {m.label}
                </span>
                <span className="block text-xs text-gray-500">{m.help}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <ErrorSummary error={generate.error} />

        {result && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-800">
              ✅ {result.placed} horas colocadas
            </p>
            {result.unplaced.length > 0 ? (
              <div className="mt-2">
                <p className="font-medium text-red-700">
                  {result.unplaced.length} asignación(es) incompleta(s):
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                  {result.unplaced.map((u) => (
                    <li key={u.assignmentId}>
                      {u.subjectName} en {u.courseName} ({u.teacherName}):
                      faltan {u.missingHours}h — {u.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-1 text-xs text-green-700">
                Todas las horas semanales quedaron colocadas.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Cerrar
          </Button>
          <Button
            onClick={() => generate.mutate({ mode })}
            loading={generate.isPending}
          >
            <Play className="size-4" aria-hidden="true" />
            Generar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
