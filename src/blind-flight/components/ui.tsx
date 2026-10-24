'use client';

import { ExternalLink as ExternalIcon, Heart, Info } from 'lucide-react';
import Link from 'next/link';
import assumptions from '@/data/assumptions.json';
import { formatDate } from '@/lib/dates';
import type { Itinerary } from '@/lib/types';

export const btn = {
  primary:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-bf-red px-6 py-3 bf-display text-lg text-bf-cream shadow-[0_5px_0_#6e1c22] transition hover:bg-[#c73d42] active:translate-y-1 active:shadow-[0_1px_0_#6e1c22] disabled:opacity-50 disabled:active:translate-y-0',
  gold: 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-bf-custard px-6 py-3 bf-display text-lg text-bf-ink shadow-[0_5px_0_#a5801f] transition hover:bg-[#f7d679] active:translate-y-1 active:shadow-[0_1px_0_#a5801f] disabled:opacity-50',
  sea: 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-bf-seafoam px-5 py-3 font-bold text-bf-ink shadow-[0_4px_0_#2a8a83] transition hover:bg-[#6ad8d0] active:translate-y-1 active:shadow-[0_1px_0_#2a8a83] disabled:opacity-50',
  ghost:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-bf-cream/40 px-4 py-2 text-sm font-semibold text-bf-cream transition hover:border-bf-cream hover:bg-bf-cream/10 disabled:opacity-40',
  ghostInk:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-bf-ink/30 px-4 py-2 text-sm font-semibold text-bf-ink transition hover:border-bf-ink hover:bg-bf-ink/5 disabled:opacity-40',
  link: 'inline-flex min-h-11 items-center text-sm text-bf-cream/80 underline decoration-dotted underline-offset-4 hover:text-bf-cream',
};

/** A presenter caption in the style of a lower-third. */
export function LowerThird({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex max-w-full items-stretch overflow-hidden rounded-lg shadow-lg ${className}`}>
      <span className="flex shrink-0 items-center bg-bf-seafoam px-3 py-2 text-xs font-bold uppercase tracking-widest text-bf-ink">
        {label}
      </span>
      <p className="bf-paper min-w-0 px-3 py-2 font-serif text-sm italic leading-snug sm:text-base">{children}</p>
    </div>
  );
}

export function HostSays({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-serif text-lg italic leading-snug text-bf-custard sm:text-xl ${className}`}>
      <span aria-hidden>“</span>
      {children}
      <span aria-hidden>”</span>
    </p>
  );
}

/** "Ben chose this one." Shown only once a choice is public. */
export function PickChip({ who, className = '' }: { who: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-bf-red px-2.5 py-0.5 text-xs font-bold text-bf-cream ${className}`}>
      <Heart aria-hidden className="size-3.5 fill-current" />
      {who}
    </span>
  );
}

export function Provenance({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-start gap-1.5 text-xs leading-snug opacity-85 ${className}`}>
      <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Indicative estimate for two, compiled {formatDate(assumptions.pricesObservedOn)} 2026. Not a live fare or a guaranteed price.{' '}
        <Link href="/blind-flight/about" className="underline underline-offset-2">
          About these prices
        </Link>
      </span>
    </p>
  );
}

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'external site';
  }
}

/** Honest labels for the workbook's links. A missing link stays missing. */
export function flightLinkLabel(it: Itinerary): string | undefined {
  if (!it.flightSourceUrl) return undefined;
  const h = host(it.flightSourceUrl);
  switch (it.flightLinkKind) {
    case 'route_page':
      return `Route page on ${h} (check these dates there)`;
    case 'timetable':
      return `Timetable on ${h} (schedule only, no fare)`;
    default:
      return `General flight search on ${h} (not this exact fare)`;
  }
}

export function roomLinkLabel(it: Itinerary): string | undefined {
  if (!it.roomSourceUrl) return undefined;
  const dated = /checkin=/.test(it.roomSourceUrl);
  return `Room on ${host(it.roomSourceUrl)}${dated ? ' for these dates' : ''}`;
}

export function OutLink({ href, children, ink = false }: { href?: string; children: React.ReactNode; ink?: boolean }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-left text-sm font-semibold leading-tight transition ${
        ink ? 'border-bf-ink/30 text-bf-ink hover:border-bf-ink' : 'border-bf-cream/40 text-bf-cream hover:border-bf-cream'
      }`}
    >
      <span>{children}</span>
      <ExternalIcon aria-hidden className="size-3.5 shrink-0" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function TripLinks({ it, ink = false }: { it: Itinerary; ink?: boolean }) {
  const f = flightLinkLabel(it);
  const r = roomLinkLabel(it);
  if (!f && !r) return <p className="text-sm opacity-75">No source links recorded for this trip.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {f && (
        <OutLink href={it.flightSourceUrl} ink={ink}>
          {f}
        </OutLink>
      )}
      {!f && <p className="text-sm opacity-75">No flight link recorded.</p>}
      {r && (
        <OutLink href={it.roomSourceUrl} ink={ink}>
          {r}
        </OutLink>
      )}
    </div>
  );
}
