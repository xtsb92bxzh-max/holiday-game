# Holiday Games

Two game-show front ends for choosing a January 2027 European break for two. Both read the same researched spreadsheet, so they always show the same prices.

- The Great January Getaway (`/january-getaway`) is a tongue-in-cheek Saturday-night prize show: conveyor belt, guess the price, Keep / Maybe / Bin and a Grand Final.
- Blind Flight (`/blind-flight`) is a retro dating-show parody. Each episode hides three destinations behind a screen. The host asks them questions, each traveller secretly picks one, and only then are they unmasked.

All prices are indicative totals for two, observed on 23 October 2026. They are not live fares. Every price and link needs rechecking before you book.

## Games on this site

The home page (`/`) lists every game. The January Getaway lives at `/january-getaway` and Blind Flight at `/blind-flight`.

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

## Blind Flight

The brief is in `docs/BLIND_FLIGHT_BUILD_BRIEF.md`.

### How a game runs

1. On the title screen you choose a two-person game (the default) or quick play, with optional nicknames.
2. The show has four episodes of three hidden contestants. You watch each episode together: every contestant gives a one-liner, then answers the host's three questions. Answer n is clue n from `profiles.ts`.
3. When the host calls time, Traveller 1 picks one contestant in secret and passes the phone. A full-screen cover hides the choice. Traveller 1 can change their mind until the phone is passed. Traveller 2 then picks from the same three.
4. The reveal unmasks the contestants nobody chose first, then anyone one of you chose, then a mutual choice. Each reveal card shows the photo, pitch, price and the awkward bit. Dates, flights, hotel, weather, links and the price breakdown sit behind "Full details".
5. The episode ends with It's a Match! (you both chose the same contestant) or a Split decision. Choose again clears the choices and keeps the contestants unmasked.
6. Results list the matches, the split decisions and everyone left on the podium. Anything can be reconsidered.
7. The grand final compares two to four finalists side by side. Matches go in first, then split decisions. You pick the winner yourselves. You can copy, share or download a CSV summary, which leaves out nicknames.

Quick play has one shared choice per episode and produces a shortlist, never a "match".

"I refuse to participate in this nonsense" opens Sensible mode at `/blind-flight/holidays`. It lists every itinerary in the travel window with filters for budget, nights, airport, trip type, price status and route.

### Routes

| Route | Screen |
|---|---|
| `/blind-flight` | Title screen and mode choice |
| `/blind-flight/show` | All episodes and their outcomes |
| `/blind-flight/episode/[id]` | One episode: questions, secret choices, handover and reveal |
| `/blind-flight/show/[id]` | One contestant's full profile, once their identity is public |
| `/blind-flight/results` | Matches and split decisions |
| `/blind-flight/compare` | Grand final comparison |
| `/blind-flight/contenders` | More eligible contenders to add as a bonus round |
| `/blind-flight/holidays` | Sensible mode |
| `/blind-flight/about` | About these prices |

Every route works on reload, with Back, and when opened directly. Pages that depend on the whole show say so until every episode is decided.

### Where things live

| File | What it holds |
|---|---|
| `src/blind-flight/data/profiles.ts` | Dating-show copy for each featured contestant: one-liner, three clues, pitch, awkward truth |
| `src/blind-flight/data/episodes.ts` | Episode titles, presenter lines and casts |
| `src/blind-flight/data/copy.ts` | Presenter copy bank and the host's three questions |
| `src/blind-flight/lib/cast.ts` | Which trips can appear, variants per destination, episodes and cautions |
| `src/blind-flight/lib/cost.ts` | Price breakdown and the joke guess badges |
| `src/blind-flight/lib/state.ts` | Game state, actions and selectors |
| `src/blind-flight/lib/persistence.ts` | Saving to `localStorage`, with a schema version and clean-up on load |

Facts are not duplicated. Names, countries, photos, highlights, typical weather and cautions come from `src/data/destinations.ts`. Prices, dates, flights, hotels and links come from `src/data/itineraries.json`. Update a price once with `npm run import-data` and both games pick it up.

### Changing the cast

- To change who is featured, edit the `cast` arrays in `episodes.ts`. Each destination needs a profile in `profiles.ts` with three clues. A test checks this.
- A destination drops out of the show automatically if it has no trip in the travel window. An empty episode is skipped.
- Every other destination with an eligible trip appears under More eligible contenders. Adding one creates a bonus round. These arrive already revealed, with no clues.
- Trips from the `Connections to verify` sheet have no established flights. They appear in Sensible mode only.
- A destination with several date or airport options is one contestant with a "Pick your dates" switch.

### Saved progress

State is saved under the `blind-flight:v3` key with `schemaVersion: 3`. Saves from the old ballot version are ignored. On load, anything unreadable, from another schema version, or pointing at a destination that no longer exists is dropped. Use Reset the whole show in the footer, or Start again on the title screen.

Two-person play works on one phone only. Nothing syncs between devices.

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
- Independent voting on two phones, live fares and shared links are not built in either game. They are listed as phase 2 in both briefs.
- Blind Flight's clues and pitches are editorial copy checked against general knowledge, not against the workbook.
