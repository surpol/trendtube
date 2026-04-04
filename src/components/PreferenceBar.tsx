"use client";

import type { Preference } from "@/lib/types";

const OPTIONS: { id: Preference; label: string }[] = [
  { id: "news", label: "News" },
  { id: "music", label: "Music" },
  { id: "movies", label: "Movies" },
];

type Props = {
  value: Preference;
  onChange: (p: Preference) => void;
  disabled?: boolean;
};

export function PreferenceBar({ value, onChange, disabled }: Props) {
  return (
    <div
      className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-1"
      role="tablist"
      aria-label="Content focus"
    >
      {OPTIONS.map(({ id, label }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-[var(--accent)] text-black shadow-lg shadow-orange-500/20"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            } disabled:opacity-50`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
