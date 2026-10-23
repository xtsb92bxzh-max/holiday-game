'use client';

import { ExternalLink as ExternalIcon, Info } from 'lucide-react';
import assumptions from '@/data/assumptions.json';
import { formatDate } from '@/lib/dates';

export function Provenance({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-start gap-1.5 text-xs leading-snug opacity-80 ${className}`}>
      <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Indicative prices for two, observed {formatDate(assumptions.pricesObservedOn)} 2026. Not live fares or guaranteed
        prices. Recheck before booking.
      </span>
    </p>
  );
}

export function ExternalLink({
  href,
  children,
  note,
  className = '',
}: {
  href?: string;
  children: React.ReactNode;
  note?: string;
  className?: string;
}) {
  if (!href) {
    return (
      <span className={`inline-flex items-center gap-1 text-sm opacity-60 ${className}`}>
        {children}: no link recorded
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-current px-4 py-2 text-sm font-semibold hover:bg-current/10 ${className}`}
    >
      {children}
      <ExternalIcon aria-hidden className="size-3.5" />
      {note && <span className="sr-only"> ({note})</span>}
    </a>
  );
}

export function HostLine({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-serif text-lg italic leading-snug text-gold sm:text-xl ${className}`}>
      <span aria-hidden>“</span>
      {children}
      <span aria-hidden>”</span>
    </p>
  );
}

export const btn = {
  primary:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red px-6 py-3 font-display text-base tracking-wide text-cream shadow-[0_5px_0_#7a1016] transition active:translate-y-1 active:shadow-[0_1px_0_#7a1016] hover:bg-[#e83540] disabled:opacity-50',
  gold:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-mustard px-6 py-3 font-display text-base tracking-wide text-ink shadow-[0_5px_0_#9a6b00] transition active:translate-y-1 active:shadow-[0_1px_0_#9a6b00] hover:bg-gold disabled:opacity-50',
  ghost:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-cream/40 px-4 py-2 text-sm font-semibold text-cream transition hover:border-cream hover:bg-cream/10 disabled:opacity-40',
  icon: 'inline-flex size-11 items-center justify-center rounded-full border-2 border-cream/30 text-cream transition hover:border-gold hover:text-gold disabled:opacity-40',
};
