import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label = "Cargando",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 text-sm text-gray-500"
    >
      <Loader2
        className={cn("size-4 animate-spin", className)}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
