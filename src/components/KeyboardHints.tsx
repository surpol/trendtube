"use client";

import { useState } from "react";

export function KeyboardHints() {
  const [show, setShow] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={() => setShow(!show)}
        className="rounded-full w-10 h-10 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-lg border border-white/10"
        title="Keyboard shortcuts"
      >
        ⌨
      </button>

      {show && (
        <div className="absolute bottom-14 right-0 bg-zinc-900/95 border border-white/10 rounded-xl p-4 shadow-lg backdrop-blur-sm w-56 text-sm animate-in fade-in duration-300">
          <p className="font-semibold text-zinc-200 mb-3">Keyboard Shortcuts</p>
          <ul className="space-y-2 text-zinc-400 text-xs">
            <li className="flex justify-between gap-3">
              <span>↑ ↓</span>
              <span className="text-right">Navigate results</span>
            </li>
            <li className="flex justify-between gap-3">
              <span>Enter</span>
              <span className="text-right">Search selected</span>
            </li>
            <li className="flex justify-between gap-3">
              <span>Esc</span>
              <span className="text-right">Deselect</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
