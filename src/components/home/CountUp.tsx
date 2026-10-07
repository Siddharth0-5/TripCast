/**
 * CountUp: animates a number from 0 on mount. Renders the final value on the
 * server so there is no flash when JS is slow or motion is reduced.
 */
"use client";

import { useEffect, useState } from "react";

export function CountUp({ to, duration = 1200, delay = 500 }: { to: number; duration?: number; delay?: number }) {
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(eased * to * 10) / 10); // keep one decimal, e.g. 8.2
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration, delay]);

  return <>{value}</>;
}
