"use client";

import {
  CreateSubjectSchema,
  RoomKindSchema,
  SubjectKindSchema,
  type CreateSubjectInput,
} from "@horarios/shared-types";
import type { Grade, Subject } from "@/types/entities";
import { useCrudResource } from "@/hooks/useCrud";
import { CrudPage } from "@/components/features/CrudPage";
import { ImportExcel } from "@/components/features/ImportExcel";
import { GradeLoadsEditor } from "@/components/features/GradeLoadsEditor";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { ROOM_KIND_LABELS, SUBJECT_KIND_LABELS } from "@/lib/labels";

export default function MateriasPage() {
  const grades = useCrudResource<Grade>("grades").list;

  return (
    <div className="flex flex-col gap-4">
      <ImportExcel
        entity="subjects"
        title="Importar materias desde Excel"
        description="Sube tu lista de materias en cualquier formato. Las horas por grado se asignan después."
        invalidateKey="subjects"
      />
      <CrudPage<Subject, CreateSubjectInput>
        title="Materias"
        description="Asignaturas con su carga semanal por grado y requisitos de aula"
        resource="subjects"
        modalSize="lg"
        schema={CreateSubjectSchema}
        defaultValues={{
          code: "",
          name: "",
          abbreviation: "",
          color: "#3b82f6",
          kind: "TEORICA",
          requiresSpecialRoom: false,
          requiredRoomKind: null,
          allowsDoubleBlocks: false,
          maxBlocksPerDay: 2,
          gradeLoads: [],
        }}
        toFormValues={(s) => ({
          code: s.code,
          name: s.name,
          abbreviation: s.abbreviation,
          color: s.color,
          kind: s.kind,
          requiresSpecialRoom: s.requiresSpecialRoom,
          requiredRoomKind: s.requiredRoomKind,
          allowsDoubleBlocks: s.allowsDoubleBlocks,
          maxBlocksPerDay: s.maxBlocksPerDay,
          gradeLoads: s.gradeLoads.map((l) => ({
            gradeId: l.gradeId,
            weeklyHours: l.weeklyHours,
          })),
        })}
        itemLabel={(s) => s.name}
        columns={[
          {
            header: "Materia",
            cell: (s) => (
              <span className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                  aria-hidden="true"
                />
                {s.name} ({s.abbreviation})
              </span>
            ),
          },
          { header: "Tipo", cell: (s) => SUBJECT_KIND_LABELS[s.kind] },
          {
            header: "Aula especial",
            cell: (s) =>
              s.requiresSpecialRoom && s.requiredRoomKind
                ? ROOM_KIND_LABELS[s.requiredRoomKind]
                : "—",
          },
          {
            header: "Dobles",
            cell: (s) => (s.allowsDoubleBlocks ? "Sí" : "No"),
          },
          {
            header: "Cargas",
            cell: (s) =>
              s.gradeLoads
                .map((l) => `${l.grade.name}: ${l.weeklyHours}h`)
                .join(" · ") || "—",
          },
        ]}
        renderForm={(form) => {
          const requiresSpecial = form.watch("requiresSpecialRoom");
          return (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Código"
                  required
                  error={form.formState.errors.code?.message}
                >
                  {({ inputId }) => (
                    <Input
                      id={inputId}
                      placeholder="MAT"
                      {...form.register("code")}
                    />
                  )}
                </Field>
                <Field
                  label="Nombre"
                  required
                  error={form.formState.errors.name?.message}
                >
                  {({ inputId }) => (
                    <Input
                      id={inputId}
                      placeholder="Matemáticas"
                      {...form.register("name")}
                    />
                  )}
                </Field>
                <Field
                  label="Abreviatura"
                  required
                  error={form.formState.errors.abbreviation?.message}
                >
                  {({ inputId }) => (
                    <Input
                      id={inputId}
                      placeholder="MAT"
                      maxLength={10}
                      {...form.register("abbreviation")}
                    />
                  )}
                </Field>
                <Field
                  label="Color"
                  required
                  error={form.formState.errors.color?.message}
                >
                  {({ inputId }) => (
                    <Input
                      id={inputId}
                      type="color"
                      className="h-9 w-20 cursor-pointer p-1"
                      {...form.register("color")}
                    />
                  )}
                </Field>
                <Field
                  label="Tipo"
                  required
                  error={form.formState.errors.kind?.message}
                >
                  {({ inputId }) => (
                    <Select id={inputId} {...form.register("kind")}>
                      {SubjectKindSchema.options.map((k) => (
                        <option key={k} value={k}>
                          {SUBJECT_KIND_LABELS[k]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field
                  label="Bloques máx. por día"
                  required
                  error={form.formState.errors.maxBlocksPerDay?.message}
                >
                  {({ inputId }) => (
                    <Input
                      id={inputId}
                      type="number"
                      min={1}
                      max={8}
                      {...form.register("maxBlocksPerDay", {
                        valueAsNumber: true,
                      })}
                    />
                  )}
                </Field>
              </div>

              <div className="flex flex-col gap-2">
                <Checkbox
                  label="Permite bloques dobles (dos bloques consecutivos)"
                  {...form.register("allowsDoubleBlocks")}
                />
                <Checkbox
                  label="Requiere aula especial"
                  {...form.register("requiresSpecialRoom")}
                />
              </div>

              {requiresSpecial && (
                <Field
                  label="Tipo de aula requerida"
                  required
                  error={form.formState.errors.requiredRoomKind?.message}
                >
                  {({ inputId }) => (
                    <Select
                      id={inputId}
                      {...form.register("requiredRoomKind", {
                        setValueAs: (v: string) => (v === "" ? null : v),
                      })}
                    >
                      <option value="">— Selecciona —</option>
                      {RoomKindSchema.options
                        .filter((k) => k !== "REGULAR")
                        .map((k) => (
                          <option key={k} value={k}>
                            {ROOM_KIND_LABELS[k]}
                          </option>
                        ))}
                    </Select>
                  )}
                </Field>
              )}

              <GradeLoadsEditor form={form} grades={grades.data ?? []} />
            </>
          );
        }}
      />
    </div>
  );
}
