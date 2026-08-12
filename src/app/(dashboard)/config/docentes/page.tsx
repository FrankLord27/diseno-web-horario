"use client";

import {
  ContractTypeSchema,
  CreateTeacherSchema,
  TeacherStatusSchema,
  type CreateTeacherInput,
} from "@horarios/shared-types";
import type { Course, Shift, Subject, Teacher } from "@/types/entities";
import { useCrudResource } from "@/hooks/useCrud";
import { CrudPage } from "@/components/features/CrudPage";
import { ImportExcel } from "@/components/features/ImportExcel";
import { MultiSelect } from "@/components/features/MultiSelect";
import { AvailabilityGrid } from "@/components/features/AvailabilityGrid";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import {
  CONTRACT_TYPE_LABELS,
  DAY_LABELS,
  TEACHER_STATUS_LABELS,
} from "@/lib/labels";

function AvailabilityBadge({ teacher }: { teacher: Teacher }) {
  if (teacher.availabilities.length === 0) {
    return <Badge tone="gray">Sin disponibilidad cargada</Badge>;
  }
  const blocked = teacher.availabilities.filter(
    (a) => a.type === "BLOQUEADO",
  ).length;
  const preferred = teacher.availabilities.filter(
    (a) => a.type === "PREFERIDO",
  ).length;
  return (
    <div className="flex flex-wrap gap-1">
      {blocked > 0 && (
        <Badge tone="red">
          {blocked} bloqueo{blocked === 1 ? "" : "s"}
        </Badge>
      )}
      {preferred > 0 && (
        <Badge tone="blue">
          {preferred} preferido{preferred === 1 ? "" : "s"}
        </Badge>
      )}
    </div>
  );
}

