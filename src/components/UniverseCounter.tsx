"use client";

import { useEffect, useRef, useState } from "react";

/** Animates a number toward its target, snapping instantly under reduced-motion. */
function useCountUp(target: number, duration = 500): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  return value;
}

type Props = {
  matches: number;
  universe: number;
  sortLabel: string;
  loading: boolean;
};

export default function UniverseCounter({ matches, universe, sortLabel, loading }: Props) {
  const shown = useCountUp(matches);
  const pct = universe > 0 ? Math.min(100, (matches / universe) * 100) : 0;

  return (
    <section
      aria-label="Screen summary"
      className="border-b border-line bg-surface"
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div
              className="tnum font-[family-name:var(--font-display)] text-[3.5rem] leading-[0.9] font-semibold text-ink sm:text-[4.5rem]"
              aria-live="polite"
            >
              {loading ? "···" : shown.toLocaleString("en-US")}
            </div>
            <div className="mb-1.5">
              <div className="eyebrow">Passing your screen</div>
              <div className="mt-1 text-sm text-ink-soft">
                of{" "}
                <span className="tnum text-ink">{universe.toLocaleString("en-US")}</span>{" "}
                listings in the pool
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-ink-faint">
            <span className="eyebrow">Sorted by</span>
            <div className="mt-1 font-[family-name:var(--font-mono)] text-ink-soft">{sortLabel}</div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="sieve-track flex-1" role="presentation">
            <div className="sieve-fill" style={{ width: `${loading ? 100 : pct}%` }} />
          </div>
          <span className="tnum w-14 text-right text-xs text-ink-faint">
            {loading ? "—" : `${pct.toFixed(0)}%`}
          </span>
        </div>
      </div>
    </section>
  );
}
