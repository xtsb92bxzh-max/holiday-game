# The Great January Getaway

A game-show front end for choosing a January 2027 European break for two. The data comes from a researched spreadsheet. The site presents it as a tongue-in-cheek Saturday-night TV show. You finish with a ranked shortlist that you can export.

The show has four rounds: a prize conveyor belt, guess the price, Keep / Maybe / Bin, and a Grand Final comparison. Sensible mode is a plain searchable list for when you come back to book.

All prices are indicative totals for two, observed on 23 October 2026. They are not live fares. Every price and link needs rechecking before you book.

## Games on this site

The home page (`/`) lists every game. The January Getaway lives at `/january-getaway`.

To add a game, give it its own folder under `src/app/` and add an entry to `src/lib/games.ts`. Set `comingSoon: true` to show it on the home page before it is playable.

## Running it locally

You will need Node 20 or later.

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # data and logic checks
npm run typecheck
npm run build        # production build, as Vercel runs it
```

## Where the data lives

| File | What it holds | How it changes |
|---|---|---|
| `data/source/January_2027_Europe_Holidays_Updated_Flexible_Flight_Times.xlsx` | The authoritative workbook | Replace it with a newer version |
| `src/data/assumptions.json` | Baggage per adult, transfers for two, observation date, travel window | Edit by hand |
| `src/data/itineraries.json` | Every flight-and-room combination, normalised | **Generated** by `npm run import-data`. Do not edit by hand |
| `src/data/destinations.ts` | Intros, highlights, cautions, typical January weather, photo paths, and which destinations appear in the show | Edit by hand |
| `src/data/imageCredits.json` | Photographer and licence for each photo | Edit when you change a photo |
| `public/images/destinations/` | Destination photographs (Wikimedia Commons) | Add or replace JPEGs |

The importer reads two sheets:

- `Viable itineraries`: 20 priced trips and 25 scheduled but unpriced trips.
- `Connections to verify`: 16 destinations with a room quote but no established flights.

It recomputes each total as (fare per person × 2) + room + (baggage × 2) + transfers. It then checks the result against the workbook's own `With extras / two` column and warns about any mismatch. At present all 20 match to the penny.

A total is only produced when the workbook has a fare for those exact dates. Anything else has a null total. The site then shows "Flight price not verified" or "Needs manual review" and never borrows a price from another itinerary.

### Updating a price

1. Edit the fare or room cell in the workbook's `Viable itineraries` sheet, or drop in a new workbook with the same sheet layout.
2. Run `npm run import-data`.
3. Run `npm test`. One test asserts that the recomputed totals equal the workbook's totals, so it will flag an edit made in only one place.
4. Update `pricesObservedOn` in `src/data/assumptions.json` if the observation date has changed.

### Changing the extras assumptions

Edit `baggagePerAdultGBP` or `transfersForTwoGBP` in `src/data/assumptions.json`, then run `npm run import-data`. The importer will warn that totals now differ from the workbook. That is expected. The data test will also fail until the workbook column agrees, which stops the two sources drifting apart without anyone noticing.

### Changing who is in the show

Each entry in `src/data/destinations.ts` has a `role`:

- `main`: on the conveyor belt and in the price round. The default itinerary must be priced; a test enforces this.
- `mystery`: the bonus round. These have no matched fare, so the reveal says "Flight price awaiting confirmation".
- `extra`: Sensible mode only.

The order of `main` entries is the order of the belt. A destination with several date or airport options gets one card with a date picker, not separate cards. Itineraries are attached automatically by `destinationId`. `preferredItineraryId` pins which one shows first; otherwise the cheapest priced option is used.

To add a destination, add a mapping in `DESTINATION_IDS` in `scripts/import-holiday-data.ts`, add an entry to `destinations.ts`, and rerun the importer.

### Photos

Photos come from Wikimedia Commons under CC BY, CC BY-SA or CC0 licences. Credits are shown on each photo and listed in the site footer. If a photo is missing or fails to load, the card shows a designed poster-style fallback instead.

## Deploying to Vercel

The app is a standard Next.js 15 App Router project. It needs no environment variables, database or API keys.

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project**, then import the GitHub repository.
3. Accept the detected Next.js settings and deploy.
4. Every pull request then gets a preview URL. The production branch deploys to the main URL.

## Saved progress

Guesses, decisions, the chosen dates, contestant names and settings are saved in the browser's `localStorage`. Nothing leaves the device. Progress survives a refresh but does not sync between phones. Use **Reset the whole show** in the footer to start again.

## Accessibility and motion

- Sound is off by default and is synthesised in the browser. No audio files are used.
- The belt respects the device's reduced-motion setting, and the sparkle button in the header overrides it either way. With reduced motion the belt does not run on its own, and you move through it with the arrow buttons or the arrow keys.
- All controls are buttons or form fields reachable by keyboard, with visible focus rings and 44 px touch targets.

## Known limitations

- Flight links in the workbook are mostly generic Skyscanner, Expedia route or FlightsFrom timetable pages, not dated deep links. The site labels them as such.
- Several priced fares were indexed or detailed quotes, not reconfirmed live availability. Flight times for most priced options were not recorded.
- Weather lines describe typical January climate from general knowledge. They are not forecasts.
- Points in the price round are entertainment only and do not rank the holidays.
- Independent voting on two phones, live fares and shared links are not built. They are listed as phase 2 in `docs/BUILD_BRIEF.md`.
