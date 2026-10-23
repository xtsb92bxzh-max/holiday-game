'use client';

import credits from '@/data/imageCredits.json';
import assumptions from '@/data/assumptions.json';
import type { ImageCredit } from '@/lib/types';
import { destinationById } from '@/lib/catalogue';
import { useGame } from './GameContext';

export default function Footer() {
  const { dispatch } = useGame();
  return (
    <footer className="border-t border-cream/10 bg-black/30 px-4 py-8 text-xs text-cream/60">
      <div className="mx-auto max-w-6xl space-y-3">
        <p className="break-words">
          Source: {assumptions.sourceWorkbook}. Prices observed {assumptions.pricesObservedOn}. Totals for two include return
          flights, one shared room, £{assumptions.baggagePerAdultGBP} baggage per person and £
          {assumptions.transfersForTwoGBP} transfers. Food, attractions and travel to the UK airport are excluded.
        </p>
        <p>An original parody of Saturday-night game shows. No affiliation with any programme, broadcaster or airline.</p>
        <details>
          <summary className="cursor-pointer py-2 text-cream/80">Photo credits (Wikimedia Commons)</summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {Object.entries(credits as Record<string, ImageCredit>).map(([key, c]) => (
              <li key={key}>
                <span className="text-cream/80">{destinationById[key]?.name ?? key}:</span>{' '}
                <a className="underline" href={c.sourcePage} target="_blank" rel="noopener noreferrer">
                  {c.author || 'Unknown author'}
                </a>
                ,{' '}
                {c.licenseUrl ? (
                  <a className="underline" href={c.licenseUrl} target="_blank" rel="noopener noreferrer">
                    {c.license}
                  </a>
                ) : (
                  c.license
                )}
              </li>
            ))}
          </ul>
        </details>
        <button
          className="min-h-11 underline decoration-dotted underline-offset-4 hover:text-cream"
          onClick={() => {
            if (window.confirm('Clear all guesses, decisions and scores and start again?')) dispatch({ type: 'reset' });
          }}
        >
          Reset the whole show
        </button>
      </div>
    </footer>
  );
}
