import { type ButtonHTMLAttributes, type Ref } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-primary hover:bg-primary-700 hover:shadow-elevated focus-visible:outline-primary-600 disabled:bg-primary-300 disabled:shadow-none",
  secondary:
    "bg-white text-gray-700 border border-gray-300 shadow-card hover:bg-gray-50 hover:border-gray-400 hover:shadow-card-hover disabled:text-gray-400 disabled:shadow-none",
  danger:
    "bg-red-600 text-white shadow-card hover:bg-red-700 hover:shadow-elevated focus-visible:outline-red-600 disabled:bg-red-300 disabled:shadow-none",
  ghost: "text-gray-600 hover:bg-gray-100 disabled:text-gray-300",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  type = "button",
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled ?? loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
        "motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] disabled:transform-none",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
Button.displayName = "Button";
