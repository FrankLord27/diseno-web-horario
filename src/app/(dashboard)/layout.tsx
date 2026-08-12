"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock,
  DatabaseBackup,
  DoorOpen,
  Download,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ScrollText,
  Shield,
  SlidersHorizontal,
  UserSquare2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout, useCurrentUser } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";

const NAV = [
  { href: "/inicio", label: "Inicio", icon: LayoutDashboard },
  { href: "/horarios", label: "Horarios", icon: CalendarDays },
  { href: "/exportar", label: "Exportar", icon: Download },
] as const;

const MAESTRO_NAV = [
  { href: "/mi-horario", label: "Mi horario", icon: CalendarDays },
  { href: "/mis-solicitudes", label: "Mis Solicitudes", icon: MessageSquare },
] as const;

const ESTUDIANTE_NAV = [
  { href: "/horarios-curso", label: "Horarios por curso", icon: CalendarDays },
] as const;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Administrador general",
  ADMIN: "Administrador",
  MAESTRO: "Docente",
  ESTUDIANTE: "Estudiante",
};

// El orden refleja las dependencias de configuración (ver /inicio). Los
// primeros 9 llevan número de paso; Bitácora es consulta, sin número.
const CONFIG_NAV = [
  { href: "/config/niveles", label: "Niveles", icon: Layers, step: 1 },
  { href: "/config/grados", label: "Grados", icon: GraduationCap, step: 2 },
  { href: "/config/turnos", label: "Turnos", icon: Clock, step: 3 },
  { href: "/config/cursos", label: "Cursos", icon: Users, step: 4 },
  { href: "/config/materias", label: "Materias", icon: BookOpen, step: 5 },
  { href: "/config/aulas", label: "Aulas", icon: DoorOpen, step: 6 },
  { href: "/config/docentes", label: "Docentes", icon: UserSquare2, step: 7 },
  {
    href: "/config/asignaciones",
    label: "Asignaciones",
    icon: ClipboardList,
    step: 8,
  },
  { href: "/config/reglas", label: "Reglas", icon: SlidersHorizontal, step: 9 },
  { href: "/config/bitacora", label: "Bitácora", icon: ScrollText },
  { href: "/config/backups", label: "Respaldos", icon: DatabaseBackup },
  { href: "/config/usuarios", label: "Usuarios y Accesos", icon: Shield },
  {
    href: "/config/solicitudes",
    label: "Bandeja Solicitudes",
    icon: MessageSquare,
  },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, checked, isSuperAdmin, isAdmin, isMaestro, isEstudiante } =
    useCurrentUser();

  useEffect(() => {
    if (!checked) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Maestro y estudiante solo tienen su propia vista.
    if (
      isMaestro &&
      !pathname.startsWith("/mi-horario") &&
      !pathname.startsWith("/mis-solicitudes")
    ) {
      router.replace("/mi-horario");
    } else if (isEstudiante && !pathname.startsWith("/horarios-curso")) {
      router.replace("/horarios-curso");
    }
  }, [checked, user, isMaestro, isEstudiante, pathname, router]);

  const mainNav = isMaestro ? MAESTRO_NAV : isEstudiante ? ESTUDIANTE_NAV : NAV;
  // Configuración solo para administradores; Bitácora y Respaldos solo super admin.
  const SUPER_ADMIN_ONLY = ["/config/bitacora", "/config/backups"];
  const configNav = isAdmin
    ? CONFIG_NAV.filter(
        (item) => !SUPER_ADMIN_ONLY.includes(item.href) || isSuperAdmin,
      )
    : [];

  if (!checked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Verificando sesión" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col bg-surface text-gray-200 print:hidden">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <CalendarDays className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-white">Horarios RD</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
            />
          ))}
          {configNav.length > 0 && (
            <div className="mt-5 mb-2 border-t border-white/10 px-3 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Configuración
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Sigue el orden 1 → 9
              </p>
            </div>
          )}
          {configNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-3">
          <p className="truncate text-sm font-medium text-white">
            {user?.name}
          </p>
          <p className="truncate text-xs text-gray-400">
            {user ? (ROLE_LABELS[user.role] ?? user.role) : ""}
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-300 hover:bg-surface-hover hover:text-white"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-6 print:ml-0 print:p-0">{children}</main>
    </div>
  );
}

function NavLink({
  item,
  active,
}: {
  item: {
    href: string;
    label: string;
    icon: typeof CalendarDays;
    step?: number;
  };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary-600 font-medium text-white"
          : "text-gray-300 hover:bg-surface-hover hover:text-white",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {item.step !== undefined && (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-5 items-center justify-center rounded text-[10px] font-semibold",
            active ? "bg-white/20 text-white" : "bg-white/10 text-gray-400",
          )}
        >
          {item.step}
        </span>
      )}
    </Link>
  );
}
