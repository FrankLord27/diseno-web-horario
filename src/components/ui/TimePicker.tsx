import { type Ref } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  ref?: Ref<HTMLDivElement>;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"] as const;

function selectCls(invalid?: boolean) {
  return cn(
    "w-full cursor-pointer appearance-none rounded-lg border bg-white py-2 pr-9 pl-3 text-sm text-gray-900 shadow-card transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
    invalid
      ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/25"
      : "border-gray-300 hover:border-gray-400 focus-visible:border-primary-500",
  );
}

export function TimePicker({
  value,
  onChange,
  invalid,
  disabled,
  id,
  ref,
  "aria-label": ariaLabel,
}: TimePickerProps) {
  const [hh = "07", mm = "00"] = (value ?? "07:00").split(":");

  function update(newHH: string, newMM: string) {
    onChange(`${newHH}:${newMM}`);
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel ?? "Hora"}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <select
          id={id}
          aria-label="Hora"
          value={hh}
          disabled={disabled}
          className={selectCls(invalid)}
          onChange={(e) => update(e.target.value, mm)}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}h
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
      </div>
      <div className="relative flex-1">
        <select
          aria-label="Minutos"
          value={mm}
          disabled={disabled}
          className={selectCls(invalid)}
          onChange={(e) => update(hh, e.target.value)}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              :{m}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
TimePicker.displayName = "TimePicker";
