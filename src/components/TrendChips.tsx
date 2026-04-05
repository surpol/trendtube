"use client";

type TrendItem = {
  query: string;
  value?: number;
};

type Props = {
  trends: TrendItem[];
  onPick: (label: string) => void;
  busy?: boolean;
};

// Calculate trend strength badge
function getTrendBadge(value?: number): { emoji: string; label: string; color: string } {
  if (!value) return { emoji: "⭐", label: "Trending", color: "text-yellow-400" };
  if (value >= 85) return { emoji: "🔥", label: "Hot", color: "text-red-400" };
  if (value >= 70) return { emoji: "📈", label: "Rising", color: "text-orange-400" };
  if (value >= 50) return { emoji: "✨", label: "Popular", color: "text-blue-400" };
  return { emoji: "⭐", label: "Trending", color: "text-zinc-400" };
}

// Calculate visual bar width based on value
function getBarWidth(value?: number): number {
  if (!value) return 60;
  return Math.min(100, Math.max(30, value));
}

export function TrendChips({ trends, onPick, busy }: Props) {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Desktop: Horizontal row */}
      <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {trends.map((item, idx) => {
          const badge = getTrendBadge(item.value);
          return (
            <button
              key={item.query}
              type="button"
              disabled={busy}
              onClick={() => onPick(item.query)}
              style={{ animationDelay: `${idx * 30}ms` }}
              className="shrink-0 rounded-full border border-white/10 bg-gradient-to-r from-white/5 to-white/2 px-4 py-2 text-xs font-medium text-zinc-300 transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 hover:text-white hover:scale-105 disabled:opacity-50 animate-in fade-in duration-300 group flex items-center gap-2 min-w-max"
            >
              <span className="text-sm">{badge.emoji}</span>
              {item.query}
              {item.value && (
                <span className={`text-xs font-semibold ${badge.color}`}>{item.value}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile: Card list */}
      <div className="md:hidden flex flex-col gap-2">
        {trends.map((item, idx) => {
          const badge = getTrendBadge(item.value);
          const barWidth = getBarWidth(item.value);
          return (
            <button
              key={item.query}
              type="button"
              disabled={busy}
              onClick={() => onPick(item.query)}
              style={{ animationDelay: `${idx * 30}ms` }}
              className="w-full rounded-lg border border-white/10 bg-gradient-to-r from-white/5 to-white/2 px-3 py-2.5 text-left transition-all active:scale-95 hover:border-white/20 disabled:opacity-50 animate-in fade-in duration-300 group"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm shrink-0">{badge.emoji}</span>
                  <p className="text-xs font-medium text-zinc-200 truncate">{item.query}</p>
                </div>
                {item.value && (
                  <span className={`text-xs font-bold shrink-0 ${badge.color}`}>{item.value}</span>
                )}
              </div>
              {item.value && (
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent)] to-orange-500 rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
