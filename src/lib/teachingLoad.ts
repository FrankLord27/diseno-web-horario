import type { Assignment, Course, Subject, Teacher } from "@/types/entities";

/**
 * Cálculos de carga horaria a partir de las Asignaciones.
 * Solo cuentan las ACTIVAS: una pendiente o cancelada no ocupa horario.
 */
export function activeAssignments(assignments: Assignment[]): Assignment[] {
  return assignments.filter((a) => a.status === "ACTIVA");
}

export interface TeacherLoadItem {
  id: string;
  subjectName: string;
  subjectColor: string;
  courseName: string;
  weeklyHours: number;
}

export interface TeacherLoad {
  /** Horas/semana ya asignadas al docente. */
  assigned: number;
  /** Máximo que permite su contrato. */
  max: number;
  /** > 0 si supera su carga máxima. */
  over: number;
  items: TeacherLoadItem[];
}

export function teacherLoad(
  teacher: Teacher,
  assignments: Assignment[],
): TeacherLoad {
  const items = activeAssignments(assignments)
    .filter((a) => a.teacherId === teacher.id)
    .map((a) => ({
      id: a.id,
      subjectName: a.subject.name,
      subjectColor: a.subject.color,
      courseName: a.course.name,
      weeklyHours: a.weeklyHours,
    }));
  const assigned = items.reduce((sum, i) => sum + i.weeklyHours, 0);
  return {
    assigned,
    max: teacher.maxWeeklyHours,
    over: Math.max(0, assigned - teacher.maxWeeklyHours),
    items,
  };
}

export interface SubjectGradeCoverage {
  gradeId: string;
  gradeName: string;
  /** Horas/semana que la malla exige por cada sección del grado. */
  requiredPerSection: number;
  /** Secciones del grado con las horas de esta materia ya asignadas. */
  sections: { courseId: string; courseName: string; assigned: number }[];
}

export interface SubjectLoad {
  /** Horas/semana asignadas en todo el colegio para esta materia. */
  totalAssigned: number;
  /** Lo que la malla exige: horas por grado × secciones existentes. */
  totalRequired: number;
  /** Nombres de docentes con asignaciones activas de la materia. */
  teachers: string[];
  byGrade: SubjectGradeCoverage[];
}

export function subjectLoad(
  subject: Subject,
  assignments: Assignment[],
  courses: Course[],
): SubjectLoad {
  const active = activeAssignments(assignments).filter(
    (a) => a.subjectId === subject.id,
  );
  const totalAssigned = active.reduce((sum, a) => sum + a.weeklyHours, 0);
  const teachers = [
    ...new Set(
      active.map((a) => `${a.teacher.firstName} ${a.teacher.lastName}`),
    ),
  ];

  const byGrade: SubjectGradeCoverage[] = subject.gradeLoads.map((load) => ({
    gradeId: load.gradeId,
    gradeName: load.grade.name,
    requiredPerSection: load.weeklyHours,
    sections: courses
      .filter((c) => c.gradeId === load.gradeId)
      .map((c) => ({
        courseId: c.id,
        courseName: c.name,
        assigned: active
          .filter((a) => a.courseId === c.id)
          .reduce((sum, a) => sum + a.weeklyHours, 0),
      })),
  }));

  const totalRequired = byGrade.reduce(
    (sum, g) => sum + g.requiredPerSection * g.sections.length,
    0,
  );

  return { totalAssigned, totalRequired, teachers, byGrade };
}
