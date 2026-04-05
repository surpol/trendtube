"use client";

import { COUNTRY_CODES } from "@/hooks/useLocation";

type Props = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  detecting?: boolean;
};

export function LocationSelector({
  value,
  onChange,
  disabled,
  detecting,
}: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || detecting}
      className="rounded-lg md:rounded-xl border border-white/10 bg-zinc-900/60 px-3 md:px-4 py-2 text-sm text-white focus:border-[var(--accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 disabled:opacity-50 cursor-pointer"
    >
      {COUNTRY_CODES.map(({ code, name }) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
}
