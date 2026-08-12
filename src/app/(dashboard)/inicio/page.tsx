import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

/**
 * Guía de inicio: ordena las secciones de configuración según sus dependencias
 * para que se entienda "por dónde empezar" hasta generar el horario.
 */
const STEPS = [
  {
    step: 1,
    href: "/config/niveles",
    label: "Niveles",
    help: "Define los niveles educativos: Inicial, Primaria, Secundaria.",
  },
  {
    step: 2,
    href: "/config/grados",
    label: "Grados",
    help: "Crea los grados que pertenecen a cada nivel.",
  },
  {
    step: 3,
    href: "/config/turnos",
    label: "Turnos",
    help: "Configura los bloques horarios: clase, recreo, almuerzo y acto de entrada.",
  },
  {
    step: 4,
    href: "/config/cursos",
    label: "Cursos",
    help: "Registra las secciones de cada grado: 1.° A, 1.° B…",
  },
  {
    step: 5,
    href: "/config/materias",
    label: "Materias",
    help: "Agrega las asignaturas con su carga semanal y requisitos de aula.",
  },
  {
    step: 6,
    href: "/config/aulas",
    label: "Aulas",
    help: "Define aulas regulares y especiales (laboratorios, cancha…).",
  },
  {
    step: 7,
    href: "/config/docentes",
    label: "Docentes",
    help: "Registra docentes, materias que imparten y su disponibilidad.",
  },
  {
    step: 8,
    href: "/config/asignaciones",
    label: "Asignaciones",
    help: "Vincula docente + materia + curso con sus horas semanales.",
  },
  {
    step: 9,
    href: "/config/reglas",
    label: "Reglas",
    help: "Ajusta las preferencias del generador (opcional).",
  },
] as const;

export default function InicioPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Guía de inicio</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura el colegio en este orden. Cada paso depende del anterior; al
          terminar, genera el horario.
        </p>
      </header>

      <ol className="flex flex-col gap-2">
        {STEPS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group flex items-center gap-3 rounded-card border border-gray-200 bg-white p-3 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary-700"
              >
                {s.step}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-gray-900">
                  {s.label}
                </span>
                <span className="block text-xs text-gray-500">{s.help}</span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-gray-300 transition-colors group-hover:text-primary-600"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href="/horarios"
        className="flex items-center gap-3 rounded-card border border-primary-600 bg-primary-600 p-4 text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <PlayCircle className="size-6 shrink-0" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-sm font-semibold">Generar horario</span>
          <span className="block text-xs text-primary-100">
            Ejecuta el generador y revisa o edita el resultado.
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
      </Link>
    </div>
  );
}
