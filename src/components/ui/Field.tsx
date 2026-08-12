import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  description?: string;
  required?: boolean;
  children: (ids: { inputId: string; describedBy?: string }) => ReactNode;
  className?: string;
}

export function Field({
  label,
  error,
  hint,
  description,
  required,
  children,
  className,
}: FieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const descId = `${inputId}-desc`;
  const describedBy = error
    ? errorId
    : hint
      ? hintId
      : description
        ? descId
        : undefined;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {description && (
        <p id={descId} role="note" className="text-xs text-gray-400">
          {description}
        </p>
      )}
      {children({ inputId, describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
