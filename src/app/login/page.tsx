"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays } from "lucide-react";
import { LoginSchema, type LoginInput } from "@horarios/shared-types";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { ErrorSummary } from "@/components/ui/ErrorSummary";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    await login.mutateAsync(values);
    router.push("/horarios");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl"
      />
      <div className="relative w-full max-w-sm motion-safe:animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-primary">
            <CalendarDays className="size-7" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Horarios Escolares RD
          </h1>
          <p className="text-sm text-gray-500">
            Genera y administra el horario semanal de tu colegio
          </p>
        </div>

        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="flex flex-col gap-4 rounded-card border border-gray-200/80 bg-white p-6 shadow-elevated ring-1 ring-gray-900/5"
          noValidate
        >
          <ErrorSummary error={login.error} />
          <Field
            label="Correo electrónico"
            required
            error={form.formState.errors.email?.message}
          >
            {({ inputId, describedBy }) => (
              <Input
                id={inputId}
                type="email"
                autoComplete="email"
                placeholder="admin@colegio.edu"
                aria-describedby={describedBy}
                invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
            )}
          </Field>
          <Field
            label="Contraseña"
            required
            error={form.formState.errors.password?.message}
          >
            {({ inputId, describedBy }) => (
              <Input
                id={inputId}
                type="password"
                autoComplete="current-password"
                aria-describedby={describedBy}
                invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
            )}
          </Field>
          <Button type="submit" loading={login.isPending} className="w-full">
            Iniciar sesión
          </Button>
          <p className="text-center text-xs text-gray-400">
            Demo: admin@colegio.edu / Admin123!
          </p>
        </form>
      </div>
    </main>
  );
}