function AvailabilityDetail({ teacher }: { teacher: Teacher }) {
  if (teacher.availabilities.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Sin restricciones de disponibilidad — se asume disponible en todos los
        bloques.
      </p>
    );
  }
  const byDay = new Map<string, Teacher["availabilities"]>();
  for (const a of teacher.availabilities) {
    const list = byDay.get(a.day) ?? [];
    list.push(a);
    byDay.set(a.day, list);
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[...byDay.entries()].map(([day, items]) => (
        <div key={day}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {DAY_LABELS[day as keyof typeof DAY_LABELS]}
          </p>
          <ul className="flex flex-col gap-1">
            {items
              .sort((a, b) => a.timeBlock.order - b.timeBlock.order)
              .map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-gray-600">
                    {a.timeBlock.startTime}–{a.timeBlock.endTime}
                  </span>
                  <Badge tone={a.type === "BLOQUEADO" ? "red" : "blue"}>
                    {a.type === "BLOQUEADO" ? "Bloqueado" : "Preferido"}
                  </Badge>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function DocentesPage() {
  const subjects = useCrudResource<Subject>("subjects").list;
  const shifts = useCrudResource<Shift>("shifts").list;
  const courses = useCrudResource<Course>("courses").list;

  return (
    <div className="flex flex-col gap-4">
      <ImportExcel
        entity="teachers"
        title="Importar docentes desde Excel"
        description="Sube tu lista en cualquier formato: conectas tus columnas una vez. Materias y disponibilidad se asignan después."
        invalidateKey="teachers"
      />
      <CrudPage<Teacher, CreateTeacherInput>
        title="Docentes"
        description="Datos, materias habilitadas, carga máxima y disponibilidad semanal"
        resource="teachers"
        modalSize="lg"
        schema={CreateTeacherSchema}
        defaultValues={{
          firstName: "",
          lastName: "",
          cedula: "",
          phone: "",
          email: "",
          status: "ACTIVO",
          specialty: "",
          degrees: "",
          maxWeeklyHours: 30,
          maxDailyBlocks: 6,
          maxConsecutiveBlocks: 4,
          contractType: "FIJO",
          tutorCourseId: null,
          subjectIds: [],
          availability: [],
        }}
        toFormValues={(t) => ({
          firstName: t.firstName,
          lastName: t.lastName,
          cedula: t.cedula,
          phone: t.phone ?? "",
          email: t.email ?? "",
          status: t.status,
          specialty: t.specialty ?? "",
          degrees: t.degrees ?? "",
          maxWeeklyHours: t.maxWeeklyHours,
          maxDailyBlocks: t.maxDailyBlocks,
          maxConsecutiveBlocks: t.maxConsecutiveBlocks,
          contractType: t.contractType,
          tutorCourseId: t.tutorCourseId,
          subjectIds: t.teacherSubjects.map((ts) => ts.subjectId),
          availability: t.availabilities.map((a) => ({
            day: a.day,
            timeBlockId: a.timeBlockId,
            type: a.type,
            note: a.note,
          })),
        })}
        itemLabel={(t) => `${t.firstName} ${t.lastName}`}
        columns={[
          { header: "Nombre", cell: (t) => `${t.firstName} ${t.lastName}` },
          { header: "Cédula", cell: (t) => t.cedula },
          {
            header: "Materias",
            cell: (t) =>
              t.teacherSubjects
                .map((ts) => ts.subject.abbreviation)
                .join(", ") || "—",
          },
          { header: "Carga máx.", cell: (t) => `${t.maxWeeklyHours}h/sem` },
          {
            header: "Función",
            cell: (t) =>
              t.tutorCourse ? `Tutor · ${t.tutorCourse.name}` : "—",
          },
          {
            header: "Estado",
            cell: (t) => (
              <Badge tone={t.status === "ACTIVO" ? "green" : "gray"}>
                {TEACHER_STATUS_LABELS[t.status]}
              </Badge>
            ),
          },
          {
            header: "Disponibilidad",
            cell: (t) => <AvailabilityBadge teacher={t} />,
          },
        ]}
        renderForm={(form) => (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Nombres"
                required
                error={form.formState.errors.firstName?.message}
              >
                {({ inputId }) => (
                  <Input id={inputId} {...form.register("firstName")} />
                )}
              </Field>
              <Field
                label="Apellidos"
                required
                error={form.formState.errors.lastName?.message}
              >
                {({ inputId }) => (
                  <Input id={inputId} {...form.register("lastName")} />
                )}
              </Field>
              <Field
                label="Cédula"
                required
                error={form.formState.errors.cedula?.message}
              >
                {({ inputId }) => (
                  <Input
                    id={inputId}
                    placeholder="001-0000000-0"
                    {...form.register("cedula")}
                  />
                )}
              </Field>
              <Field
                label="Teléfono"
                error={form.formState.errors.phone?.message}
              >
                {({ inputId }) => (
                  <Input id={inputId} {...form.register("phone")} />
                )}
              </Field>
              <Field
                label="Correo"
                error={form.formState.errors.email?.message}
              >
                {({ inputId }) => (
                  <Input
                    id={inputId}
                    type="email"
                    {...form.register("email", {
                      setValueAs: (v: string) => (v === "" ? null : v),
                    })}
                  />
                )}
              </Field>
              <Field
                label="Especialidad"
                error={form.formState.errors.specialty?.message}
              >
                {({ inputId }) => (
                  <Input id={inputId} {...form.register("specialty")} />
                )}
              </Field>
              <Field label="Estado">
                {({ inputId }) => (
                  <Select id={inputId} {...form.register("status")}>
                    {TeacherStatusSchema.options.map((s) => (
                      <option key={s} value={s}>
                        {TEACHER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Tipo de contrato">
                {({ inputId }) => (
                  <Select id={inputId} {...form.register("contractType")}>
                    {ContractTypeSchema.options.map((c) => (
                      <option key={c} value={c}>
                        {CONTRACT_TYPE_LABELS[c]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field
                label="Carga máx. semanal (horas)"
                required
                error={form.formState.errors.maxWeeklyHours?.message}
              >
                {({ inputId }) => (
                  <Input
                    id={inputId}
                    type="number"
                    min={1}
                    {...form.register("maxWeeklyHours", {
                      valueAsNumber: true,
                    })}
                  />
                )}
              </Field>
              <Field
                label="Carga máx. diaria (bloques)"
                required
                error={form.formState.errors.maxDailyBlocks?.message}
              >
                {({ inputId }) => (
                  <Input
                    id={inputId}
                    type="number"
                    min={1}
                    {...form.register("maxDailyBlocks", {
                      valueAsNumber: true,
                    })}
                  />
                )}
              </Field>
              <Field
                label="Bloques consecutivos máx."
                required
                error={form.formState.errors.maxConsecutiveBlocks?.message}
              >
                {({ inputId }) => (
                  <Input
                    id={inputId}
                    type="number"
                    min={1}
                    {...form.register("maxConsecutiveBlocks", {
                      valueAsNumber: true,
                    })}
                  />
                )}
              </Field>
            </div>

            <MultiSelect
              label="Materias que puede impartir"
              options={(subjects.data ?? []).map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              value={form.watch("subjectIds")}
              onChange={(v) =>
                form.setValue("subjectIds", v, { shouldValidate: true })
              }
            />

            <Field
              label="Función (tutor de un curso)"
              error={form.formState.errors.tutorCourseId?.message}
            >
              {({ inputId }) => (
                <Select
                  id={inputId}
                  value={form.watch("tutorCourseId") ?? ""}
                  onChange={(e) =>
                    form.setValue("tutorCourseId", e.target.value || null, {
                      shouldValidate: true,
                    })
                  }
                >
                  <option value="">— No es tutor —</option>
                  {(courses.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <AvailabilityGrid
              shifts={shifts.data ?? []}
              value={form.watch("availability")}
              onChange={(v) =>
                form.setValue("availability", v, { shouldValidate: true })
              }
            />
          </>
        )}
        renderExpanded={(t) => <AvailabilityDetail teacher={t} />}
      />
    </div>
  );
}
