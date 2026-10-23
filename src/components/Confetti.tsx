'use client';

import { motion } from 'motion/react';
import { useMemo } from 'react';

const colours = ['#ffd560', '#d8232e', '#4f78ff', '#fff5df', '#f0b429'];

export default function Confetti({ burstKey }: { burstKey: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }).map((_, i) => ({
        id: `${burstKey}-${i}`,
        x: (Math.random() - 0.5) * 520,
        y: -Math.random() * 280 - 80,
        r: Math.random() * 720 - 360,
        c: colours[i % colours.length],
        w: 6 + Math.random() * 6,
        delay: Math.random() * 0.15,
      })),
    [burstKey],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 block"
          style={{ width: p.w, height: p.w * 0.45, background: p.c, borderRadius: 1 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 420], opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: 2.2, delay: p.delay, ease: 'easeOut', times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}
