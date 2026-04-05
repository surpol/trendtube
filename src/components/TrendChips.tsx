"use client";

type Props = {
  trends: string[];
  onPick: (label: string) => void;
  busy?: boolean;
};

export function TrendChips({ trends, onPick, busy }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {trends.map((label, idx) => (
        <button
          key={label}
          type="button"
          disabled={busy}
          onClick={() => onPick(label)}
          style={{ animationDelay: `${idx * 30}ms` }}
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 hover:text-white hover:scale-105 disabled:opacity-50 animate-in fade-in duration-300"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
