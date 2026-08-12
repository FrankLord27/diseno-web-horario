"use client";

import { useState } from "react";
import {
  CreateCourseSchema,
  type CreateCourseInput,
} from "@horarios/shared-types";
import type { Course, Grade, Room, Shift } from "@/types/entities";
import type { UseFormReturn } from "react-hook-form";
import { useCrudResource } from "@/hooks/useCrud";
import { CrudPage } from "@/components/features/CrudPage";
import { Badge } from "@/components/ui/Badge";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { courseHoursSummary } from "@/lib/courseHours";

function HoursBadge({ course }: { course: Course }) {
  const { assigned, required, missing } = courseHoursSummary(course);
  const tone = missing === 0 ? "green" : missing <= 4 ? "amber" : "red";
  return (
    <Badge tone={tone}>
      {assigned}h / {required}h{missing > 0 ? ` · faltan ${missing}h` : ""}
    </Badge>
  );
}

function CourseAssignmentsDetail({ course }: { course: Course }) {
  const { assigned, required, missing } = courseHoursSummary(course);
  if (course.assignments.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Este curso todavía no tiene ninguna materia asignada.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        <strong className="text-gray-700">{assigned}h</strong> asignadas de{" "}
        <strong className="text-gray-700">{required}h</strong> que necesita el
        turno.
        {missing > 0 && (
          <span className="text-amber-700">
            {" "}
            Faltan {missing}h para que el curso no tenga periodos libres.
          </span>
        )}
      </p>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
        {course.assignments.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-2 text-sm text-gray-700"
          >
            <span>{a.subject.name}</span>
            <span className="font-medium">{a.weeklyHours}h</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SECTIONS = ["A", "B", "C", "D", "E"] as const;
type Section = (typeof SECTIONS)[number];

const ORDINALS: Record<number, string> = {
  1: "1RO",
  2: "2DO",
  3: "3RO",
  4: "4TO",
  5: "5TO",
  6: "6TO",
};

function deriveCourseNames(
  gradeCode: string,
  section: string,
): { code: string; name: string } {
  const match = /^(?:PRI|SEC|INI)-(\d+)$/.exec(gradeCode);
  if (match) {
    const n = parseInt(match[1]!, 10);
    return {
      code: `${n}${section}`,
      name: `${ORDINALS[n] ?? `${n}RO`} ${section}`,
    };
  }
  return { code: `${gradeCode}-${section}`, name: `${gradeCode} ${section}` };
}

function initialSectionFromCode(code: string): Section {
  const lastChar = code.slice(-1).toUpperCase();
  return (SECTIONS as readonly string[]).includes(lastChar)
    ? (lastChar as Section)
    : "A";
}

function CursoFormFields({
  form,
  grades,
  shifts,
  rooms,
}: {
  form: UseFormReturn<CreateCourseInput>;
  grades: Grade[];
  shifts: Shift[];
  rooms: Room[];
}) {
  const gradeId = form.watch("gradeId");
  const currentCode = form.watch("code");

  const [section, setSection] = useState<Section>(() =>
    initialSectionFromCode(form.getValues("code")),
  );

  const selectedGrade = grades.find((g) => g.id === gradeId);
  const preview = selectedGrade
    ? deriveCourseNames(selectedGrade.code, section)
    : null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field
        label="Grado"
        required
        description="Grado al que pertenece esta sección"
        error={form.formState.errors.gradeId?.message}
      >
        {({ inputId }) => (
          <Select
            id={inputId}
            value={gradeId}
            onChange={(e) => {
              const newId = e.target.value;
              form.setValue("gradeId", newId, { shouldValidate: true });
              const grade = grades.find((g) => g.id === newId);
              if (grade) {
                const { code, name } = deriveCourseNames(grade.code, section);
                form.setValue("code", code);
                form.setValue("name", name);
              }
            }}
          >
            <option value="">— Selecciona —</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Sección" required hint="Letra que identifica el grupo">
        {({ inputId }) => (
          <Select
            id={inputId}
            value={section}
            onChange={(e) => {
              const newSection = e.target.value as Section;
              setSection(newSection);
              if (selectedGrade) {
                const { code, name } = deriveCourseNames(
                  selectedGrade.code,
                  newSection,
                );
                form.setValue("code", code);
                form.setValue("name", name);
              }
            }}
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                Sección {s}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {preview && (
        <>
          <Field label="Código generado" hint="Se guarda automáticamente">
            {({ inputId }) => (
              <Input
                id={inputId}
                value={currentCode || preview.code}
                readOnly
                className="cursor-default bg-gray-50 text-gray-500"
              />
            )}
          </Field>
          <Field label="Nombre generado" hint="Se guarda automáticamente">
            {({ inputId }) => (
              <Input
                id={inputId}
                value={form.watch("name") || preview.name}
                readOnly
                className="cursor-default bg-gray-50 text-gray-500"
              />
            )}
          </Field>
        </>
      )}

      <Field
        label="Turno"
        required
        description="Horario del día en que el curso recibe clases"
        error={form.formState.errors.shiftId?.message}
      >
        {({ inputId }) => (
          <Select id={inputId} {...form.register("shiftId")}>
            <option value="">— Selecciona —</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label="Capacidad"
        required
        error={form.formState.errors.capacity?.message}
        hint="Número máximo de estudiantes"
      >
        {({ inputId }) => (
          <Input
            id={inputId}
            type="number"
            min={1}
            {...form.register("capacity", { valueAsNumber: true })}
          />
        )}
      </Field>

      <Field label="Aula base (opcional)" className="col-span-2">
        {({ inputId }) => (
          <Select
            id={inputId}
            {...form.register("homeRoomId", {
              setValueAs: (v: string) => (v === "" ? null : v),
            })}
          >
            <option value="">— Sin aula base —</option>
            {rooms
              .filter((r) => r.kind === "REGULAR")
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (cap. {r.capacity})
                </option>
              ))}
          </Select>
        )}
      </Field>
    </div>
  );
}

export default function CursosPage() {
  const grades = useCrudResource<Grade>("grades").list;
  const shifts = useCrudResource<Shift>("shifts").list;
  const rooms = useCrudResource<Room>("rooms").list;

  return (
    <CrudPage<Course, CreateCourseInput>
      title="Cursos (secciones)"
      description="Secciones de cada grado: 1RO A, 1RO B… El código y nombre se generan solos"
      resource="courses"
      schema={CreateCourseSchema}
      defaultValues={{
        code: "",
        name: "",
        gradeId: "",
        shiftId: "",
        capacity: 30,
        homeRoomId: null,
      }}
      toFormValues={(c) => ({
        code: c.code,
        name: c.name,
        gradeId: c.gradeId,
        shiftId: c.shiftId,
        capacity: c.capacity,
        homeRoomId: c.homeRoomId,
      })}
      itemLabel={(c) => c.name}
      columns={[
        { header: "Código", cell: (c) => c.code },
        { header: "Nombre", cell: (c) => c.name },
        { header: "Grado", cell: (c) => c.grade.name },
        { header: "Turno", cell: (c) => c.shift.name },
        { header: "Capacidad", cell: (c) => c.capacity },
        { header: "Aula base", cell: (c) => c.homeRoom?.name ?? "—" },
        { header: "Horas asignadas", cell: (c) => <HoursBadge course={c} /> },
      ]}
      renderForm={(form) => (
        <CursoFormFields
          form={form}
          grades={grades.data ?? []}
          shifts={shifts.data ?? []}
          rooms={rooms.data ?? []}
        />
      )}
      renderExpanded={(c) => <CourseAssignmentsDetail course={c} />}
    />
  );
}
