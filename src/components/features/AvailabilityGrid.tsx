"use client";

import { useState } from "react";
import {
  DAYS_OF_WEEK,
  type TeacherAvailabilityItem,
} from "@horarios/shared-types";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/labels";
import type { Shift } from "@/types/entities";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const CYCLE: (TeacherAvailabilityItem["type"] | null)[] = [
  null,
  "PREFERIDO",
  "BLOQUEADO",
];

const STATE_CLASSES: Record<string, string> = {
  disponible: "bg-white text-gray-500 border-gray-200",
  PREFERIDO: "bg-green-100 text-green-800 border-green-300",
  BLOQUEADO: "bg-red-100 text-red-800 border-red-300",
};

const STATE_LABELS: Record<string, string> = {
  disponible: "Disponible",
  PREFERIDO: "Preferido",
  BLOQUEADO: "Bloqueado",
};

export function AvailabilityGrid({
  shifts,
  value,
  onChange,
}: {
  shifts: Shift[];
  value: TeacherAvailabilityItem[];
  onChange: (value: TeacherAvailabilityItem[]) => void;
}) {
  const [fromTime, setFromTime] = useState("");

  const classBlocksAll = shifts.flatMap((s) =>
    s.timeBlocks.filter((b) => b.kind === "CLASE"),
  );
  const startTimes = [
    ...new Set(classBlocksAll.map((b) => b.startTime)),
  ].sort();

  // Bloquea todas las franjas de clase desde `time` en adelante, en todos los días.
  function blockFrom(time: string) {
    if (!time) return;
    const targetIds = new Set(
      classBlocksAll.filter((b) => b.startTime >= time).map((b) => b.id),
    );
    const kept = value.filter((a) => !targetIds.has(a.timeBlockId));
    const added: TeacherAvailabilityItem[] = [];
    for (const id of targetIds) {
      for (const day of DAYS_OF_WEEK) {
        added.push({ day, timeBlockId: id, type: "BLOQUEADO" });
      }
    }
    onChange([...kept, ...added]);
  }

  function clearBlocked() {
    onChange(value.filter((a) => a.type !== "BLOQUEADO"));
  }

  function stateFor(timeBlockId: string, day: TeacherAvailabilityItem["day"]) {
    return (
      value.find((a) => a.timeBlockId === timeBlockId && a.day === day)?.type ??
      null
    );
  }

  function cycle(timeBlockId: string, day: TeacherAvailabilityItem["day"]) {
    const current = stateFor(timeBlockId, day);
    const currentIndex = CYCLE.indexOf(current);
    const next = CYCLE[(currentIndex + 1) % CYCLE.length];
    const withoutEntry = value.filter(
      (a) => !(a.timeBlockId === timeBlockId && a.day === day),
    );
    if (next == null) {
      onChange(withoutEntry);
    } else {
      onChange([...withoutEntry, { day, timeBlockId, type: next }]);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-gray-700">
        Disponibilidad semanal
      </p>
      <p className="text-xs text-gray-500">
        Clic en cada celda para alternar: Disponible → Preferido → Bloqueado.
      </p>

      {startTimes.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm">
          <span className="text-gray-600">Bloqueo rápido:</span>
          <Select
            className="w-28"
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            aria-label="Bloquear desde la hora"
          >
            <option value="">Desde…</option>
            {startTimes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!fromTime}
            onClick={() => blockFrom(fromTime)}
          >
            Bloquear en adelante (todos los días)
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearBlocked}
          >
            Quitar bloqueos
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {shifts.map((shift) => {
          const classBlocks = shift.timeBlocks.filter(
            (b) => b.kind === "CLASE",
          );
          if (classBlocks.length === 0) return null;
          return (
            <div
              key={shift.id}
              className="overflow-x-auto rounded-lg border border-gray-200"
            >
              <table className="w-full border-collapse text-xs">
                <caption className="bg-gray-50 px-2 py-1.5 text-left text-sm font-medium text-gray-700">
                  {shift.name}
                </caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="border-b border-gray-200 px-2 py-1.5 text-left"
                    >
                      Bloque
                    </th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th
                        key={day}
                        scope="col"
                        className="border-b border-gray-200 px-2 py-1.5 text-center"
                      >
                        {DAY_LABELS[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classBlocks.map((block) => (
                    <tr key={block.id}>
                      <th
                        scope="row"
                        className="whitespace-nowrap px-2 py-1.5 text-left font-normal text-gray-600"
                      >
                        {block.startTime}–{block.endTime}
                      </th>
                      {DAYS_OF_WEEK.map((day) => {
                        const state = stateFor(block.id, day) ?? "disponible";
                        return (
                          <td key={day} className="px-1 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => cycle(block.id, day)}
                              className={cn(
                                "w-full rounded border px-1.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600",
                                STATE_CLASSES[state],
                              )}
                              aria-label={`${DAY_LABELS[day]} ${block.startTime}: ${STATE_LABELS[state]}`}
                            >
                              {STATE_LABELS[state]}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        {shifts.every(
          (s) => s.timeBlocks.filter((b) => b.kind === "CLASE").length === 0,
        ) && (
          <p className="text-xs text-gray-500">
            Configura turnos con bloques de clase para definir disponibilidad.
          </p>
        )}
      </div>
    </div>
  );
}
