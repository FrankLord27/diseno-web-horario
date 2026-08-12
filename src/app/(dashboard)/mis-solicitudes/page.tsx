"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateTicketSchema, type CreateTicketInput } from "@horarios/shared-types";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { Ticket } from "@/types/entities";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, "gray" | "green" | "red"> = {
  PENDIENTE: "gray",
  APROBADO: "green",
  RECHAZADO: "red",
};

export default function MisSolicitudesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["tickets-me"],
    queryFn: () => apiClient.get<Ticket[]>("/tickets/me"),
  });

  const create = useMutation({
    mutationFn: (data: CreateTicketInput) =>
      apiClient.post<Ticket>("/tickets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets-me"] });
      setIsOpen(false);
      form.reset();
    },
  });

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(CreateTicketSchema),
    defaultValues: { title: "", message: "" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Mis Solicitudes
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Pide cambios, notifica ausencias o envía requerimientos a dirección.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          Nueva Solicitud
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading && <p className="text-gray-400">Cargando...</p>}
        {!isLoading && tickets.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-surface-hover p-8 text-center text-sm text-gray-400">
            Aún no has enviado ninguna solicitud.
          </div>
        )}
        {tickets.map((t) => (
          <div key={t.id} className="rounded-xl border border-white/10 bg-surface p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-white">{t.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{formatDate(t.createdAt)}</p>
              </div>
              <Badge tone={STATUS_COLORS[t.status]}>{t.status}</Badge>
            </div>
            <p className="text-sm text-gray-300 mt-3 whitespace-pre-wrap">{t.message}</p>
            {t.adminReply && (
              <div className="mt-4 rounded bg-primary-900/30 p-3 border border-primary-500/20">
                <p className="text-xs font-semibold text-primary-400 mb-1">Respuesta de Administración:</p>
                <p className="text-sm text-gray-200">{t.adminReply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Nueva Solicitud"
      >
        <form
          onSubmit={form.handleSubmit((d) => create.mutate(d))}
          className="flex flex-col gap-4 mt-4"
        >
          <Field label="Asunto (Ej: Cambio de turno el martes)" required error={form.formState.errors.title?.message}>
            {({ inputId }) => (
              <Input id={inputId} {...form.register("title")} />
            )}
          </Field>
          
          <Field label="Mensaje detallado" required error={form.formState.errors.message?.message}>
            {({ inputId }) => (
              <textarea
                id={inputId}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Explica qué necesitas..."
                {...form.register("message")}
              />
            )}
          </Field>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
