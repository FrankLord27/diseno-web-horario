import { type InputHTMLAttributes, type Ref } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({
  className,
  label,
  id,
  ref,
  ...props
}: CheckboxProps) {
  const checkboxId = id ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label
      htmlFor={checkboxId}
      className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
    >
      <input
        ref={ref}
        id={checkboxId}
        type="checkbox"
        className={cn(
          "size-4 rounded border-gray-300 text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600",
          className,
        )}
        {...props}
      />
      {label}
    </label>
  );
}
Checkbox.displayName = "Checkbox";
