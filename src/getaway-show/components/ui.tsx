'use client';

import Link from 'next/link';
import { ExternalLink as ExternalIcon, Info, ShieldAlert } from 'lucide-react';
import Photo from '@/components/Photo';
import assumptions from '@/data/assumptions.json';
import { destinationById, evidenceLabel, routeLabel } from '@/lib/catalogue';
import { formatDate, formatDateRange } from '@/lib/dates';
import { formatGBP } from '@/lib/pricing';
import type { Itinerary } from '@/lib/types';
import { contestants } from '../data/contestants';
import { copy } from '../data/copy';
import { catchesFor, variantsFor } from '../lib/cast';
import { costBreakdown } from '../lib/cost';
import { nameOf, players, studioPoints, type StudioPoints } from '../lib/state';
import { useShow } from './ShowProvider';

export const btn = {
  primary:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gb-tomato px-6 py-3 gb-display text-xl text-gb-paper shadow-[0_5px_0_#7a2f24] transition hover:bg-[#d65f4d] active:translate-y-1 active:shadow-[0_1px_0_#7a2f24] disabled:opacity-50 disabled:active:translate-y-0',
  gold: 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gb-gold px-6 py-3 gb-display text-xl text-gb-black shadow-[0_5px_0_#9c7a22] transition hover:bg-[#f7d274] active:translate-y-1 active:shadow-[0_1px_0_#9c7a22] disabled:opacity-50',
  teal: 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gb-teal px-5 py-3 gb-display text-lg text-gb-paper shadow-[0_4px_0_#0d3d41] transition hover:bg-[#1f7f87] active:translate-y-1 active:shadow-[0_1px_0_#0d3d41] disabled:opacity-50',
  ghost:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-gb-paper/40 px-4 py-2 text-sm font-semibold text-gb-paper transition hover:border-gb-paper hover:bg-gb-paper/10 disabled:opacity-40',
  ghostInk:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-gb-black/30 px-4 py-2 text-sm font-semibold text-gb-black transition hover:border-gb-black hover:bg-gb-black/5 disabled:opacity-40',
  link: 'inline-flex min-h-11 items-center text-sm text-gb-paper/85 underline decoration-dotted underline-offset-4 hover:text-gb-paper',
  linkInk: 'inline-flex min-h-11 items-center text-sm text-gb-black underline decoration-dotted underline-offset-4',
};

export function HostLine({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-serif text-lg italic leading-snug text-gb-gold sm:text-xl ${className}`}>
      <span aria-hidden>“</span>
      {children}
      <span aria-hidden>”</span>
    </p>
  );
}

export function RoundHeading({ number, title, children }: { number?: number; title: string; children?: React.ReactNode }) {
  return (
    <header className="space-y-2">
      {number != null && <p className="text-xs font-bold uppercase tracking-[0.25em] text-gb-gold">Round {number}</p>}
      <h1 className="gb-wordmark text-4xl sm:text-6xl">{title}</h1>
      {children}
    </header>
  );
}

export function NoInfluence({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-block rounded bg-gb-black px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-gb-gold ${className}`}>
      {copy.noInfluence}
    </span>
  );
}

/** Each traveller's studio points for one round, or in total. */
export function StudioScores({ part, className = '' }: { part: keyof StudioPoints; className?: string }) {
  const { state } = useShow();
  const points = studioPoints(state);
  return (
    <p className={`text-sm ${className}`}>
      Studio points:{' '}
      {players(state).map((p, i) => (
        <span key={p}>
          {i > 0 && ' · '}
          {state.mode === 'quick' ? 'You' : nameOf(state, p)} <strong className="tabular-nums">{points[p][part]}</strong>
        </span>
      ))}{' '}
      <NoInfluence className="ml-1 align-middle" />
    </p>
  );
}

/** The caveat that sits beside every price. */
export function SourceStatus({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-start gap-1.5 text-xs leading-snug opacity-85 ${className}`}>
      <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Estimated for two · as researched {formatDate(assumptions.pricesObservedOn)} 2026. Not a live fare or a guaranteed price.{' '}
        <Link href="/getaway-show/about" className="underline underline-offset-2">
          What do these prices include?
        </Link>
      </span>
    </p>
  );
}

/** Total for two and per person, or an honest unknown. */
export function EstimatedPrice({ it, size = 'md', ink = true }: { it: Itinerary; size?: 'md' | 'lg'; ink?: boolean }) {
  const c = costBreakdown(it);
  if (!c) {
    return (
      <div>
        <p className={`gb-display ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>Total unknown</p>
        <p className="text-sm">Flights unpriced — total unknown.</p>
        <p className="text-sm opacity-80">
          Room only: {it.roomForTwoGBP != null ? `${formatGBP(it.roomForTwoGBP, { pence: true })} for two, ${it.nights} nights` : 'no quote recorded'}
        </p>
      </div>
    );
  }
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-widest ${ink ? 'text-gb-teal' : 'text-gb-gold'}`}>Estimated total for two</p>
      <p className={`gb-display tabular-nums ${size === 'lg' ? 'text-5xl' : 'text-3xl'}`}>{formatGBP(c.totalForTwo, { pence: true })}</p>
      <p className="text-sm">{formatGBP(c.perPerson, { pence: true })} per person</p>
    </div>
  );
}

export function PriceBreakdown({ it, ink = true }: { it: Itinerary; ink?: boolean }) {
  const c = costBreakdown(it);
  if (!c) return null;
  const rows: [string, string, string?][] = [
    ['Return flights ×2', formatGBP(c.flightsForTwo, { pence: true }), `${formatGBP(c.flightsPerPerson, { pence: true })} per adult`],
    ['Accommodation, whole stay', formatGBP(c.roomForTwo, { pence: true }), `${it.nights} nights, one room for two${it.hotelName ? ` · ${it.hotelName}` : ''}`],
    ['Illustrative extras', formatGBP(c.extrasForTwo, { pence: true }), 'Baggage and ground transfer allowance from the source'],
    ['Estimated total for two', formatGBP(c.totalForTwo, { pence: true }), `${formatGBP(c.perPerson, { pence: true })} per person`],
  ];
  return (
    <div className="space-y-2 text-sm">
      <dl className={`divide-y ${ink ? 'divide-gb-black/10' : 'divide-gb-paper/15'}`}>
        {rows.map(([k, v, note], i) => (
          <div key={k} className={`flex items-baseline justify-between gap-3 py-2 ${i === rows.length - 1 ? 'font-bold' : ''}`}>
            <dt>
              {k}
              {note && <span className="block text-xs font-normal opacity-75">{note}</span>}
            </dt>
            <dd className="shrink-0 tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs opacity-80">
        {formatDateRange(it.departDate, it.returnDate)} 2027 · {it.departureAirport} → {it.arrivalAirport} · source: {it.fareSource}
      </p>
      <p className="text-xs opacity-80">Not included: meals, entertainment, sightseeing and getting to the UK airport.</p>
    </div>
  );
}

/** How solid the flight and fare evidence is, in the source's own words. */
export function EvidenceStatus({ it }: { it: Itinerary }) {
  return (
    <div className="flex flex-wrap gap-1.5 text-xs">
      <span className="rounded-full bg-gb-navy px-2.5 py-1 font-semibold text-gb-paper">{evidenceLabel[it.fareEvidence]}</span>
      <span className="rounded-full bg-gb-teal px-2.5 py-1 font-semibold text-gb-paper">{routeLabel[it.routeType]}</span>
      <span className="rounded-full border border-current/30 px-2.5 py-1">Source: {it.routeEvidence}</span>
    </div>
  );
}

export function TripFacts({ it }: { it: Itinerary }) {
  const t = it.flightTimes;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <div>
        <dt className="text-xs font-bold uppercase tracking-wider opacity-70">Dates</dt>
        <dd>
          {formatDateRange(it.departDate, it.returnDate)} 2027 · {it.nights} nights
        </dd>
      </div>
      <div>
        <dt className="text-xs font-bold uppercase tracking-wider opacity-70">Flying</dt>
        <dd>
          {it.departureAirport} → {it.arrivalAirport}
        </dd>
      </div>
      <div className="col-span-2">
        <dt className="text-xs font-bold uppercase tracking-wider opacity-70">Flight times</dt>
        <dd>
          {t && it.timesConfirmed
            ? `Out ${t.leaveUK} → ${t.arriveThere} · back ${t.leaveThere} → ${t.arriveUK} (from the uploaded timetable)`
            : 'Not yet reconfirmed'}
        </dd>
      </div>
      {it.hotelName && (
        <div className="col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wider opacity-70">Stay</dt>
          <dd>
            {it.hotelName}
            {it.hotelReviewOutOf10 != null && ` · ${it.hotelReviewOutOf10}/10`}
            {it.roomForTwoGBP != null && ` · ${formatGBP(it.roomForTwoGBP, { pence: true })} for the whole stay`}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function Catches({ id, it, title = 'The catch' }: { id: string; it?: Itinerary; title?: string }) {
  const list = catchesFor(id, it);
  if (list.length === 0) return null;
  return (
    <div className="rounded-xl border-2 border-gb-tomato/60 bg-gb-tomato/10 p-3 text-sm">
      <p className="flex items-center gap-1.5 font-bold text-gb-tomato">
        <ShieldAlert aria-hidden className="size-4" /> {title}
      </p>
      <ul className="mt-1 space-y-1">
        {list.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </div>
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
      return `Recheck flights: route page on ${h}`;
    case 'timetable':
      return `Recheck timings: timetable on ${h} (no fare)`;
    default:
      return `Recheck flights: general search on ${h}`;
  }
}

export function roomLinkLabel(it: Itinerary): string | undefined {
  if (!it.roomSourceUrl) return undefined;
  return `Recheck the room on ${host(it.roomSourceUrl)}${/checkin=/.test(it.roomSourceUrl) ? ' for these dates' : ''}`;
}

function OutLink({ href, children, ink }: { href: string; children: React.ReactNode; ink: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold leading-tight transition ${
        ink ? 'border-gb-black/30 text-gb-black hover:border-gb-black' : 'border-gb-paper/40 text-gb-paper hover:border-gb-paper'
      }`}
    >
      <span>{children}</span>
      <ExternalIcon aria-hidden className="size-3.5 shrink-0" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function TripLinks({ it, ink = true }: { it: Itinerary; ink?: boolean }) {
  const f = flightLinkLabel(it);
  const r = roomLinkLabel(it);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        {f && it.flightSourceUrl ? (
          <OutLink href={it.flightSourceUrl} ink={ink}>
            {f}
          </OutLink>
        ) : (
          <p className="text-sm opacity-75">No flight link recorded.</p>
        )}
        {r && it.roomSourceUrl && (
          <OutLink href={it.roomSourceUrl} ink={ink}>
            {r}
          </OutLink>
        )}
      </div>
      <p className="text-xs opacity-75">Links are for checking current prices and timings. Nothing is reserved or held.</p>
    </div>
  );
}

