'use client';

import { CalendarDays } from 'lucide-react';
import type { Destination, Itinerary } from '@/lib/types';
import { itinerariesFor, hasPrice, evidenceLabel } from '@/lib/catalogue';
import { formatDateRange } from '@/lib/dates';
import { formatGBP } from '@/lib/pricing';

/** Date / airport variants for one destination. Choosing one resets the guess for that destination. */
export default function ItineraryPicker({
  destination,
  selected,
  onChoose,
  tone = 'dark',
  showPrices = false,
}: {
  destination: Destination;
  selected: Itinerary;
  onChoose: (id: string) => void;
  tone?: 'dark' | 'light';
  showPrices?: boolean;
}) {
  const options = itinerariesFor(destination);
  if (options.length < 2) return null;
  const base = tone === 'dark' ? 'border-cream/30 text-cream' : 'border-ink/25 text-ink';
  const on = tone === 'dark' ? 'border-gold bg-gold text-ink' : 'border-cobalt bg-cobalt text-white';
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-80">
        <CalendarDays aria-hidden className="size-4" /> Choose your dates
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.id === selected.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChoose(o.id)}
              aria-pressed={active}
              className={`min-h-11 rounded-lg border-2 px-3 py-1.5 text-left text-sm leading-tight transition ${active ? on : base}`}
            >
              <span className="block font-semibold">
                {o.nights} nights · {formatDateRange(o.departDate, o.returnDate)}
              </span>
              <span className="block text-xs opacity-80">
                {o.departureAirport} → {o.arrivalAirport}
                {showPrices ? ` · ${hasPrice(o) ? formatGBP(o.estimatedTotalForTwoGBP) : evidenceLabel[o.fareEvidence]}` : !hasPrice(o) ? ` · ${evidenceLabel[o.fareEvidence]}` : ''}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
