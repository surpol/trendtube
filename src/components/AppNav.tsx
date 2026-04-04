import Link from "next/link";

export function AppNav() {
  return (
    <header className="border-b border-white/10 bg-[var(--surface)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-white"
        >
          TrendTube
        </Link>
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/" className="text-zinc-200 hover:text-white">
            Discover
          </Link>
        </nav>
      </div>
    </header>
  );
}
