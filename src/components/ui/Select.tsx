import { type Ref, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  ref?: Ref<HTMLSelectElement>;
}

export function Select({
  className,
  invalid,
  children,
  ref,
  ...props
}: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        ref={ref}
        className={cn(
          "w-full cursor-pointer appearance-none rounded-lg border bg-white py-2 pr-9 pl-3 text-sm text-gray-900 shadow-card transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
          invalid
            ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/25"
            : "border-gray-300 hover:border-gray-400 focus-visible:border-primary-500",
        )}
        aria-invalid={invalid}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
    </div>
  );
}
Select.displayName = "Select";
