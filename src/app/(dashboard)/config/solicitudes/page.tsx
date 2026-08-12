"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UpdateTicketStatusSchema,
  type TicketStatus,
  type UpdateTicketStatusInput,
} from "@horarios/shared-types";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import type { Ticket } from "@/types/entities";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDate } from "@/lib/utils";
import { Inbox } from "lucide-react";

const STATUS_TONE: Record<TicketStatus, "gray" | "green" | "red"> = {
  PENDIENTE: "gray",
  APROBADO: "green",
  RECHAZADO: "red",
};
const STATUS_LABEL: Record<TicketStatus, string> = {
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export default function SolicitudesAdminPage() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: () => apiClient.get<Ticket[]>("/tickets"),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketStatusInput }) =>
      apiClient.patch<Ticket>(`/tickets/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setSelectedTicket(null);
    },
  });

  const form = useForm<UpdateTicketStatusInput>({
    resolver: zodResolver(UpdateTicketStatusSchema),
    defaultValues: { status: "PENDIENTE", adminReply: "" },
  });

  function handleOpen(ticket: Ticket) {
    setSelectedTicket(ticket);
    form.reset({ status: ticket.status, adminReply: ticket.adminReply ?? "" });
  }

  return (
    <div className="flex flex-col gap-4 motion-safe:animate-fade-in-up">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">
          Bandeja de Solicitudes
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Requerimientos de cambios enviados por los docentes
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-card border border-gray-200 bg-white shadow-card"
            />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-gray-200 bg-white px-6 py-12 text-center shadow-card">
          <div className="flex size-12 items-center justify-center rounded-full bg-gray-100">
            <Inbox className="size-6 text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-gray-700">Bandeja vacía</p>
          <p className="text-xs text-gray-400">No hay solicitudes todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleOpen(t)}
              className="flex flex-col gap-2 rounded-card border border-gray-200 bg-white p-4 text-left shadow-card transition-[box-shadow,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">
                  {t.title}
                </h3>
                <Badge tone={STATUS_TONE[t.status]}>
                  {STATUS_LABEL[t.status]}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                De: {t.teacher?.firstName} {t.teacher?.lastName}
              </p>
              <p className="line-clamp-2 text-sm text-gray-600">{t.message}</p>
              <p className="mt-auto pt-1 text-[11px] text-gray-400">
                {formatDate(t.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Gestionar solicitud"
        size="md"
      >
        {selectedTicket && (
          <form
            onSubmit={form.handleSubmit((d) =>
              update.mutate({ id: selectedTicket.id, data: d }),
            )}
            className="flex flex-col gap-4"
          >
            <div className="rounded-lg bg-gray-50 p-3">
              <h4 className="font-semibold text-gray-900">
                {selectedTicket.title}
              </h4>
              <p className="mb-2 text-xs text-primary-700">
                De: {selectedTicket.teacher?.firstName}{" "}
                {selectedTicket.teacher?.lastName}
              </p>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {selectedTicket.message}
              </p>
            </div>

            <Field
              label="Cambiar estado"
              required
              error={form.formState.errors.status?.message}
            >
              {({ inputId }) => (
                <Select id={inputId} {...form.register("status")}>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="APROBADO">Aprobar</option>
                  <option value="RECHAZADO">Rechazar</option>
                </Select>
              )}
            </Field>

            <Field
              label="Respuesta / nota (opcional)"
              error={form.formState.errors.adminReply?.message}
            >
              {({ inputId }) => (
                <Textarea
                  id={inputId}
                  rows={3}
                  placeholder="Escribe tu respuesta al docente…"
                  {...form.register("adminReply")}
                />
              )}
            </Field>

            <div className="mt-2 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedTicket(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={update.isPending}>
                Guardar cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
