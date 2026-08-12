"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { CreateSubjectInput } from "@horarios/shared-types";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Grade } from "@/types/entities";

export function GradeLoadsEditor({
  form,
  grades,
}: {
  form: UseFormReturn<CreateSubjectInput>;
  grades: Grade[];
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "gradeLoads",
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Horas semanales por grado
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={grades.length === 0}
          onClick={() =>
            append({ gradeId: grades[0]?.id ?? "", weeklyHours: 1 })
          }
        >
          <Plus className="size-4" aria-hidden="true" />
          Agregar grado
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-gray-500">
          Sin cargas configuradas — esta materia no se generará para ningún
          grado.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_6rem_2.5rem] items-center gap-2"
          >
            <Select
              aria-label={`Grado ${index + 1}`}
              {...form.register(`gradeLoads.${index}.gradeId`)}
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.level.name}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              min={1}
              max={20}
              aria-label={`Horas semanales del grado ${index + 1}`}
              {...form.register(`gradeLoads.${index}.weeklyHours`, {
                valueAsNumber: true,
              })}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Quitar carga ${index + 1}`}
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