/** Date and airport switch. Shown only when a destination has more than one trip. */
export function VariantPicker({ id, ink = true }: { id: string; ink?: boolean }) {
  const { state, dispatch } = useShow();
  const variants = variantsFor(id);
  if (variants.length < 2) return null;
  const current = state.preferredItineraryIds[id] ?? destinationById[id]?.defaultItineraryId;
  return (
    <label className="block text-sm font-bold">
      Pick your dates
      <select
        value={variants.some((v) => v.id === current) ? current : variants[0].id}
        onChange={(e) => dispatch({ type: 'chooseItinerary', destinationId: id, itineraryId: e.target.value })}
        className={`mt-1 block min-h-11 w-full rounded-xl border-2 px-3 font-normal ${
          ink ? 'border-gb-black/20 bg-white text-gb-black' : 'border-gb-paper/30 bg-gb-black text-gb-paper'
        }`}
      >
        {variants.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nights} nights · {formatDateRange(v.departDate, v.returnDate)} · {v.departureAirport} → {v.arrivalAirport}
            {costBreakdown(v) ? '' : ' · total unknown'}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-xs font-normal opacity-75">Changing dates resets any price round this city is in. Votes stay.</span>
    </label>
  );
}

export function DestinationPhoto({
  id,
  className = '',
  sizes,
  priority,
}: {
  id: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const d = destinationById[id];
  const note = contestants[id]?.photoNote;
  return (
    <figure>
      <Photo src={d.imagePath} name={d.name} country={d.country} className={className} sizes={sizes} priority={priority} showCredit />
      {note && <figcaption className="mt-1 px-1 text-xs opacity-80">{note}</figcaption>}
    </figure>
  );
}
