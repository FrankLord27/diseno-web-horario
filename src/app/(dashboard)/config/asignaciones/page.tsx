"use client";

import {
  AssignmentStatusSchema,
  CreateAssignmentSchema,
  type CreateAssignmentInput,
} from "@horarios/shared-types";
import type {
  Assignment,
  Course,
  Room,
  Subject,
  Teacher,
} from "@/types/entities";
import { useCrudResource } from "@/hooks/useCrud";
import { CrudPage } from "@/components/features/CrudPage";
import { ImportExcel } from "@/components/features/ImportExcel";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { ASSIGNMENT_STATUS_LABELS } from "@/lib/labels";
import { courseHoursSummary } from "@/lib/courseHours";

function CourseHoursPreview({
  course,
  subjectId,
  weeklyHours,
}: {
  course: Course;
  subjectId: string;
  weeklyHours: number;
}) {
  const { required } = courseHoursSummary(course);
  const otherAssigned = course.assignments
    .filter((a) => a.subjectId !== subjectId)
    .reduce((sum, a) => sum + a.weeklyHours, 0);
  const withThis =
    otherAssigned + (Number.isFinite(weeklyHours) ? weeklyHours : 0);
  const missing = Math.max(0, required - withThis);

  return (
    <p className="col-span-2 text-xs text-gray-500">
      Este curso necesita <strong className="text-gray-700">{required}h</strong>{" "}
      para llenar su turno. Con esta asignación quedaría en{" "}
      <strong className="text-gray-700">{withThis}h</strong>
      {missing > 0 ? (
        <span className="text-amber-700"> · faltarían {missing}h más</span>
      ) : withThis > required ? (
        <span className="text-red-700">
          {" "}
          · se pasaría por {withThis - required}h
        </span>
      ) : (
        <span className="text-green-700"> · curso completo</span>
      )}
    </p>
  );
}

export default function AsignacionesPage() {
  const teachers = useCrudResource<Teacher>("teachers").list;
  const subjects = useCrudResource<Subject>("subjects").list;
  const courses = useCrudResource<Course>("courses").list;
  const rooms = useCrudResource<Room>("rooms").list;

  return (
    <div className="flex flex-col gap-4">
      <ImportExcel
        entity="assignments"
        title="Importar asignaciones desde Excel"
        description="Docente, materia y curso se buscan por cédula/código o nombre. Carga primero docentes, materias y cursos."
        invalidateKey="assignments"
      />
      <CrudPage<Assignment, CreateAssignmentInput>
        title="Asignaciones"
        description="Qué docente imparte qué materia en qué curso y cuántas horas semanales"
        resource="assignments"
        schema={CreateAssignmentSchema}
        defaultValues={{
          teacherId: "",
          subjectId: "",
          courseId: "",
          weeklyHours: 4,
          preferredRoomId: null,
          status: "ACTIVA",
        }}
        toFormValues={(a) => ({
          teacherId: a.teacherId,
          subjectId: a.subjectId,
          courseId: a.courseId,
          weeklyHours: a.weeklyHours,
          preferredRoomId: a.preferredRoomId,
          status: a.status,
        })}
        itemLabel={(a) => `${a.subject.name} en ${a.course.name}`}
        columns={[
          {
            header: "Docente",
            cell: (a) => `${a.teacher.firstName} ${a.teacher.lastName}`,
          },
          { header: "Materia", cell: (a) => a.subject.name },
          { header: "Curso", cell: (a) => a.course.name },
          { header: "Horas/sem", cell: (a) => a.weeklyHours },
          {
            header: "Estado",
            cell: (a) => (
              <Badge
                tone={
                  a.status === "ACTIVA"
                    ? "green"
                    : a.status === "PENDIENTE"
                      ? "amber"
                      : "gray"
                }
              >
                {ASSIGNMENT_STATUS_LABELS[a.status]}
              </Badge>
            ),
          },
        ]}
        renderForm={(form) => {
          const subjectId = form.watch("subjectId");
          const courseId = form.watch("courseId");
          const weeklyHours = form.watch("weeklyHours");
          const selectedCourse = (courses.data ?? []).find(
            (c) => c.id === courseId,
          );
          const qualifiedTeachers = (teachers.data ?? []).filter(
            (t) =>
              !subjectId ||
              t.teacherSubjects.some((ts) => ts.subjectId === subjectId),
          );
          return (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Materia"
                required
                error={form.formState.errors.subjectId?.message}
              >
                {({ inputId }) => (
                  <Select id={inputId} {...form.register("subjectId")}>
                    <option value="">— Selecciona —</option>
                    {(subjects.data ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field
                label="Docente (habilitado para la materia)"
                required
                error={form.formState.errors.teacherId?.message}
              >
                {({ inputId }) => (
                  <Select id={inputId} {...form.register("teacherId")}>
                    <option value="">— Selecciona —</option>
                    {qualifiedTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field
                label="Curso"
                required
                error={form.formState.errors.courseId?.message}
              >
                {({ inputId }) => (
                  <Select id={inputId} {...form.register("courseId")}>
                    <option value="">— Selecciona —</option>
                    {(courses.data ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field
                label="Horas semanales"
                required
                error={form.formState.errors.weeklyHours?.message}
              >
                {({ inputId }) => (
                  <Input
                    id={inputId}
                    type="number"
                    min={1}
                    max={20}
                    {...form.register("weeklyHours", { valueAsNumber: true })}
                  />
                )}
              </Field>
              {selectedCourse && (
                <CourseHoursPreview
                  course={selectedCourse}
                  subjectId={subjectId}
                  weeklyHours={weeklyHours}
                />
              )}
              <Field label="Aula preferida (opcional)">
                {({ inputId }) => (
                  <Select
                    id={inputId}
                    {...form.register("preferredRoomId", {
                      setValueAs: (v: string) => (v === "" ? null : v),
                    })}
                  >
                    <option value="">— Automática —</option>
                    {(rooms.data ?? []).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Estado">
                {({ inputId }) => (
                  <Select id={inputId} {...form.register("status")}>
                    {AssignmentStatusSchema.options.map((s) => (
                      <option key={s} value={s}>
                        {ASSIGNMENT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          );
        }}
      />
    </div>
  );
}
