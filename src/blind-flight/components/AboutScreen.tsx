'use client';

import Link from 'next/link';
import assumptions from '@/data/assumptions.json';
import { Shell } from './Chrome';
import { btn } from './ui';

export default function AboutScreen() {
  return (
    <Shell>
      <article className="mx-auto max-w-2xl space-y-6 px-4 py-8 leading-relaxed sm:py-12">
        <Link href="/blind-flight/show" className={btn.link}>
          ← Back to the show
        </Link>
        <h1 className="bf-logo text-4xl">About these prices</h1>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-bf-custard">What the big number means</h2>
          <p>It is an estimated total for both of you. It covers return flights for two, one shared room, and an illustrative allowance for extras.</p>
          <p>
            The extras are £{assumptions.baggagePerAdultGBP} baggage per person and £{assumptions.transfersForTwoGBP} transfers for the two of you.
          </p>
          <p>It does not cover food, sightseeing, local spending or getting to Glasgow or Edinburgh airport.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-bf-custard">How old the prices are</h2>
          <p>
            The research was compiled on 23 October 2026 in {assumptions.sourceWorkbook}. Some fares were earlier indexed quotes rather than
            reconfirmed live availability.
          </p>
          <p>None of these are live fares, guaranteed prices or bookable inventory. Recheck every price and time before you book.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-bf-custard">The three price statuses</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Indicative price: a dated fare and a room quote for these exact dates. Only these have a total.</li>
            <li>Price pending: a flight timetable and a room quote exist, but no return fare has been matched. The room quote is shown on its own.</li>
            <li>Needs manual review: a room quote exists, but no flights were established. These appear in the holiday list only.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-bf-custard">The links</h2>
          <p>
            Flight links go to a general search page, a route page or an airport timetable. None of them opens the exact fare. Room links open the
            property on Booking.com with your dates filled in.
          </p>
        </section>

      </article>
    </Shell>
  );
}
