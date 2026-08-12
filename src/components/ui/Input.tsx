import { type InputHTMLAttributes, type Ref } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ className, invalid, ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      className={cn(
        "rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-card transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
        invalid
          ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/25"
          : "border-gray-300 hover:border-gray-400 focus-visible:border-primary-500",
        className,
      )}
      aria-invalid={invalid}
      {...props}
    />
  );
}
Input.displayName = "Input";
