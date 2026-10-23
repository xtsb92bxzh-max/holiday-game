'use client';

import Image from 'next/image';
import { useState } from 'react';
import credits from '@/data/imageCredits.json';
import type { ImageCredit } from '@/lib/types';

const palette = [
  ['#1d3fc4', '#d8232e'],
  ['#0b1452', '#f0b429'],
  ['#9e1520', '#ffd560'],
  ['#2f8f5b', '#1d3fc4'],
  ['#d8232e', '#f0b429'],
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Destination photograph with an intentional poster-style fallback when no image exists. */
export default function Photo({
  src,
  name,
  country,
  className = '',
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  showCredit = false,
  eager = false,
}: {
  src?: string;
  name: string;
  country?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  showCredit?: boolean;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const key = src?.split('/').pop()?.replace(/\.\w+$/, '');
  const credit = key ? (credits as Record<string, ImageCredit>)[key] : undefined;
  const [a, b] = palette[hash(name) % palette.length];

  if (!src || failed) {
    return (
      <div
        className={`relative grid place-items-center overflow-hidden ${className}`}
        style={{ background: `radial-gradient(circle at 30% 20%, ${b}cc, transparent 60%), linear-gradient(135deg, ${a}, #070d3a)` }}
        role="img"
        aria-label={`${name} (illustration)`}
      >
        <div className="sparkle absolute inset-0 opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[repeating-linear-gradient(90deg,#ffffff14_0_10px,transparent_10px_22px)]" />
        <div className="relative px-4 text-center">
          <p className="marquee-text text-3xl sm:text-4xl">{name}</p>
          {country && <p className="mt-1 font-serif text-sm italic text-cream/80">{country}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-royal ${className}`}>
      <Image
        src={src}
        alt={`${name}${country ? `, ${country}` : ''}`}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : eager ? 'eager' : 'lazy'}
        className="object-cover"
        onError={() => setFailed(true)}
      />
      {showCredit && credit && (
        <a
          href={credit.sourcePage}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 right-1 max-w-[80%] truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] leading-tight text-white/85 hover:text-white"
        >
          Photo: {credit.author || 'Wikimedia Commons'} · {credit.license}
        </a>
      )}
    </div>
  );
}
