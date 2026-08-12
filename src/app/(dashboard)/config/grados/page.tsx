"use client";

import {
  CreateGradeSchema,
  type CreateGradeInput,
} from "@horarios/shared-types";
import type { Grade, Level } from "@/types/entities";
import type { UseFormReturn } from "react-hook-form";
import { useCrudResource } from "@/hooks/useCrud";
import { CrudPage } from "@/components/features/CrudPage";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";

const GRADE_OPTIONS: Record<string, { code: string; name: string }[]> = {
  INI: [
    { code: "INI-1", name: "Primer Ciclo (0–3 años)" },
    { code: "INI-2", name: "Segundo Ciclo (3–6 años)" },
  ],
  PRI: [
    { code: "PRI-1", name: "1ro de Primaria" },
    { code: "PRI-2", name: "2do de Primaria" },
    { code: "PRI-3", name: "3ro de Primaria" },
    { code: "PRI-4", name: "4to de Primaria" },
    { code: "PRI-5", name: "5to de Primaria" },
    { code: "PRI-6", name: "6to de Primaria" },
  ],
  SEC: [
    { code: "SEC-1", name: "Primer Año de Secundaria" },
    { code: "SEC-2", name: "Segundo Año de Secundaria" },
    { code: "SEC-3", name: "Tercer Año de Secundaria" },
    { code: "SEC-4", name: "Cuarto Año de Secundaria" },
    { code: "SEC-5", name: "Quinto Año de Secundaria" },
    { code: "SEC-6", name: "Sexto Año de Secundaria" },
  ],
};

function GradoFormFields({
  form,
  levels,
}: {
  form: UseFormReturn<CreateGradeInput>;
  levels: Level[];
}) {
  const levelId = form.watch("levelId");
  const currentCode = form.watch("code");

  const selectedLevel = levels.find((l) => l.id === levelId);
  const gradeOptions = selectedLevel
    ? (GRADE_OPTIONS[selectedLevel.code] ?? [])
    : [];

  return (
    <>
      <Field
        label="Nivel educativo"
        required
        description="Selecciona el nivel primero para ver los grados disponibles"
        error={form.formState.errors.levelId?.message}
      >
        {({ inputId }) => (
          <Select
            id={inputId}
            value={levelId}
            onChange={(e) => {
              form.setValue("levelId", e.target.value, {
                shouldValidate: true,
              });
              form.setValue("code", "", { shouldValidate: false });
              form.setValue("name", "", { shouldValidate: false });
            }}
          >
            <option value="">— Selecciona un nivel —</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {levelId && (
        <Field
          label="Grado"
          required
          error={
            form.formState.errors.code?.message ??
            form.formState.errors.name?.message
          }
          hint="El nombre y código se guardan automáticamente al seleccionar"
        >
          {({ inputId }) => (
            <Select
              id={inputId}
              value={currentCode}
              onChange={(e) => {
                const option = gradeOptions.find(
                  (g) => g.code === e.target.value,
                );
                if (option) {
                  form.setValue("code", option.code, { shouldValidate: true });
                  form.setValue("name", option.name, { shouldValidate: true });
                }
              }}
            >
              <option value="">— Selecciona un grado —</option>
              {gradeOptions.map((g) => (
                <option key={g.code} value={g.code}>
                  {g.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
    </>
  );
}

export default function GradosPage() {
  const levels = useCrudResource<Level>("levels").list;

  return (
    <CrudPage<Grade, CreateGradeInput>
      title="Grados"
      description="Cada grado pertenece a un nivel educativo"
      resource="grades"
      schema={CreateGradeSchema}
      defaultValues={{ code: "", name: "", levelId: "" }}
      toFormValues={(g) => ({ code: g.code, name: g.name, levelId: g.levelId })}
      itemLabel={(g) => g.name}
      columns={[
        { header: "Código", cell: (g) => g.code },
        { header: "Nombre", cell: (g) => g.name },
        { header: "Nivel", cell: (g) => g.level.name },
      ]}
      renderForm={(form) => (
        <GradoFormFields form={form} levels={levels.data ?? []} />
      )}
    />
  );
}
