"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  DEFAULT_EXPORT_HEADER_TITLE,
  type ExportFormat,
  type ExportLayout,
} from "@horarios/shared-types";
import type { Course, Room, Teacher } from "@/types/entities";
import { useCrudResource } from "@/hooks/useCrud";
import { apiClient } from "@/lib/api-client";
import { ROOM_KIND_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

const LAYOUTS: { value: ExportLayout; label: string; help: string }[] = [
  {
    value: "MIXTO",
    label: "Mixto (recomendado)",
    help: "Hoja resumen + una hoja por curso + hojas por aula/docente seleccionados.",
  },
  {
    value: "POR_CURSO",
    label: "Una hoja por curso",
    help: "El archivo tiene una hoja con la grilla semanal de cada curso.",
  },
  {
    value: "RESUMEN",
    label: "Solo resumen",
    help: "Una sola hoja con todos los cursos en filas (vista panorámica).",
  },
];

const TITLES_STORAGE_KEY = "horarios_export_titles";

interface StoredTitles {
  headerTitle: string;
  subtitle: string;
  footerNote: string;
}

const DEFAULT_TITLES: StoredTitles = {
  headerTitle: DEFAULT_EXPORT_HEADER_TITLE,
  subtitle: "",
  footerNote: "",
};

export default function ExportarPage() {
  const courses = useCrudResource<Course>("courses").list;
  const rooms = useCrudResource<Room>("rooms").list;
  const teachers = useCrudResource<Teacher>("teachers").list;

  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [roomIds, setRoomIds] = useState<string[]>([]);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [layout, setLayout] = useState<ExportLayout>("MIXTO");
  const [format, setFormat] = useState<ExportFormat>("XLSX");
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [gridStartTime, setGridStartTime] = useState("07:00");
  const [gridEndTime, setGridEndTime] = useState("13:00");
  const [titles, setTitles] = useState<StoredTitles>(DEFAULT_TITLES);
  const [downloading, setDownloading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function downloadTeachersReport() {
    setError(null);
    setReportLoading(true);
    try {
      const { blob, filename } = await apiClient.getBlob(
        "/export/teachers-report",
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err);
    } finally {
      setReportLoading(false);
    }
  }

  // Títulos recordados entre sesiones
  useEffect(() => {
    const raw = window.localStorage.getItem(TITLES_STORAGE_KEY);
    if (raw) {
      try {
        setTitles({ ...DEFAULT_TITLES, ...(JSON.parse(raw) as StoredTitles) });
      } catch {
        // valor corrupto: se ignora y quedan los defaults
      }
    }
  }, []);

  function updateTitles(patch: Partial<StoredTitles>) {
    setTitles((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem(TITLES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const specialRooms = (rooms.data ?? []).filter((r) => r.kind !== "REGULAR");
  const allCourses = courses.data ?? [];
  const allTeachers = teachers.data ?? [];
  const allSelected =
    courseIds.length === allCourses.length && allCourses.length > 0;

  function toggle(list: string[], id: string, set: (v: string[]) => void) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const gridInvalid = gridStartTime >= gridEndTime;

  async function download() {
    setError(null);
    setDownloading(true);
    try {
      // El input numérico permite teclear valores fuera de rango: se ajusta antes de enviar
      const safeSlotMinutes = Math.min(
        240,
        Math.max(15, Number.isFinite(slotMinutes) ? slotMinutes : 60),
      );
      const { blob, filename } = await apiClient.postBlob("/export/schedule", {
        format,
        layout,
        courseIds,
        roomIds,
        teacherIds,
        slotMinutes: safeSlotMinutes,
        gridStartTime,
        gridEndTime,
        titles: {
          headerTitle: titles.headerTitle || DEFAULT_EXPORT_HEADER_TITLE,
          subtitle: titles.subtitle || null,
          footerNote: titles.footerNote || null,
        },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err);
    } finally {
      setDownloading(false);
    }
  }

  if (courses.isLoading || rooms.isLoading || teachers.isLoading) {
    return <Spinner label="Cargando cursos, aulas y docentes" />;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5 motion-safe:animate-fade-in-up">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">
          Exportar horarios
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Rejilla días × horas lista para imprimir: cursos para estudiantes y
          hojas por docente con sus cursos, horas y materias. Todo el encabezado
          es editable.
        </p>
      </header>

      <section className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Reporte de carga docente
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Excel: por docente, sus cursos, materias, horas y de qué curso es
              tutor.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => void downloadTeachersReport()}
            loading={reportLoading}
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar Excel
          </Button>
        </div>
      </section>

      <section className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Cursos a incluir
          </h2>
          <Checkbox
            label="Seleccionar todos"
            checked={allSelected}
            onChange={() =>
              setCourseIds(allSelected ? [] : allCourses.map((c) => c.id))
            }
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {allCourses.map((c) => (
            <Checkbox
              key={c.id}
              label={c.name}
              checked={courseIds.includes(c.id)}
              onChange={() => toggle(courseIds, c.id, setCourseIds)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900">
          Docentes (hoja con sus cursos, horas y materias)
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {allTeachers.map((t) => (
            <Checkbox
              key={t.id}
              label={`${t.firstName} ${t.lastName}`}
              checked={teacherIds.includes(t.id)}
              onChange={() => toggle(teacherIds, t.id, setTeacherIds)}
            />
          ))}
        </div>
      </section>

      {specialRooms.length > 0 && (
        <section className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
          <h2 className="text-sm font-semibold text-gray-900">
            Aulas especiales (hoja de ocupación por aula)
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {specialRooms.map((r) => (
              <Checkbox
                key={r.id}
                label={`${r.name} — ${ROOM_KIND_LABELS[r.kind]}`}
                checked={roomIds.includes(r.id)}
                onChange={() => toggle(roomIds, r.id, setRoomIds)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900">Rejilla horaria</h2>
        <p className="mt-1 text-xs text-gray-500">
          Los días van en horizontal y las horas en vertical. Define el rango y
          la duración de cada franja (una clase típica = 1 hora).
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Field label="Desde">
            {({ inputId }) => (
              <Input
                id={inputId}
                type="time"
                value={gridStartTime}
                onChange={(e) => setGridStartTime(e.target.value)}
              />
            )}
          </Field>
          <Field label="Hasta">
            {({ inputId }) => (
              <Input
                id={inputId}
                type="time"
                value={gridEndTime}
                onChange={(e) => setGridEndTime(e.target.value)}
              />
            )}
          </Field>
          <Field label="Franja (minutos)">
            {({ inputId }) => (
              <Input
                id={inputId}
                type="number"
                min={15}
                max={240}
                step={15}
                value={slotMinutes}
                onChange={(e) => setSlotMinutes(Number(e.target.value))}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900">
          Títulos del documento (editables)
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Encabezado principal">
            {({ inputId }) => (
              <Input
                id={inputId}
                value={titles.headerTitle}
                placeholder={DEFAULT_EXPORT_HEADER_TITLE}
                onChange={(e) => updateTitles({ headerTitle: e.target.value })}
              />
            )}
          </Field>
          <Field
            label="Subtítulo"
            hint="Vacío = automático por hoja (nombre del curso, docente o aula)"
          >
            {({ inputId }) => (
              <Input
                id={inputId}
                value={titles.subtitle}
                placeholder="Automático"
                onChange={(e) => updateTitles({ subtitle: e.target.value })}
              />
            )}
          </Field>
          <Field
            label="Nota al pie"
            hint="Vacío = 'Semana regular lunes a viernes · Generado: fecha'"
          >
            {({ inputId }) => (
              <Input
                id={inputId}
                value={titles.footerNote}
                placeholder="Automática"
                onChange={(e) => updateTitles({ footerNote: e.target.value })}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="rounded-card border border-gray-200 bg-white p-4 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900">
          Formato del archivo
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {LAYOUTS.map((l) => (
            <label
              key={l.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                layout === l.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <input
                type="radio"
                name="layout"
                checked={layout === l.value}
                onChange={() => setLayout(l.value)}
                className="mt-0.5 accent-primary-600"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">
                  {l.label}
                </span>
                <span className="block text-xs text-gray-500">{l.help}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex gap-4">
          {(["XLSX", "CSV"] as const).map((f) => (
            <label
              key={f}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="radio"
                name="format"
                checked={format === f}
                onChange={() => setFormat(f)}
                className="accent-primary-600"
              />
              {f === "XLSX" ? "Excel (.xlsx)" : "CSV"}
            </label>
          ))}
        </div>
      </section>

      <ErrorSummary error={error} />

      <div>
        <Button
          onClick={() => void download()}
          loading={downloading}
          disabled={courseIds.length === 0 || gridInvalid}
        >
          <Download className="size-4" aria-hidden="true" />
          Descargar {format === "XLSX" ? "Excel" : "CSV"}
        </Button>
        {courseIds.length === 0 && (
          <p className="mt-2 text-xs text-gray-400">
            Selecciona al menos un curso.
          </p>
        )}
        {gridInvalid && (
          <p className="mt-2 text-xs text-red-500">
            La hora &quot;Desde&quot; debe ser menor que &quot;Hasta&quot;.
          </p>
        )}
      </div>
    </div>
  );
}
