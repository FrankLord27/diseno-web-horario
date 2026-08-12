"use client";

import {
  CreateRoomSchema,
  RoomKindSchema,
  type CreateRoomInput,
} from "@horarios/shared-types";
import type { Room } from "@/types/entities";
import { CrudPage } from "@/components/features/CrudPage";
import { ImportExcel } from "@/components/features/ImportExcel";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { ROOM_KIND_LABELS } from "@/lib/labels";

export default function AulasPage() {
  return (
    <div className="flex flex-col gap-4">
      <ImportExcel
        entity="rooms"
        title="Importar aulas desde Excel"
        description="Sube tu lista de aulas en cualquier formato: conectas tus columnas una vez."
        invalidateKey="rooms"
      />
      <CrudPage<Room, CreateRoomInput>
        title="Aulas"
        description="Aulas regulares y especiales (laboratorios, cancha, etc.)"
        resource="rooms"
        schema={CreateRoomSchema}
        defaultValues={{
          code: "",
          name: "",
          kind: "REGULAR",
          capacity: 30,
          resources: "",
          requiresReservation: false,
        }}
        toFormValues={(r) => ({
          code: r.code,
          name: r.name,
          kind: r.kind,
          capacity: r.capacity,
          resources: r.resources ?? "",
          requiresReservation: r.requiresReservation,
        })}
        itemLabel={(r) => r.name}
        columns={[
          { header: "Código", cell: (r) => r.code },
          { header: "Nombre", cell: (r) => r.name },
          {
            header: "Tipo",
            cell: (r) => (
              <Badge tone={r.kind === "REGULAR" ? "gray" : "blue"}>
                {ROOM_KIND_LABELS[r.kind]}
              </Badge>
            ),
          },
          { header: "Capacidad", cell: (r) => r.capacity },
          {
            header: "Reserva",
            cell: (r) => (r.requiresReservation ? "Sí" : "No"),
          },
        ]}
        renderForm={(form) => (
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
                    placeholder="LAB-INF"
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
                    placeholder="Lab. Informática"
                    {...form.register("name")}
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
                    {RoomKindSchema.options.map((k) => (
                      <option key={k} value={k}>
                        {ROOM_KIND_LABELS[k]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field
                label="Capacidad"
                required
                error={form.formState.errors.capacity?.message}
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
            </div>
            <Field
              label="Recursos disponibles"
              error={form.formState.errors.resources?.message}
            >
              {({ inputId }) => (
                <Textarea
                  id={inputId}
                  rows={2}
                  placeholder="Proyector, PCs, instrumentos…"
                  {...form.register("resources")}
                />
              )}
            </Field>
            <Checkbox
              label="Requiere reserva"
              {...form.register("requiresReservation")}
            />
          </>
        )}
      />
    </div>
  );
}
