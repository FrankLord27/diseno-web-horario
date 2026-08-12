"use client";

import { useCurrentUser } from "@/hooks/useAuth";
import { useScheduleView } from "@/hooks/useSchedule";
import { Spinner } from "@/components/ui/Spinner";
import { ReadOnlyScheduleGrid } from "@/components/features/ReadOnlyScheduleGrid";

export default function MiHorarioPage() {
  const { user, checked } = useCurrentUser();
  const teacherId = user?.teacherId ?? undefined;
  const view = useScheduleView("teacher", teacherId);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Mi horario</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tu horario semanal de clases.
        </p>
      </header>

      {!checked ? (
        <Spinner label="Cargando" />
      ) : !teacherId ? (
        <p className="rounded-card border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Tu usuario aún no está vinculado a un docente. Pídele al administrador
          que asocie tu cuenta a tu ficha de docente.
        </p>
      ) : view.isLoading ? (
        <Spinner label="Cargando horario" />
      ) : (
        <ReadOnlyScheduleGrid
          cells={view.data ?? []}
          emptyLabel="Todavía no hay un horario generado para ti."
        />
      )}
    </div>
  );
}
