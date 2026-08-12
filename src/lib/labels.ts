import type {
  AssignmentStatus,
  AvailabilityType,
  BlockKind,
  ContractType,
  DayOfWeek,
  RoomKind,
  SubjectKind,
  TeacherStatus,
} from "@horarios/shared-types";

export const DAY_LABELS: Record<DayOfWeek, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
};

export const BLOCK_KIND_LABELS: Record<BlockKind, string> = {
  CLASE: "Clase",
  RECREO: "Recreo",
  ALMUERZO: "Almuerzo",
  ACTO_ENTRADA: "Acto de entrada",
};

export const SUBJECT_KIND_LABELS: Record<SubjectKind, string> = {
  TEORICA: "Teórica",
  LABORATORIO: "Laboratorio",
  DEPORTIVA: "Deportiva",
  ARTISTICA: "Artística",
  IDIOMA: "Idioma",
  RELIGIOSA: "Religiosa",
  OTRO: "Otro",
};

export const ROOM_KIND_LABELS: Record<RoomKind, string> = {
  REGULAR: "Regular",
  LAB_CIENCIAS: "Laboratorio de Ciencias",
  INFORMATICA: "Informática",
  MUSICA: "Música",
  ARTE: "Arte",
  BIBLIOTECA: "Biblioteca",
  CANCHA: "Cancha",
  AUDIOVISUAL: "Salón Audiovisual",
  OTRO: "Otro",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  FIJO: "Fijo",
  TEMPORAL: "Temporal",
  SUSTITUTO: "Sustituto",
};

export const TEACHER_STATUS_LABELS: Record<TeacherStatus, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  ACTIVA: "Activa",
  PENDIENTE: "Pendiente",
  CANCELADA: "Cancelada",
};

export const AVAILABILITY_TYPE_LABELS: Record<AvailabilityType, string> = {
  PREFERIDO: "Preferido",
  BLOQUEADO: "Bloqueado",
};

export const SOFT_RULE_LABELS: Record<string, string> = {
  EVITAR_MAS_DE_2_CONSECUTIVOS:
    "Evitar la misma materia más de 2 bloques consecutivos",
  DISTRIBUIR_EN_SEMANA: "Distribuir materias pesadas a lo largo de la semana",
  PESADAS_EN_BLOQUES_INTERMEDIOS:
    "Asignar materias pesadas en bloques intermedios",
  RESPETAR_PREFERIDOS_DOCENTE: "Respetar bloques preferidos del docente",
  BALANCEAR_CARGA_DIARIA: "Balancear la carga diaria de cada curso",
  EVITAR_HUECOS_DOCENTE: "Evitar huecos libres en el horario del docente",
};

export const CONFLICT_TYPE_LABELS: Record<string, string> = {
  DOCENTE_DUPLICADO: "Docente duplicado",
  CURSO_DUPLICADO: "Curso duplicado",
  AULA_DUPLICADA: "Aula duplicada",
  SOBRECARGA_DOCENTE: "Sobrecarga docente",
  CARGA_INCOMPLETA: "Carga semanal incompleta",
  AULA_INCORRECTA: "Materia en aula incorrecta",
  DOCENTE_NO_DISPONIBLE: "Docente no disponible",
  BLOQUE_INVALIDO: "Bloque inválido",
  MAX_BLOQUES_DIA: "Máximo de bloques por día excedido",
  BLANDA_INCUMPLIDA: "Restricción blanda incumplida",
};

export const GENERATION_MODE_LABELS: Record<string, string> = {
  COMPLETA: "Completa — genera todo desde cero",
  INCREMENTAL: "Incremental — solo asignaciones pendientes",
  CON_BLOQUEO: "Con bloqueo — respeta los bloques fijados manualmente",
};
