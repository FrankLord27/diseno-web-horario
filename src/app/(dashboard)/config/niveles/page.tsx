"use client";

import {
  CreateLevelSchema,
  type CreateLevelInput,
} from "@horarios/shared-types";
import type { Level } from "@/types/entities";
import { CrudPage } from "@/components/features/CrudPage";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";

const RD_LEVELS = [
  { code: "INI", name: "Inicial", order: 1 },
  { code: "PRI", name: "Primaria", order: 2 },
  { code: "SEC", name: "Secundaria", order: 3 },
] as const;

export default function NivelesPage() {
  return (
    <CrudPage<Level, CreateLevelInput>
      title="Niveles educativos"
      description="Niveles del sistema educativo dominicano (Inicial, Primaria, Secundaria)"
      resource="levels"
      schema={CreateLevelSchema}
      defaultValues={{ code: "", name: "", order: 1 }}
      toFormValues={(l) => ({ code: l.code, name: l.name, order: l.order })}
      itemLabel={(l) => l.name}
      columns={[
        { header: "Código", cell: (l) => l.code },
        { header: "Nombre", cell: (l) => l.name },
        { header: "Orden", cell: (l) => l.order },
      ]}
      renderForm={(form) => {
        const currentCode = form.watch("code");
        const selected = RD_LEVELS.find((l) => l.code === currentCode);
        return (
          <>
            <Field
              label="Nivel"
              required
              description="Etapa del sistema educativo dominicano según el MINERD"
              error={
                form.formState.errors.code?.message ??
                form.formState.errors.name?.message
              }
              hint="El código y el orden se asignan automáticamente"
            >
              {({ inputId }) => (
                <Select
                  id={inputId}
                  value={currentCode}
                  onChange={(e) => {
                    const level = RD_LEVELS.find(
                      (l) => l.code === e.target.value,
                    );
                    if (level) {
                      form.setValue("code", level.code, {
                        shouldValidate: true,
                      });
                      form.setValue("name", level.name, {
                        shouldValidate: true,
                      });
                      form.setValue("order", level.order, {
                        shouldValidate: true,
                      });
                    }
                  }}
                >
                  <option value="">— Selecciona un nivel —</option>
                  {RD_LEVELS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {selected && (
              <p className="text-xs text-gray-500">
                Código: <strong>{selected.code}</strong> · Orden:{" "}
                <strong>{selected.order}</strong>
              </p>
            )}
          </>
        );
      }}
    />
  );
}
