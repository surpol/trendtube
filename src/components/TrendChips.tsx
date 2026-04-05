"use client";

type Props = {
  trends: string[];
  onPick: (label: string) => void;
  busy?: boolean;
};

export function TrendChips({ trends, onPick, busy }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {trends.map((label) => (
        <button
          key={label}
          type="button"
          disabled={busy}
          onClick={() => onPick(label)}
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 hover:text-white disabled:opacity-50"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
