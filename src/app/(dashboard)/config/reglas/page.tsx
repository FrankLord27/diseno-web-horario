"use client";

import type { SoftRuleKey } from "@horarios/shared-types";
import { useSoftRules, useUpdateSoftRule } from "@/hooks/useSchedule";
import { useCurrentUser } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorSummary } from "@/components/ui/ErrorSummary";

interface RuleInfo {
  label: string;
  description: string;
  example: string;
  category: "curso" | "docente";
}

const RULE_INFO: Record<SoftRuleKey, RuleInfo> = {
  EVITAR_MAS_DE_2_CONSECUTIVOS: {
    label: "No repetir una materia más de 2 bloques seguidos",
    description:
      "Si una materia tiene varias horas a la semana en un curso, evita ponerlas todas el mismo día en fila.",
    example:
      "Matemáticas con 6h/semana: con este peso alto no aparece 3 veces seguidas el mismo día; con el peso bajo, el motor lo permite si ayuda a acomodar el resto del horario.",
    category: "curso",
  },
  DISTRIBUIR_EN_SEMANA: {
    label: "Repartir cada materia en distintos días",
    description:
      "Evita concentrar las horas de una materia en pocos días — prefiere que aparezca un poco cada día en vez de mucho un solo día.",
    example:
      "Lengua Española con 6h/semana: con peso alto tiende a quedar en días distintos; con peso bajo puede juntarse más en un mismo día.",
    category: "curso",
  },
  PESADAS_EN_BLOQUES_INTERMEDIOS: {
    label: "Poner las materias con más carga a media jornada",
    description:
      "Las materias con 4 horas semanales o más se intentan ubicar ni en el primer bloque del día ni en el último.",
    example:
      "Matemáticas (6h/sem) evita quedar a primera hora o justo a la salida; se prefiere el resto de la jornada.",
    category: "curso",
  },
  BALANCEAR_CARGA_DIARIA: {
    label: "Repartir parejo la cantidad de clases de cada curso entre días",
    description:
      "Evita que un curso tenga, por ejemplo, 8 clases el lunes y 3 el viernes — busca que cada día tenga una cantidad de clases más pareja.",
    example:
      "Con peso alto, un curso no queda con un día muy cargado y otro casi vacío.",
    category: "curso",
  },
  RESPETAR_PREFERIDOS_DOCENTE: {
    label: "Priorizar los bloques que el docente prefiere",
    description:
      'Si un docente marcó bloques como "preferido" en su disponibilidad (Docentes → editar → grilla de disponibilidad), el motor intenta usar esos bloques primero para darle clase.',
    example:
      "Si un docente prefiere los primeros bloques del lunes, el motor intenta darle clase ahí antes que en otro horario disponible.",
    category: "docente",
  },
  EVITAR_HUECOS_DOCENTE: {
    label: "Que el docente no tenga bloques libres entre clases",
    description:
      "Prioriza que las clases de un mismo docente en un día queden pegadas unas a otras, sin espacios vacíos entre medio.",
    example:
      "Clase, clase, hueco, clase → el motor prefiere clase, clase, clase, hueco. Este es el mismo criterio detrás de los avisos 'tiene N hueco(s) el [día]' del panel de conflictos.",
    category: "docente",
  },
};

const CATEGORY_LABEL: Record<RuleInfo["category"], string> = {
  curso: "Cómo se reparten las materias en el curso",
  docente: "Bienestar de los docentes",
};

function weightTone(weight: number): string {
  if (weight <= 3) return "Bajo";
  if (weight <= 7) return "Medio";
  return "Alto";
}

export default function ReglasPage() {
  const { isAdmin } = useCurrentUser();
  const rules = useSoftRules();
  const update = useUpdateSoftRule();

  const grouped = (rules.data ?? []).reduce<
    Record<RuleInfo["category"], typeof rules.data>
  >(
    (acc, rule) => {
      const info = RULE_INFO[rule.key as SoftRuleKey];
      const category = info?.category ?? "curso";
      (acc[category] ??= []).push(rule);
      return acc;
    },
    { curso: [], docente: [] },
  );

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">
          Reglas de generación (restricciones blandas)
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          El motor nunca rompe una restricción dura (choques de docente,
          disponibilidad, capacidad de aula, etc.). Las reglas de esta página
          son <strong>preferencias</strong>: cuando dos compiten por el mismo
          bloque, gana la que tenga más peso. Subir el peso de una no la vuelve
          obligatoria — solo la hace importar más frente a las demás.
        </p>
      </header>

      <ErrorSummary error={update.error} />

      {rules.isLoading ? (
        <Spinner label="Cargando reglas" />
      ) : (
        (["curso", "docente"] as const).map((category) => (
          <section key={category} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {CATEGORY_LABEL[category]}
            </h2>
            <ul className="flex flex-col gap-3">
              {(grouped[category] ?? []).map((rule) => {
                const info = RULE_INFO[rule.key as SoftRuleKey];
                return (
                  <li
                    key={rule.key}
                    className="flex flex-col gap-3 rounded-card border border-gray-200 bg-white p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {info?.label ?? rule.key}
                        </p>
                        {info && (
                          <p className="mt-1 text-sm text-gray-600">
                            {info.description}
                          </p>
                        )}
                      </div>
                      <label className="flex shrink-0 items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          disabled={!isAdmin || update.isPending}
                          onChange={(e) =>
                            update.mutate({
                              key: rule.key as SoftRuleKey,
                              weight: rule.weight,
                              enabled: e.target.checked,
                            })
                          }
                          className="size-4 accent-primary-600"
                        />
                        Activa
                      </label>
                    </div>

                    {info && (
                      <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                        <strong className="text-gray-600">Ejemplo: </strong>
                        {info.example}
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={rule.weight}
                        disabled={!isAdmin || !rule.enabled || update.isPending}
                        onChange={(e) =>
                          update.mutate({
                            key: rule.key as SoftRuleKey,
                            weight: Number(e.target.value),
                            enabled: rule.enabled,
                          })
                        }
                        className="flex-1 accent-primary-600 disabled:opacity-40"
                      />
                      <span className="w-24 shrink-0 text-right text-sm">
                        <span className="font-semibold text-gray-800">
                          {rule.weight}
                        </span>{" "}
                        <span className="text-gray-400">
                          ({weightTone(rule.weight)})
                        </span>
                      </span>
                    </div>
                    <div className="-mt-2 flex justify-between text-[10px] text-gray-400">
                      <span>Bajo</span>
                      <span>Medio</span>
                      <span>Alto</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
