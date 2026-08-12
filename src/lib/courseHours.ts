import type { Course, Shift } from "@/types/entities";

export const SCHOOL_DAYS_PER_WEEK = 5;

/**
 * "Hora" en este sistema = un periodo/bloque de clase, igual que en el
 * documento de carga académica del colegio ("Lengua Española: 6" son 6
 * periodos, sin importar que un bloque dure 45min y otro 30min). Por eso
 * esto cuenta BLOQUES, no minutos — así el número es el mismo en Turnos,
 * Cursos, Asignaciones y en la alerta CARGA_INSUFICIENTE_TURNO del motor.
 */
export function shiftWeeklyClassHours(shift: Shift): number {
  const classBlocksPerDay = shift.timeBlocks.filter(
    (b) => b.kind === "CLASE",
  ).length;
  return classBlocksPerDay * SCHOOL_DAYS_PER_WEEK;
}

export interface CourseHoursSummary {
  /** Horas (periodos/semana) ya asignadas en Asignaciones. */
  assigned: number;
  /** Periodos de clase del turno del curso × días lectivos: lo que hace falta para no tener huecos. */
  required: number;
  /** required - assigned, nunca negativo. */
  missing: number;
}

export function courseHoursSummary(course: Course): CourseHoursSummary {
  const required = shiftWeeklyClassHours(course.shift);
  const assigned = course.assignments.reduce(
    (sum, a) => sum + a.weeklyHours,
    0,
  );
  return { assigned, required, missing: Math.max(0, required - assigned) };
}
