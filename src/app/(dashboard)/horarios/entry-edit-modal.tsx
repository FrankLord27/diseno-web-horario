"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  DoorOpen,
  Lock,
  LockOpen,
  MoveRight,
  UserSquare2,
} from "lucide-react";
import type { DayOfWeek, ScheduleCellDto } from "@horarios/shared-types";
import { DAYS_OF_WEEK } from "@horarios/shared-types";
import type { Course, Room, Shift, Teacher } from "@/types/entities";
import {
  useChangeRoom,
  useChangeTeacher,
  useMoveEntry,
  useSetLock,
  useSwapEntries,
} from "@/hooks/useSchedule";
import { ApiClientError } from "@/lib/api-client";
import { DAY_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";

interface EntryEditModalProps {
  cell: ScheduleCellDto;
  onClose: () => void;
  teachers: Teacher[];
  rooms: Room[];
  shifts: Shift[];
  courses: Course[];
  /** otras clases del mismo curso, para intercambiar */
  courseCells: ScheduleCellDto[];
}

type Action = "move" | "teacher" | "room" | "swap";

export function EntryEditModal({
  cell,
  onClose,
  teachers,
  rooms,
  shifts,
  courses,
  courseCells,
}: EntryEditModalProps) {
  const [action, setAction] = useState<Action>("move");
  const [day, setDay] = useState<DayOfWeek>(cell.day);
  const [timeBlockId, setTimeBlockId] = useState(cell.timeBlockId);
  const [teacherId, setTeacherId] = useState(cell.teacherId);
  const [roomId, setRoomId] = useState(cell.roomId);
  const [swapWith, setSwapWith] = useState("");
  const [violations, setViolations] = useState<
    { type: string; message: string }[]
  >([]);

  // Sincroniza el estado local cuando se abre el modal con una celda diferente.
  useEffect(() => {
    setAction("move");
    setDay(cell.day);
    setTimeBlockId(cell.timeBlockId);
    setTeacherId(cell.teacherId);
    setRoomId(cell.roomId);
    setSwapWith("");
    setViolations([]);
  }, [cell.entryId]);

  const move = useMoveEntry();
  const changeTeacher = useChangeTeacher();
  const changeRoom = useChangeRoom();
  const setLock = useSetLock();
  const swap = useSwapEntries();

  const course = courses.find((c) => c.id === cell.courseId);
  const shift = shifts.find((s) => s.id === course?.shiftId);
  const classBlocks = (shift?.timeBlocks ?? []).filter(
    (b) => b.kind === "CLASE",
  );

  const pending =
    move.isPending ||
    changeTeacher.isPending ||
    changeRoom.isPending ||
    swap.isPending;

  async function run(fn: () => Promise<unknown>) {
    setViolations([]);
    try {
      await fn();
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError && err.violations?.length) {
        setViolations(err.violations);
      } else {
        setViolations([
          {
            type: "ERROR",
            message: err instanceof Error ? err.message : "Error desconocido",
          },
        ]);
      }
    }
  }

  function apply() {
    switch (action) {
      case "move":
        return run(() =>
          move.mutateAsync({ id: cell.entryId, data: { day, timeBlockId } }),
        );
      case "teacher":
        return run(() =>
          changeTeacher.mutateAsync({ id: cell.entryId, teacherId }),
        );
      case "room":
        return run(() => changeRoom.mutateAsync({ id: cell.entryId, roomId }));
      case "swap":
        return run(() =>
          swap.mutateAsync({ entryAId: cell.entryId, entryBId: swapWith }),
        );
    }
  }

  const ACTIONS: { value: Action; label: string; icon: typeof MoveRight }[] = [
    { value: "move", label: "Mover", icon: MoveRight },
    { value: "teacher", label: "Docente", icon: UserSquare2 },
    { value: "room", label: "Aula", icon: DoorOpen },
    { value: "swap", label: "Intercambiar", icon: ArrowLeftRight },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={`${cell.subjectName} — ${cell.courseName}`}
      size="md"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-500">
          {DAY_LABELS[cell.day]} {cell.startTime}–{cell.endTime} ·{" "}
          {cell.teacherName} · {cell.roomName}
        </p>

        <div
          className="flex flex-wrap gap-1.5"
          role="tablist"
          aria-label="Acción de edición"
        >
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.value}
                type="button"
                role="tab"
                aria-selected={action === a.value}
                onClick={() => {
                  setAction(a.value);
                  setViolations([]);
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
                  action === a.value
                    ? "border-primary-500 bg-primary-50 font-medium text-primary-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {a.label}
              </button>
            );
          })}
        </div>

        {action === "move" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Día">
              {({ inputId }) => (
                <Select
                  id={inputId}
                  value={day}
                  onChange={(e) => setDay(e.target.value as DayOfWeek)}
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {DAY_LABELS[d]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Bloque">
              {({ inputId }) => (
                <Select
                  id={inputId}
                  value={timeBlockId}
                  onChange={(e) => setTimeBlockId(e.target.value)}
                >
                  {classBlocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.startTime}–{b.endTime}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        )}

        {action === "teacher" && (
          <Field
            label="Nuevo docente"
            hint="Solo docentes habilitados para la materia serán aceptados"
          >
            {({ inputId }) => (
              <Select
                id={inputId}
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        {action === "room" && (
          <Field label="Nueva aula">
            {({ inputId }) => (
              <Select
                id={inputId}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (cap. {r.capacity})
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        {action === "swap" && (
          <Field label="Intercambiar con">
            {({ inputId }) => (
              <Select
                id={inputId}
                value={swapWith}
                onChange={(e) => setSwapWith(e.target.value)}
              >
                <option value="">— Selecciona otra clase del curso —</option>
                {courseCells.map((c) => (
                  <option key={c.entryId} value={c.entryId}>
                    {DAY_LABELS[c.day]} {c.startTime} · {c.subjectName} (
                    {c.teacherName})
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        {violations.length > 0 && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            <p className="font-medium">El cambio viola restricciones duras:</p>
            <ul className="mt-1 list-inside list-disc text-xs">
              {violations.map((v) => (
                <li key={`${v.type}-${v.message}`}>{v.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
          <Button
            variant="ghost"
            type="button"
            loading={setLock.isPending}
            onClick={() =>
              void run(() =>
                setLock.mutateAsync({ id: cell.entryId, locked: !cell.locked }),
              )
            }
          >
            {cell.locked ? (
              <>
                <LockOpen className="size-4" aria-hidden="true" /> Desbloquear
              </>
            ) : (
              <>
                <Lock className="size-4" aria-hidden="true" /> Bloquear
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              loading={pending}
              disabled={action === "swap" && !swapWith}
              onClick={() => void apply()}
            >
              Aplicar cambio
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
