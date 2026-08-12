"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { CreateShiftInput } from "@horarios/shared-types";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TimePicker } from "@/components/ui/TimePicker";

export function BlockEditor({
  form,
}: {
  form: UseFormReturn<CreateShiftInput>;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "blocks",
  });

  // RHF no modela con precisión el error "root" de un array validado con
  // z.array().min(1); en runtime sí trae `.message` aunque el tipo generado
  // sea un arreglo de FieldError por índice.
  const blocksMessage = (
    form.formState.errors.blocks as unknown as { message?: string } | undefined
  )?.message;

  const blockValues = form.watch("blocks");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Bloques horarios
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append({
              order: fields.length + 1,
              startTime: "08:00",
              endTime: "08:45",
              kind: "CLASE",
            })
          }
        >
          <Plus className="size-4" aria-hidden="true" />
          Agregar bloque
        </Button>
      </div>

      {blocksMessage && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {blocksMessage}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[3rem_1fr_1fr_8rem_2.5rem] items-center gap-2"
          >
            <Input
              type="number"
              min={1}
              aria-label={`Orden del bloque ${index + 1}`}
              {...form.register(`blocks.${index}.order`, {
                valueAsNumber: true,
              })}
            />
            <TimePicker
              aria-label={`Hora de inicio del bloque ${index + 1}`}
              value={blockValues[index]?.startTime ?? "08:00"}
              onChange={(v) =>
                form.setValue(`blocks.${index}.startTime`, v, {
                  shouldValidate: true,
                })
              }
            />
            <TimePicker
              aria-label={`Hora de fin del bloque ${index + 1}`}
              value={blockValues[index]?.endTime ?? "08:45"}
              onChange={(v) =>
                form.setValue(`blocks.${index}.endTime`, v, {
                  shouldValidate: true,
                })
              }
            />
            <Select
              aria-label={`Tipo del bloque ${index + 1}`}
              {...form.register(`blocks.${index}.kind`)}
            >
              <option value="CLASE">Clase</option>
              <option value="RECREO">Recreo</option>
              <option value="ALMUERZO">Almuerzo</option>
              <option value="ACTO_ENTRADA">Acto de entrada</option>
            </Select>
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Quitar bloque ${index + 1}`}
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
