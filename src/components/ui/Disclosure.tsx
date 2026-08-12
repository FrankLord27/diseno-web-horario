import type { ReactNode } from "react";

/**
 * Contenedor animado para expandir contenido en el lugar (sin modal).
 * Anima `grid-template-rows` en vez de `height` para no necesitar medir el
 * alto en JS; funciona igual dentro de un <td> de tabla.
 */
export function ExpandPanel({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
