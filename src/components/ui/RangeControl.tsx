import type { ReactNode } from 'react';

export interface RangeControlProps {
  label: ReactNode;
  value: number;
  displayValue: ReactNode;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  footer?: ReactNode;
  title?: string;
}

/**
 * Shared numeric control for design parameters. Keeping parsing and accessible
 * range semantics here makes new parametric controls consistent by default.
 */
export function RangeControl({
  label,
  value,
  displayValue,
  min,
  max,
  step = 1,
  onChange,
  footer,
  title,
}: RangeControlProps) {
  return (
    <div>
      <div className="flex justify-between items-center text-slate-400 mb-1">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-white">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-amber-500 cursor-pointer"
        title={title}
      />
      {footer}
    </div>
  );
}
