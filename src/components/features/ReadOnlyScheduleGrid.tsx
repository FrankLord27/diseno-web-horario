"use client";

import { useMemo } from "react";
import { DAYS_OF_WEEK, type ScheduleCellDto } from "@horarios/shared-types";
import { DAY_LABELS } from "@/lib/labels";

/** Rejilla día × bloque de solo lectura. Muestra las clases de un horario. */
export function ReadOnlyScheduleGrid({
  cells,
  emptyLabel = "No hay clases en este horario todavía.",
}: {
  cells: ScheduleCellDto[];
  emptyLabel?: string;
}) {
  // Filas ordenadas por bloque, únicas por horario (blockOrder + rango).
  const rows = useMemo(() => {
    const byOrder = new Map<
      number,
      { order: number; startTime: string; endTime: string }
    >();
    for (const c of cells) {
      if (!byOrder.has(c.blockOrder)) {
        byOrder.set(c.blockOrder, {
          order: c.blockOrder,
          startTime: c.startTime,
          endTime: c.endTime,
        });
      }
    }
    return [...byOrder.values()].sort((a, b) => a.order - b.order);
  }, [cells]);

  const cellAt = (order: number, day: string) =>
    cells.find((c) => c.blockOrder === order && c.day === day);

  if (cells.length === 0) {
    return (
      <p className="rounded-card border border-gray-200 bg-white p-6 text-sm text-gray-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th
              scope="col"
              className="border-b border-gray-200 px-3 py-2 text-left"
            >
              Hora
            </th>
            {DAYS_OF_WEEK.map((day) => (
              <th
                key={day}
                scope="col"
                className="border-b border-gray-200 px-3 py-2 text-center"
              >
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.order}>
              <th
                scope="row"
                className="whitespace-nowrap border-b border-gray-100 px-3 py-2 text-left font-normal text-gray-500"
              >
                {row.startTime}–{row.endTime}
              </th>
              {DAYS_OF_WEEK.map((day) => {
                const cell = cellAt(row.order, day);
                return (
                  <td
                    key={day}
                    className="border-b border-l border-gray-100 p-1 align-top"
                  >
                    {cell ? (
                      <div
                        className="rounded-md px-2 py-1.5 text-xs"
                        style={{
                          backgroundColor: `${cell.subjectColor}1a`,
                          borderLeft: `3px solid ${cell.subjectColor}`,
                        }}
                      >
                        <p className="font-semibold text-gray-800">
                          {cell.subjectName}
                        </p>
                        <p className="text-gray-500">{cell.teacherName}</p>
                        <p className="text-gray-400">{cell.roomName}</p>
                      </div>
                    ) : (
                      <span className="block h-full min-h-8" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
