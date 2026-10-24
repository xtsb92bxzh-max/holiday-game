'use client';

import Link from 'next/link';
import assumptions from '@/data/assumptions.json';
import { Shell } from './Chrome';
import { btn } from './ui';

export default function AboutScreen() {
  return (
    <Shell>
      <article className="mx-auto max-w-2xl space-y-6 px-4 py-8 leading-relaxed sm:py-12">
        <Link href="/getaway-show" className={btn.link}>
          ← Back to the show
        </Link>
        <h1 className="gb-wordmark text-4xl sm:text-5xl">What do these prices include?</h1>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-gb-gold">The big number</h2>
          <p>It is an estimated total for both of you. It covers return flights for two and one shared room for the whole stay.</p>
          <p>It also includes the source’s illustrative allowance for baggage and ground transfers, usually £100 for the two of you. It is never added twice.</p>
          <p>It does not cover meals, entertainment, sightseeing or getting to Glasgow or Edinburgh airport. It is not a holiday budget.</p>
          <p>Studio placards round to whole pounds. Detail panels show the exact figure.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-gb-gold">How old the prices are</h2>
          <p>
            The research was recorded around 23 October 2026 in {assumptions.sourceWorkbook}. Many fares were indexed dated quotes rather than rechecked
            live inventory.
          </p>
          <p>None of these are current, live, guaranteed, held or confirmed bookable. Recheck every price and time before you book.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-gb-gold">Priced and unpriced trips</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Indicative price: a dated fare and a room quote for these dates. Only these have a total and play in the price round.</li>
            <li>
              Flights unpriced: a timetable and a room quote exist, but no return fare was found. The total is unknown. The room is shown on its own. These
              appear as wildcards.
            </li>
            <li>Connections to verify: a room quote but no established flights. These appear in the table only.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-gb-gold">Flight evidence</h2>
          <p>
            Each trip keeps the source’s wording, such as “Direct; times not reconfirmed” or “Connecting; times not reconfirmed”. A timetable is not a
            seat. Flight times are shown only where the source recorded them.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-gb-gold">The links</h2>
          <p>
            Flight links go to a general search page, a route page or an airport timetable. None opens the exact fare. Room links open the property with
            your dates filled in where the source recorded them. Nothing is reserved.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-gb-gold">The games</h2>
          <p>Picture guesses, price duels and the dartboard are for fun. They never eliminate a destination or choose a winner. Your votes and your final choice do that.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-gb-gold">Your data</h2>
          <p>Names, votes and choices are saved in this browser only. Nothing is sent anywhere, and nothing syncs between phones.</p>
        </section>
      </article>
    </Shell>
  );
}
