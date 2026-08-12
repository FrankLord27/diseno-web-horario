"use client";

import { useEffect, useState } from "react";
import { useScheduleView } from "@/hooks/useSchedule";
import { useCrudResource } from "@/hooks/useCrud";
import type { Course } from "@/types/entities";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { ReadOnlyScheduleGrid } from "@/components/features/ReadOnlyScheduleGrid";

export default function HorariosCursoPage() {
  const courses = useCrudResource<Course>("courses").list;
  const [courseId, setCourseId] = useState("");

  // Selecciona el primer curso automáticamente.
  useEffect(() => {
    if (!courseId && courses.data && courses.data.length > 0) {
      setCourseId(courses.data[0]!.id);
    }
  }, [courses.data, courseId]);

  const view = useScheduleView("course", courseId || undefined);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">
          Horarios por curso
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Elige un curso para ver su horario semanal.
        </p>
      </header>

      <div className="max-w-xs">
        <Select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          aria-label="Curso"
          disabled={courses.isLoading}
        >
          <option value="">Selecciona un curso…</option>
          {(courses.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {courseId && view.isLoading ? (
        <Spinner label="Cargando horario" />
      ) : courseId ? (
        <ReadOnlyScheduleGrid
          cells={view.data ?? []}
          emptyLabel="Este curso todavía no tiene horario generado."
        />
      ) : null}
    </div>
  );
}
