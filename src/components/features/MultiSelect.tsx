"use client";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
}: MultiSelectProps) {
  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-medium text-gray-700">{label}</legend>
      <div className="grid max-h-48 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto rounded-lg border border-gray-300 p-3">
        {options.length === 0 && (
          <p className="col-span-2 text-xs text-gray-500">
            No hay opciones disponibles.
          </p>
        )}
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
          >
            <input
              type="checkbox"
              className="size-4 rounded border-gray-300 text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600"
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
