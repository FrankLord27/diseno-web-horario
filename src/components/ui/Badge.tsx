import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "red" | "amber" | "green" | "gray" | "blue";

const TONE_CLASSES: Record<Tone, string> = {
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-800",
};

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}
