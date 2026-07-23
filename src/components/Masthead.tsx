"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** The sieve mark — a funnel narrowing a wide field to a few, echoing the app's whole idea. */
function SieveMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden className="text-accent">
      <path d="M3 5h20L15 14v6l-4 2v-8L3 5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export default function Masthead() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const sym = query.trim().toUpperCase();
    if (sym) router.push(`/stock/${sym}`);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <SieveMark />
          <div className="leading-none">
            <div className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-ink">
              Screen
            </div>
            <div className="mt-0.5 hidden text-[0.6875rem] text-ink-faint sm:block">
              Filter the market by the numbers
            </div>
          </div>
        </Link>

        <form onSubmit={submit} className="flex items-center gap-2" role="search">
          <input
            className="control w-32 uppercase sm:w-44"
            placeholder="Ticker…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Look up a ticker symbol"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <button
            type="submit"
            className="whitespace-nowrap rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-ink"
          >
            Look up
          </button>
        </form>
      </div>
    </header>
  );
}
