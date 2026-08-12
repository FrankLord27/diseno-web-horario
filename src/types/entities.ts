import type {
  AssignmentStatus,
  AvailabilityType,
  BlockKind,
  ContractType,
  DayOfWeek,
  RoomKind,
  SubjectKind,
  TeacherStatus,
  TicketStatus,
} from "@horarios/shared-types";

export interface Ticket {
  id: string;
  teacherId: string;
  teacher: Teacher;
  title: string;
  message: string;
  status: TicketStatus;
  adminReply: string | null;
  createdAt: string;
}

export interface Level {
  id: string;
  code: string;
  name: string;
  order: number;
}

export interface Grade {
  id: string;
  code: string;
  name: string;
  levelId: string;
  level: Level;
}

export interface TimeBlock {
  id: string;
  order: number;
  startTime: string;
  endTime: string;
  kind: BlockKind;
  shiftId: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  timeBlocks: TimeBlock[];
}

export interface Room {
  id: string;
  code: string;
  name: string;
  kind: RoomKind;
  capacity: number;
  resources: string | null;
  requiresReservation: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  gradeId: string;
  shiftId: string;
  capacity: number;
  homeRoomId: string | null;
  grade: Grade;
  shift: Shift;
  homeRoom: Room | null;
  /** Solo presente en GET /courses (lista): asignaciones activas del curso, para calcular horas asignadas vs. necesarias. */
  assignments: {
    id: string;
    subjectId: string;
    weeklyHours: number;
    subject: { name: string };
  }[];
}

export interface SubjectGradeLoad {
  id: string;
  gradeId: string;
  weeklyHours: number;
  grade: Grade;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  color: string;
  kind: SubjectKind;
  requiresSpecialRoom: boolean;
  requiredRoomKind: RoomKind | null;
  allowsDoubleBlocks: boolean;
  maxBlocksPerDay: number;
  gradeLoads: SubjectGradeLoad[];
}

export interface TeacherSubject {
  id: string;
  subjectId: string;
  subject: Subject;
}

export interface TeacherAvailability {
  id: string;
  day: DayOfWeek;
  timeBlockId: string;
  type: AvailabilityType;
  note: string | null;
  timeBlock: TimeBlock;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  cedula: string;
  phone: string | null;
  email: string | null;
  status: TeacherStatus;
  specialty: string | null;
  degrees: string | null;
  maxWeeklyHours: number;
  maxDailyBlocks: number;
  maxConsecutiveBlocks: number;
  contractType: ContractType;
  tutorCourseId: string | null;
  tutorCourse: { id: string; name: string } | null;
  teacherSubjects: TeacherSubject[];
  availabilities: TeacherAvailability[];
}

export interface Assignment {
  id: string;
  teacherId: string;
  subjectId: string;
  courseId: string;
  weeklyHours: number;
  preferredRoomId: string | null;
  status: AssignmentStatus;
  teacher: Teacher;
  subject: Subject;
  course: Course;
  preferredRoom: Room | null;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: unknown;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export interface SoftRule {
  key: string;
  weight: number;
  enabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MAESTRO" | "ESTUDIANTE";
  teacherId: string | null;
  createdAt: string;
}
