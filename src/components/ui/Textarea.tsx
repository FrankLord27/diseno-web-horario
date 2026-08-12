import { type Ref, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({ className, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600",
        className,
      )}
      {...props}
    />
  );
}
Textarea.displayName = "Textarea";
