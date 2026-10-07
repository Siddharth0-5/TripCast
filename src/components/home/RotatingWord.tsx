/**
 * RotatingWord: cycles through words with a vertical slide. All words share
 * one grid cell, so the box keeps the width of the longest word and the
 * headline doesn't reflow. Hidden from screen readers; the page provides a
 * plain-text alternative.
 */
"use client";

import { useEffect, useState } from "react";

export function RotatingWord({ words, every = 2200 }: { words: string[]; every?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setCurrent((i) => (i + 1) % words.length), every);
    return () => clearInterval(timer);
  }, [words.length, every]);

  return (
    <span className="relative inline-grid overflow-hidden pb-[0.1em] align-bottom" aria-hidden>
      {words.map((word, i) => {
        const place = i === current ? "translate-y-0 opacity-100" : i < current ? "-translate-y-full opacity-0" : "translate-y-full opacity-0";
        return (
          <span
            key={word}
            className={`whitespace-nowrap text-forest transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] [grid-area:1/1] ${place}`}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}
