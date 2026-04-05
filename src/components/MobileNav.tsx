"use client";

import type { Preference } from "@/lib/types";

type Props = {
  preference: Preference;
  onPreferenceChange: (p: Preference) => void;
  disabled?: boolean;
};

const PREFERENCES: { id: Preference; label: string; icon: string }[] = [
  { id: "news", label: "News", icon: "📰" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "movies", label: "Movies", icon: "🎬" },
];

export function MobileNav({
  preference,
  onPreferenceChange,
  disabled,
}: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[var(--surface)]/95 backdrop-blur-md md:hidden">
      <div className="flex h-16 items-center justify-around px-4">
        {PREFERENCES.map(({ id, label, icon }) => {
          const active = preference === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onPreferenceChange(id)}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition ${
                active
                  ? "text-[var(--accent)] bg-[var(--accent)]/10"
                  : "text-zinc-400 hover:text-zinc-200"
              } disabled:opacity-50`}
            >
              <span className="text-lg">{icon}</span>
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
