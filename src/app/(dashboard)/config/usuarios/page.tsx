"use client";

import {
  CreateUserSchema,
  RoleSchema,
  type CreateUserInput,
} from "@horarios/shared-types";
import type { Teacher, User } from "@/types/entities";
import { useCrudResource } from "@/hooks/useCrud";
import { CrudPage } from "@/components/features/CrudPage";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MAESTRO: "Docente",
  ESTUDIANTE: "Estudiante",
};

const ROLE_COLORS: Record<string, "red" | "amber" | "blue" | "gray"> = {
  SUPER_ADMIN: "red",
  ADMIN: "amber",
  MAESTRO: "blue",
  ESTUDIANTE: "gray",
};

function generatePassword(complexity: "facil" | "segura" = "facil"): string {
  if (complexity === "facil") {
    const words = ["sol", "luna", "mar", "rio", "flor", "paz", "luz"];
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${w1}${w2}${num}`; // ej: solmar482
  } else {
    return Math.random().toString(36).slice(-10) + "X1!"; // ej: 9z8f7b2xX1!
  }
}

export default function UsuariosPage() {
  const teachers = useCrudResource<Teacher>("teachers").list;

  return (
    <div className="flex flex-col gap-4">
      <CrudPage<User, CreateUserInput>
        title="Usuarios y Accesos"
        description="Gestión de cuentas para el sistema, roles y permisos de acceso."
        resource="users"
        schema={CreateUserSchema}
        defaultValues={{
          name: "",
          email: "",
          role: "MAESTRO",
          password: "",
          teacherId: null,
        }}
        toFormValues={(u) => ({
          name: u.name,
          email: u.email,
          role: u.role,
          password: "", // Nunca mostramos la clave real al editar
          teacherId: u.teacherId,
        })}
        itemLabel={(u) => u.name}
        columns={[
          { header: "Nombre", cell: (u) => u.name },
          { header: "Correo", cell: (u) => u.email },
          {
            header: "Rol",
            cell: (u) => (
              <Badge tone={ROLE_COLORS[u.role] ?? "gray"}>
                {ROLE_LABELS[u.role]}
              </Badge>
            ),
          },
          {
            header: "Docente Enlazado",
            cell: (u) => {
              if (!u.teacherId) return "—";
              const t = (teachers.data ?? []).find((x) => x.id === u.teacherId);
              return t ? `${t.firstName} ${t.lastName}` : "Desconocido";
            },
          },
        ]}
        renderForm={(form) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Nombre completo"
              required
              error={form.formState.errors.name?.message}
            >
              {({ inputId }) => (
                <Input id={inputId} {...form.register("name")} />
              )}
            </Field>

            <Field
              label="Correo (Usuario de acceso)"
              required
              error={form.formState.errors.email?.message}
            >
              {({ inputId }) => (
                <Input
                  id={inputId}
                  type="email"
                  {...form.register("email")}
                />
              )}
            </Field>

            <Field label="Rol del sistema" required>
              {({ inputId }) => (
                <Select id={inputId} {...form.register("role")}>
                  {RoleSchema.options.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field
              label="Enlazar con perfil de Docente"
              error={form.formState.errors.teacherId?.message}
            >
              {({ inputId }) => (
                <Select
                  id={inputId}
                  value={form.watch("teacherId") ?? ""}
                  onChange={(e) =>
                    form.setValue("teacherId", e.target.value || null, {
                      shouldValidate: true,
                    })
                  }
                  disabled={form.watch("role") !== "MAESTRO"}
                >
                  <option value="">— Ninguno —</option>
                  {(teachers.data ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="col-span-1 sm:col-span-2">
              <Field
                label="Contraseña de acceso (Déjala en blanco al editar si no quieres cambiarla)"
                error={form.formState.errors.password?.message}
              >
                {({ inputId }) => (
                  <div className="flex gap-2 items-center">
                    <Input
                      id={inputId}
                      type="text"
                      className="flex-1"
                      placeholder="Escribe o genera una clave..."
                      {...form.register("password", {
                        setValueAs: (v: string) => (v === "" ? undefined : v),
                      })}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        form.setValue("password", generatePassword("facil"), { shouldValidate: true })
                      }
                      title="Generar fácil de recordar"
                    >
                      Fácil
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        form.setValue("password", generatePassword("segura"), { shouldValidate: true })
                      }
                      title="Generar segura y compleja"
                    >
                      Fuerte
                    </Button>
                  </div>
                )}
              </Field>
              <p className="mt-1 text-xs text-gray-500">
                Asegúrate de copiar la contraseña para dársela al usuario.
              </p>
            </div>
          </div>
        )}
      />
    </div>
  );
}
