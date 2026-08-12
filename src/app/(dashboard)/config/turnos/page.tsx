"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import {
  CreateShiftSchema,
  type CreateShiftInput,
} from "@horarios/shared-types";
import type { Shift, TimeBlock } from "@/types/entities";
import type { UseFormReturn } from "react-hook-form";
import { CrudPage } from "@/components/features/CrudPage";
import { BlockEditor } from "@/components/features/BlockEditor";
import { Badge } from "@/components/ui/Badge";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TimePicker } from "@/components/ui/TimePicker";
import { SCHOOL_DAYS_PER_WEEK, shiftWeeklyClassHours } from "@/lib/courseHours";

const KIND_LABEL: Record<TimeBlock["kind"], string> = {
  CLASE: "Clase",
  RECREO: "Recreo",
  ALMUERZO: "Almuerzo",
  ACTO_ENTRADA: "Acto de entrada",
};
const KIND_TONE: Record<
  TimeBlock["kind"],
  "blue" | "green" | "amber" | "gray"
> = {
  CLASE: "blue",
  RECREO: "green",
  ALMUERZO: "amber",
  ACTO_ENTRADA: "gray",
};

function blockMinutes(b: TimeBlock): number {
  const [sh = 0, sm = 0] = b.startTime.split(":").map(Number);
  const [eh = 0, em = 0] = b.endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function ShiftBlockDetail({ shift }: { shift: Shift }) {
  const blocks = [...shift.timeBlocks].sort((a, b) => a.order - b.order);
  const totalMinutes = blocks.reduce((sum, b) => sum + blockMinutes(b), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span>
          <strong className="text-gray-700">
            {shiftWeeklyClassHours(shift)}h
          </strong>{" "}
          de clase por semana ({SCHOOL_DAYS_PER_WEEK} días × bloques de clase
          del turno — mismo criterio que Cursos y Asignaciones)
        </span>
        <span>·</span>
        <span>
          {Math.round((totalMinutes / 60) * 10) / 10}h de jornada real por día
          (tiempo en reloj, no confundir con lo de arriba)
        </span>
      </div>

      {/* mini línea de tiempo proporcional a la duración de cada bloque */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        {blocks.map((b) => (
          <div
            key={b.id}
            title={`${KIND_LABEL[b.kind]} · ${b.startTime}–${b.endTime}`}
            style={{ width: `${(blockMinutes(b) / totalMinutes) * 100}%` }}
            className={
              b.kind === "CLASE"
                ? "bg-primary-400"
                : b.kind === "RECREO"
                  ? "bg-green-400"
                  : b.kind === "ALMUERZO"
                    ? "bg-amber-400"
                    : "bg-gray-400"
            }
          />
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
        {blocks.map((b) => (
          <li
            key={b.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="text-gray-600">
              {b.startTime}–{b.endTime}
            </span>
            <Badge tone={KIND_TONE[b.kind]}>{KIND_LABEL[b.kind]}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PREDEFINED_SHIFTS = [
  "Matutino",
  "Vespertino",
  "Nocturno",
  "Extendido",
] as const;

function TurnoFormFields({ form }: { form: UseFormReturn<CreateShiftInput> }) {
  const existingName = form.getValues("name");
  const isExistingCustom =
    existingName !== "" &&
    !(PREDEFINED_SHIFTS as readonly string[]).includes(existingName);

  const [isCustom, setIsCustom] = useState(isExistingCustom);
  const nameValue = form.watch("name");

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Field
          label="Nombre"
          required
          description="Tipo de jornada del turno"
          error={form.formState.errors.name?.message}
        >
          {({ inputId }) => (
            <Select
              id={inputId}
              value={isCustom ? "__otro__" : nameValue}
              onChange={(e) => {
                if (e.target.value === "__otro__") {
                  setIsCustom(true);
                  form.setValue("name", "", { shouldValidate: false });
                } else {
                  setIsCustom(false);
                  form.setValue("name", e.target.value, {
                    shouldValidate: true,
                  });
                }
              }}
            >
              <option value="">— Selecciona —</option>
              {PREDEFINED_SHIFTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="__otro__">Otro…</option>
            </Select>
          )}
        </Field>

        <Field
          label="Hora inicio"
          required
          error={form.formState.errors.startTime?.message}
        >
          {({ inputId }) => (
            <Controller
              name="startTime"
              control={form.control}
              render={({ field }) => (
                <TimePicker
                  id={inputId}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!form.formState.errors.startTime}
                />
              )}
            />
          )}
        </Field>

        <Field
          label="Hora fin"
          required
          error={form.formState.errors.endTime?.message}
        >
          {({ inputId }) => (
            <Controller
              name="endTime"
              control={form.control}
              render={({ field }) => (
                <TimePicker
                  id={inputId}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!form.formState.errors.endTime}
                />
              )}
            />
          )}
        </Field>
      </div>

      {isCustom && (
        <Field
          label="Nombre personalizado"
          required
          error={form.formState.errors.name?.message}
          hint="Ej: Sabatino, Especial…"
        >
          {({ inputId }) => (
            <Input
              id={inputId}
              autoFocus
              placeholder="Nombre del turno"
              {...form.register("name")}
            />
          )}
        </Field>
      )}

      <BlockEditor form={form} />

      <p className="text-xs text-amber-600">
        ⚠️ Editar los bloques de un turno con horario ya generado puede fallar
        si hay clases asignadas a esos bloques.
      </p>
    </>
  );
}

export default function TurnosPage() {
  return (
    <CrudPage<Shift, CreateShiftInput>
      title="Turnos"
      description="Cada turno define sus bloques horarios (clase, recreo, almuerzo, acto de entrada)"
      resource="shifts"
      modalSize="lg"
      schema={CreateShiftSchema}
      defaultValues={{
        name: "",
        startTime: "07:30",
        endTime: "12:30",
        blocks: [
          { order: 1, startTime: "07:30", endTime: "08:15", kind: "CLASE" },
        ],
      }}
      toFormValues={(s) => ({
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        blocks: s.timeBlocks.map((b) => ({
          order: b.order,
          startTime: b.startTime,
          endTime: b.endTime,
          kind: b.kind,
        })),
      })}
      itemLabel={(s) => s.name}
      columns={[
        { header: "Nombre", cell: (s) => s.name },
        { header: "Horario", cell: (s) => `${s.startTime}–${s.endTime}` },
        {
          header: "Horas de clase / semana",
          cell: (s) => (
            <span className="font-medium text-gray-900">
              {shiftWeeklyClassHours(s)}h
            </span>
          ),
        },
        {
          header: "Bloques",
          cell: (s) =>
            `${s.timeBlocks.filter((b) => b.kind === "CLASE").length} de clase / ${s.timeBlocks.length} total`,
        },
      ]}
      renderForm={(form) => <TurnoFormFields form={form} />}
      renderExpanded={(s) => <ShiftBlockDetail shift={s} />}
    />
  );
}
