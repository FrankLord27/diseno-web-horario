"use client";

import { Fragment, useState, type ReactNode } from "react";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { useCrudResource } from "@/hooks/useCrud";
import { useCurrentUser } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { ExpandPanel } from "@/components/ui/Disclosure";
import {
  TablePagination,
  usePagination,
} from "@/components/ui/TablePagination";

export interface CrudColumn<TEntity> {
  header: string;
  cell: (item: TEntity) => ReactNode;
}

interface CrudPageProps<
  TEntity extends { id: string },
  TCreate extends FieldValues,
> {
  title: string;
  description?: string;
  resource: string;
  columns: CrudColumn<TEntity>[];
  schema: ZodType<TCreate>;
  defaultValues: TCreate;
  toFormValues?: (item: TEntity) => TCreate;
  renderForm: (form: UseFormReturn<TCreate>) => ReactNode;
  itemLabel: (item: TEntity) => string;
  newLabel?: string;
  modalSize?: "sm" | "md" | "lg";
  /** Si se pasa, cada fila agrega un botón para expandir detalle en el lugar (sin modal). */
  renderExpanded?: (item: TEntity) => ReactNode;
}

export function CrudPage<
  TEntity extends { id: string },
  TCreate extends FieldValues,
>({
  title,
  description,
  resource,
  columns,
  schema,
  defaultValues,
  toFormValues,
  renderForm,
  itemLabel,
  newLabel = "Nuevo",
  modalSize = "md",
  renderExpanded,
}: CrudPageProps<TEntity, TCreate>) {
  const { isAdmin } = useCurrentUser();
  const { list, create, update, remove } = useCrudResource<
    TEntity,
    TCreate,
    TCreate
  >(resource);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<TEntity | null>(null);
  const [deleting, setDeleting] = useState<TEntity | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const form = useForm<TCreate>({
    // Los overloads de zodResolver no aceptan el genérico abstracto ZodType<TCreate>;
    // el cast solo cruza esa frontera de tipos, el runtime es idéntico
    resolver: zodResolver(schema as never) as unknown as Resolver<TCreate>,
    defaultValues: defaultValues as never,
  });

  function openCreate() {
    form.reset(defaultValues);
    create.reset();
    setEditing(null);
    setModalMode("create");
  }

  function openEdit(item: TEntity) {
    form.reset(
      toFormValues ? toFormValues(item) : (item as unknown as TCreate),
    );
    update.reset();
    setEditing(item);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
  }

  async function onSubmit(values: TCreate) {
    if (modalMode === "edit" && editing) {
      await update.mutateAsync({ id: editing.id, data: values });
    } else {
      await create.mutateAsync(values);
    }
    closeModal();
  }

  async function confirmDelete() {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id);
    setDeleting(null);
  }

  const mutationError =
    modalMode === "edit"
      ? update.error
      : modalMode === "create"
        ? create.error
        : null;

  // Paginación cliente: los datos ya vienen completos del servidor.
  const { pageItems, controls } = usePagination(list.data ?? []);

  return (
    <div className="flex flex-col gap-4 motion-safe:animate-fade-in-up">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            {newLabel}
          </Button>
        )}
      </header>

      <div className="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card">
        {list.isLoading ? (
          <table
            className="w-full text-left text-sm"
            aria-label="Cargando…"
            aria-busy="true"
          >
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                {columns.map((col) => (
                  <th key={col.header} scope="col" className="px-4 py-3">
                    {col.header}
                  </th>
                ))}
                {isAdmin && (
                  <th scope="col" className="px-4 py-3 text-right">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.header} className="px-4 py-3">
                      <div className="h-4 rounded bg-gray-200" />
                    </td>
                  ))}
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="ml-auto h-4 w-14 rounded bg-gray-200" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : list.isError ? (
          <div className="p-6">
            <ErrorSummary error={list.error} />
          </div>
        ) : list.data && list.data.length > 0 ? (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  {renderExpanded && (
                    <th scope="col" className="w-10 px-2 py-3">
                      <span className="sr-only">Expandir</span>
                    </th>
                  )}
                  {columns.map((col) => (
                    <th key={col.header} scope="col" className="px-4 py-3">
                      {col.header}
                    </th>
                  ))}
                  {isAdmin && (
                    <th scope="col" className="px-4 py-3 text-right">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((item) => {
                  const isExpanded = expandedIds.has(item.id);
                  const colSpan =
                    columns.length +
                    (isAdmin ? 1 : 0) +
                    (renderExpanded ? 1 : 0);
                  return (
                    <Fragment key={item.id}>
                      <tr className="hover:bg-gray-50">
                        {renderExpanded && (
                          <td className="px-2 py-3">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.id)}
                              aria-expanded={isExpanded}
                              aria-label={
                                isExpanded
                                  ? `Ocultar detalle de ${itemLabel(item)}`
                                  : `Ver detalle de ${itemLabel(item)}`
                              }
                              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600"
                            >
                              <ChevronDown
                                className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                aria-hidden="true"
                              />
                            </button>
                          </td>
                        )}
                        {columns.map((col) => (
                          <td
                            key={col.header}
                            className="px-4 py-3 text-gray-700"
                          >
                            {col.cell(item)}
                          </td>
                        ))}
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(item)}
                                aria-label={`Editar ${itemLabel(item)}`}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600"
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleting(item)}
                                aria-label={`Eliminar ${itemLabel(item)}`}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600"
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                      {renderExpanded && (
                        <tr>
                          <td colSpan={colSpan} className="p-0">
                            <ExpandPanel open={isExpanded}>
                              <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4">
                                {renderExpanded(item)}
                              </div>
                            </ExpandPanel>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            <TablePagination controls={controls} idPrefix={resource} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-700">
              Aún no hay {title.toLowerCase()}.
            </p>
            {isAdmin && (
              <p className="text-xs text-gray-400">
                Haz clic en «{newLabel}» para agregar el primero.
              </p>
            )}
          </div>
        )}
      </div>

      <Modal
        open={modalMode !== null}
        onClose={closeModal}
        title={
          modalMode === "edit"
            ? `Editar ${title.toLowerCase()}`
            : `${newLabel} ${title.toLowerCase()}`
        }
        size={modalSize}
      >
        <form
          onSubmit={(e) => {
            void form.handleSubmit(onSubmit)(e);
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <ErrorSummary error={mutationError} />
          {renderForm(form)}
          <div className="mt-2 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button variant="secondary" onClick={closeModal} type="button">
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={create.isPending || update.isPending}
            >
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Confirmar eliminación"
        message={
          deleting
            ? `¿Eliminar "${itemLabel(deleting)}"? Esta acción no se puede deshacer.`
            : ""
        }
        loading={remove.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
