"use client";

import * as React from "react";
import { animate, motion, useMotionValue } from "framer-motion";

type FullpageProps = {
  pages: React.ReactNode[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  locked?: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function Fullpage({ pages, initialIndex = 0, onIndexChange, locked = false }: FullpageProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = React.useState(() => clamp(initialIndex, 0, pages.length - 1));
  const [vh, setVh] = React.useState(0);

  const y = useMotionValue(0);
  const lockedRef = React.useRef(false);
  const wheelAccRef = React.useRef(0);
  const touchRef = React.useRef<{ startY: number; lastY: number; active: boolean } | null>(
    null,
  );

  // 同步外部 initialIndex 变化
  React.useEffect(() => {
    const clamped = clamp(initialIndex, 0, pages.length - 1);
    if (clamped !== index) {
      setIndex(clamped);
    }
  }, [initialIndex, pages.length]);

  React.useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  React.useEffect(() => {
    const nextY = -index * vh;
    const controls = animate(y, nextY, {
      type: "spring",
      stiffness: 170,
      damping: 20,
      mass: 0.9,
    });
    onIndexChange?.(index);
    return () => controls.stop();
  }, [index, onIndexChange, vh, y]);

  const go = React.useCallback(
    (dir: -1 | 1) => {
      if (locked) return;
      if (lockedRef.current) return;
      lockedRef.current = true;

      setIndex((prev) => clamp(prev + dir, 0, pages.length - 1));

      // A short lock avoids accidental fast multi-page jumps on trackpads.
      window.setTimeout(() => {
        lockedRef.current = false;
      }, 520);
    },
    [pages.length, locked],
  );

  const onWheel = React.useCallback(
    (e: React.WheelEvent) => {
      // Let the user scroll naturally inside nested scroll containers.
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-scrollable]")) return;

      wheelAccRef.current += e.deltaY;

      const threshold = 65;
      if (wheelAccRef.current > threshold) {
        wheelAccRef.current = 0;
        go(1);
      } else if (wheelAccRef.current < -threshold) {
        wheelAccRef.current = 0;
        go(-1);
      }
    },
    [go],
  );

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
    },
    [go],
  );

  const onTouchStart = React.useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchRef.current = { startY: t.clientY, lastY: t.clientY, active: true };
  }, []);

  const onTouchMove = React.useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t || !touchRef.current?.active) return;
    touchRef.current.lastY = t.clientY;
  }, []);

  const onTouchEnd = React.useCallback(() => {
    const r = touchRef.current;
    if (!r) return;

    const dy = r.startY - r.lastY;
    const threshold = 42;
    if (dy > threshold) go(1);
    if (dy < -threshold) go(-1);

    touchRef.current = null;
  }, [go]);

  return (
    <div
      ref={containerRef}
      className="relative h-[100svh] w-full overflow-hidden"
      onWheel={onWheel}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
      aria-label="GitHub Recap 全屏翻页"
    >
      {/* background */}
      <div className="pointer-events-none absolute inset-0 cyber-surface" />
      <div className="pointer-events-none absolute inset-0 cyber-grid" />
      <div className="pointer-events-none absolute inset-0 cyber-scanlines" />
      <div className="pointer-events-none absolute inset-0 cyber-noise" />

      <motion.div style={{ y }} className="relative h-full w-full">
        {pages.map((p, i) => (
          <section
            key={i}
            className="relative flex h-[100svh] w-full items-center justify-center overflow-y-auto overflow-x-hidden px-3 py-6 sm:px-10 sm:py-10"
          >
            <div className="w-full max-w-5xl" data-scrollable>{p}</div>
          </section>
        ))}
      </motion.div>
    </div>
  );
}
