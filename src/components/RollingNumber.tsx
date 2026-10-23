'use client';

import { motion } from 'motion/react';

/** Odometer-style digits that roll into place. Renders plain text under reduced motion. */
export default function RollingNumber({ value, reduceMotion, className = '' }: { value: number; reduceMotion: boolean; className?: string }) {
  const text = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value);
  if (reduceMotion) return <span className={className}>£{text}</span>;
  let digitIndex = 0;
  return (
    <span className={`inline-flex items-baseline ${className}`} aria-label={`£${text}`}>
      <span aria-hidden>£</span>
      {text.split('').map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={i} aria-hidden>
              {ch}
            </span>
          );
        }
        const d = Number(ch);
        const order = digitIndex++;
        return (
          <span key={i} aria-hidden className="relative inline-block h-[1em] overflow-hidden leading-none" style={{ width: '0.72em' }}>
            <motion.span
              className="absolute left-0 top-0 flex flex-col"
              initial={{ y: '0em' }}
              animate={{ y: `-${(d + 20) * 1}em` }}
              transition={{ duration: 1.4 + order * 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {Array.from({ length: 30 }).map((_, k) => (
                <span key={k} className="block h-[1em] text-center leading-none">
                  {k % 10}
                </span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
