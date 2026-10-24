# BLIND FLIGHT
## Claude / coding-agent implementation brief — version 2

**Tagline:** *Love at first flight. Regret at baggage claim.*  
**Second line:** *The dating show where you fall for a destination, not a person.*  
**Project:** Functional, comedy-led European holiday-choice website for two people  
**Audience:** Two adults jointly choosing a break from Scotland in January 2027  
**Platform:** iPhone Safari first; desktop second  
**Stack/hosting:** Next.js + TypeScript + Tailwind; GitHub → Vercel  
**Status:** Ready-to-build product, content and engineering specification  
**Updated:** 24 October 2026  
**Source data vintage:** Holiday research and indicative quotes compiled 23 October 2026

> **Agent mandate:** Build the application, not a concept deck. The output must be a genuinely playable, polished website with working choices, a two-person matching system and a sensible holiday comparison at the end. Use the supplied spreadsheet as the authoritative input. Do not invent prices, bookability, routes, hotel properties, schedules, images, or research that is not in the data.

---

## 1. The premise and the creative north star

**BLIND FLIGHT** is an affectionate parody of late-1980s/early-1990s British prime-time dating shows. Contestants are **European city-break destinations**. A gloriously self-important fictional host presents them as if they were prospective romantic partners. Each city makes an absurd pitch, drops clues, reveals its identity and (where priced) invites the players to guess how much it costs.

Underneath the nonsense is a practical, carefully researched destination-comparison tool. Neither traveller should need to open the Excel spreadsheet to use the website.

**The core loop:**

1. Hear/see a **mystery destination's dating profile** and clues.
2. Tap to **reveal the city** and attractive destination photography.
3. Optionally **guess the holiday price**, then reveal the real indicative estimate with clear caveats.
4. Traveller A votes **Keep / Maybe / Pass**; Traveller B independently does the same (or use a quick joint-decision mode).
5. At the end the site produces **It's a Match!** results and a genuinely useful grand-final comparison.

**Editorial target:** Amusing enough to laugh together, visual enough to get excited about a place, and reliable enough to make a real booking shortlist.

### Tonal boundaries

- Tongue-in-cheek, mock-serious, dry British humour; a fictional presenter who treats very ordinary travel decisions as nationally important television.
- Keep jokes **affectionate**. Roast flight connections, price surprises and awkward January weather, not nationalities, accents or people.
- No references to actual famous presenters' voices or likenesses; do not recreate the logos, soundtrack, catchphrases, layouts or programme art of *Blind Date*, *The Price Is Right* or other shows. This is an **original genre parody**.
- Avoid repetitive AI-generated zingers and all-caps overload. The city must be compelling on its own merits.
- **The game must never hide a meaningful cost, caveat or flight limitation behind a joke.**

### First-run title-screen copy (editable)

**BLIND FLIGHT**  
*Love at first flight. Regret at baggage claim.*  
“Two hopeful holidaymakers. A suspicious number of European destinations. And absolutely no prizes, because you're paying for it yourselves.”

Buttons: **START THE SHOW**, **SKIP TO THE HOLIDAYS**.  
Optional *About these prices* link, accessible throughout.

---

## 2. Source of truth, trip parameters and pricing integrity


### Authoritative source file

Use **`January_2027_Europe_Holidays_Updated_Flexible_Flight_Times.xlsx`** as the primary source, especially these sheets:

- `Shortlist` — overview and 20 previously priced trip combinations.
- `Viable itineraries` — specific routes, flight evidence, accommodation names/ratings, links and caveats.
- `Search rules` — interpretation of time windows, quote quality and costs.
- Other tabs — use as corroboration, but **do not turn unmatched flight schedules into priced trips**.

The workbook may be provided as an attachment or committed to the repository under `data/source/`. If not accessible, use the seed table below to scaffold the application, and make its status explicit. Never claim to have parsed a file that was not provided.

### Holiday constraints

- **Two adults**, sharing one double/twin hotel room or apartment.
- Depart **Glasgow (GLA) or Edinburgh (EDI)** on **Sunday 17 or Monday 18 January 2027**.
- Return to the same region on **Thursday 21 or Friday 22 January 2027**.
- **Minimum four nights**: combinations `17→21` (4), `17→22` (5), and `18→22` (4) are valid.
- Departure/arrival **clock times are flexible**; the original early-out / late-back filters were *preferences*, not hard exclusions.
- The aim is **good value**, not automatically the absolute cheapest.
- **Exclude Jordan and Croatia** (prior decision).
- Consider city breaks, culture, distinctive food, cosy winter destinations, Baltic trips and warmer alternatives.
- A few favourite qualities to highlight: **food, bars/cafés, picturesque streets, authentic local experiences, culture/history, interesting architecture**. Not a luxury tasting-menu or generic resort-sales pitch.
- Do not automatically exclude destinations solely because they were missing from the user's restricted-time timetable.
- Previously visited destinations can remain candidates, but provide a clear novelty/repeat-trip caveat where relevant.

### Monetary meaning

The workbook's **`With extras / two`** is an illustrative **total for two people**, incorporating return flights + shared accommodation + an estimated baggage allowance + indicative transfers. It is **NOT** a complete holiday budget: food, attractions, local spending and UK-airport travel are excluded. For the main reveal show the **rounded total for two** prominently; in the detail panel show the exact estimate and breakdown, followed by **per-person** amounts.

Source workbook assumptions include roughly **£25 baggage per traveller** plus **£50 transfers for the two travellers** on typical priced options. The assumptions are illustrative and must remain editable in the data pipeline.

**Prices were observed/compiled on 23 October 2026.** All fares and rooms are indicative and may change. Some published examples were earlier indexed/detailed quotes, not reconfirmed live availability. Show this visibly but unobtrusively.

**Never** label these as live fares, guaranteed checkout prices or bookable inventory. Always link out for verification, and preserve route warnings (connections, Beauvais transfer, unusual flight timing, missing flight confirmation).


### Critical interpretation for this redesign

- This is **not** a price-comparison API. Source fares are snapshots and require manual reconfirmation before booking.
- The player guesses the **estimated total for BOTH travellers**, not a per-person or flight-only quote.
- The headline “estimated total with extras” includes an **illustrative allowance for bags and transfers**, but **excludes meals, sightseeing, local spending and UK-airport travel**.
- Price guessing is **optional**. People can skip straight to the price without losing the ability to choose a holiday.
- If an option has only a flight schedule plus a hotel quote, show **Price pending — flights not yet priced**, not £0, £?? marked as an eventual answer, or a fabricated total.
- A single destination may have several legitimate date/hotel options. Present one destination **contestant** with a variant selector, never multiple identical dating profiles.
- Prefer verified direct same-airport schedule pairs when the data warrants this, but **do not say “direct” or “confirmed” unless the relevant row supports it**.

---

## 3. Game structure: four short acts

### ACT 0 — Choose your contestants

The opening resembles a knowingly inexpensive television studio: velvet-ish stage curtains, oversized logo, starbursts and light-up signs, with carefully restrained animation.

Offer two clearly labelled paths:

- **Two-person game (default):** Traveller 1 and Traveller 2 each vote privately **on the same phone**, passing the phone between them when appropriate. Use generic names or optional editable nicknames. No login.
- **Quick play:** One shared set of choices and a faster journey. Still produces a shortlist; no pretend “match” between two independent ballots.

Offer **12 featured destinations / approximately 4 mini-episodes of 3**, with easy **Show me more destinations** later. The game must work with fewer or more entries, if the dataset changes. A 12-destination game is preferable to a 40-card slog.

Include **Skip intro**, **sound off/on** (off by default), **reduced motion**, and **Skip to comparison**. First-play instructions should take no more than two short sentences.

### ACT 1 — “Meet the contestants” (blind-dating reveal)

A three-panel retro stage introduces **Contestant Number One, Two and Three** in each mini-episode. These are *not* three people: they are three destinations.

Before the destination is revealed, each mystery profile has:

- An original, cheeky **first-person one-liner** (“I enjoy late-night walks, strong coffee and insisting I'm romantic despite the January chill.”).
- **Three clues**, of increasing specificity, each uncovered by tapping. Use real grounded traits; avoid false stereotypes or misleading attractions.
- A **Reveal my identity** control available immediately so the user is never forced to click through clues.
- A silhouetted postcard / retro mystery graphic, **not a visible photo with recognisable landmarks** before the reveal.

Once revealed, show:

- City and country, striking correctly matched **photo**, a one-line pitch and **three reasons to go**.
- A clearly identified “**The awkward bit**” caution: cold/limited daylight, missing fare, awkward airport, flight connection, recent repeat destination, more expensive spending, etc.
- Trip fact strip: **4 or 5 nights; exact dates; GLA or EDI; flight route evidence**.
- A button to continue to price reveal and voting.

The intro should never feel like a multiple-choice factual quiz: the aim is to **discover preferences**, not test geography knowledge. Optional episode/round title ideas:

| Episode | Possible cast | Presenter description |
|---|---|---|
| **The Budget Beauties** | Wrocław, Warsaw, Kaunas | “Proof that romance may cost less than two train tickets.” |
| **The Old-Town Romantics** | Kraków, Prague, Gdańsk | “Cobblestones, cafés and a frankly irresponsible amount of atmosphere.” |
| **The Cool Customers** | Copenhagen, Tallinn, Vilnius via Kaunas | “Some of these suitors are colder than others.” |
| **The Winter Escapees** | Málaga, Paphos, Tenerife South | “For people no longer prepared to defend Scottish January.” |

Treat these casts as editorial seeds, not a fixed list; avoid claiming a flight price is confirmed. Provide a **More eligible contenders** drawer/page for Rome, Berlin, Pisa/Florence, Porto, Munich, unpriced Venice, Helsinki etc. **Don't include invalid or excluded trip destinations.**

**A production-friendly structure:** Four consecutive 3-contestant episodes, each with a visual overview, then individual card reveals. Support navigating backward. If the three-stage effect feels cluttered on mobile, show a horizontal stage preview with the focused contestant below.

### ACT 2 — “What's your price, darling?” (optional cost guessing)

For each **priced** itinerary after the location reveal:

- Display **£???** for the **two-person estimated holiday total with illustrative extras**.
- Present a generous numeric input and/or large touch-friendly slider; default blank or neutral, don't suggest the actual answer through slider positioning.
- CTA: **REVEAL THE PRICE!** and a discreet **JUST SHOW ME** link.
- Dramatic but quick original digit-flip/stage-light reveal; no mandatory delays, avoid seizure-triggering flashes.
- After reveal, show: **rounded headline £ total for two**, exact figure in details, **£ per person**, flights for two, accommodation for two, estimated baggage/transfers and any real caveats. Price breakdown should reflect the currently selected itinerary, and use the workbook values rather than reconstructing guesses.
- Close guess can earn **“Unnecessarily Accurate”**/etc. joke badges. Scores are purely entertainment; never bias match ranking or suggest the prices are newly verified.

For **unpriced** options, skip guessing gracefully: **“Our glamorous finance department has not confirmed a return airfare.”** Show known hotel quote and flight-timetable facts **as separate fields**, plus a labelled **Fare still needed** status. Do **not** auto-convert a room-only quote into a package price.

**Variant handling:** If a destination has 4- and 5-night alternatives (e.g. Kaunas), show a single **Pick your dates** switch. It must update night count, airport, hotel, route evidence, prices and link targets together, and **reset the guess/reveal**. Treat variants as the same voteable destination, though the user may choose their preferred variant for the final.

### ACT 3 — “Would you take me away?” (two-person swipe/ballot)

A **Tinder-like decision UI**, but with deliberately kitsch 1990s television furniture (oversized heart, maybe speech bubble, trapdoor). The central mechanic is explicit buttons, with swipes as progressive enhancement:

- **KEEP / YES PLEASE** (heart)
- **MAYBE / NEED CONVINCING** (question mark)
- **PASS / IT'S NOT YOU, IT'S THE TRANSFER** (cross)

Decisions happen **after** the true destination and price status are shown. Don't pretend an unpriced destination has a known total.

**Default two-person mode, same-device, private ballots:**

1. Traveller 1 completes the 12 contestants, with freedom to revisit. Save choices locally.
2. Show **“Pass the phone. No peeking.”** interstitial, then Traveller 2 starts.
3. Traveller 2 votes on the same 12 contestants **without seeing Traveller 1's votes**, to reduce anchoring. It is fine for the destinations and indicative prices to remain visible.
4. On completing both ballots, reveal the matches together.
5. Users can subsequently edit either ballot. Provide a clear *show/hide votes* switch when making changes, preserving privacy during the initial rounds.

**Quick play:** One shared ballot, no fake second-person results. Allow *Keep/Maybe/Pass* with the same UI.

**Matching rules (deterministic and transparent):**

- **It's a Match!** = both selected KEEP.
- **Potential Match** = KEEP + MAYBE, or MAYBE + MAYBE.
- **One of Us Has Questions** = a KEEP or MAYBE opposed by PASS.
- **Mutual Rejection** = both PASS.
- Never mark something a shared match just because a player got the price right.
- Offer a manual **Reconsider** control (even for rejected choices) so a late compromise is possible.

**Interaction:** Buttons are primary and keyboard accessible. Swipe right/left as optional shortcuts only, with visible affordances; “Maybe” is never silently lost. Allow undo. Explicit progress: `5 of 12 — Traveller 1`, etc.

### ACT 4 — “It's a Match!”: the grand final

First show a satisfying retro-screen **match reveal** with each agreed destination (confetti only if motion is allowed), not just a table. Present matched destinations first, potential matches next, and disagreements in an expandable area.

Then deliberately transition to a more sophisticated, actually useful comparison:

- Mobile-friendly **side-by-side** or swipeable comparison cards (choose 2–4); don't cram six columns into an iPhone viewport.
- Hero image; destination; preferred itinerary; travel dates; nights; airport and route quality.
- **Headline total for two**, **per-person total**, breakdown and *indicative quote dated 23 Oct 2026*.
- Hotel/property name and review score when present in source.
- Weather **typical January character** only (if editorial facts have been verified), not a live forecast or invented temperatures.
- Highlights and practical cautions, including transfer/connection/missing-fare warnings.
- Links to the actual sourced flight/hotel search pages; if only a generic search or timetable is available, label it honestly.
- **Select our winner** (manual final choice; no algorithm gets to decide for them).
- **Copy/share summary** and ideally **download CSV** of finalists plus source statuses. Sharing must not expose unnecessary personal data.
- **View all holidays / edit preferences / restart** options.

**Sensible mode:** A permanent **“I refuse to participate in this nonsense”** link takes users to a clean sortable/filterable list, suitable for revisiting when booking. Filters: estimated budget, 4/5 nights, departure airport, weather/type, priced vs unpriced, route quality. Link back to game.

---

## 4. Information architecture & screen contract

| Route / view | Main UI | Essential state |
|---|---|---|
| `/` | Title sequence + start / sensible paths | mode, player nicknames optional |
| `/show` | Episode/3-stage mystery introductions | active episode / contestant |
| `/contestant/[id]` or equivalent client state | Clues → reveal → price → voting | variant, reveal, guess, actor |
| `/handover` | Pass-the-phone interstitial | first ballot completed |
| `/results` | Match-reveal show | both ballots, results categories |
| `/compare` | Useful trip comparison and booking links | selected finalists/winner |
| `/holidays` | Sensible-mode browse | filters and sort |

Routing can be simplified to a single page with managed view state, but **browser Back, reload and direct final access must behave sensibly**. Do not rely on animation completion for navigation.

### Responsive design details

- **iPhone Safari priority** at ~375–430 px: big CTA buttons, well-scoped scrolling, tall cards, no text on busy photographs, no horizontal page overflow.
- Desktop: fictional velvet-stage set with three contestant podiums, presenter captions, lighting and restrained confetti.
- Mobile: focus one contestant, with the three-stage strip above if useful; do **not** shrink a three-column desktop set until text is unreadable.
- Strong focus styles, semantic buttons, labelled inputs, alt text, WCAG AA contrast, predictable touch interactions.
- Every motion honours `prefers-reduced-motion`. Sound **off by default**. If any sound effects exist, use original/rights-cleared assets and user-activated playback; no autoplay.

---

## 5. Art direction: a never-quite-commissioned British Saturday-night show

**Think:** Gaudy game-show staging and polished 2026 travel photography. Stylish intentional kitsch, not a bad PowerPoint or generic dating-app clone.

Suggested palette:

| Usage | Color | Hex |
|---|---|---|
| Stage navy | Midnight blue | `#15213D` |
| Curtains/buttons | Tomato red | `#DE4B4B` |
| Scoreboard / lights | Custard gold | `#F3C95E` |
| Accent & highlights | Seafoam/turquoise | `#4ACDC4` |
| Paper, results cards | Warm cream | `#FFF6E5` |
| Main dark text | Ink | `#1C2538` |

Use a display font with a retro broadcast feel (e.g., appropriate licensed/open display face), plus a highly readable modern sans for travel facts. Avoid relying on remote font loading; include robust fallbacks. Use lightbulb marquees, faux analogue starbursts, lower-thirds, scoreboards and animated wipe/flip transitions. No imitation of any particular TV production's exact distinctive assets.

**Hero photo quality matters:** correct location, actual destination—not a generic fake postcard. Obtain legitimately usable/licensable images, store source and credit requirements in a small image attribution record, and create clear fallbacks (intentional gradients/illustrations) rather than hotlinking unstable stock endpoints. Do not invent rights clearance.

**Important:** Only the mystery silhouette is abstract. Once a contestant is named, **make the holiday itself look gorgeous**.

### Original presenter copy bank

These are editorial examples, not mandatory catchphrases; rotate rather than repeating on every card.

| Moment | Copy |
|---|---|
| Opening | “Welcome to the only dating show where the prize is paying for your own holiday.” |
| Rules | “You are judging destinations. They are not allowed to judge your hand luggage.” |
| Mystery intro | “Behind podium number two: attractive architecture and some frankly ambitious January weather.” |
| Reveal | “It's Prague! Five nights. Two hopeful travellers. One aggressively researched accommodation quote.” |
| Price | “A romantic proposal. From a spreadsheet.” |
| Very close guess | “The finance department is requesting an interview.” |
| Wildly high guess | “You've accidentally budgeted for an entire second hotel.” |
| Price pending | “Our pricing team has gone for a cigarette and never returned.” |
| Keep | “A potential long-term relationship. Of four nights.” |
| Pass | “A brutal rejection. The city will have to recover in private.” |
| Handover | “Pass the phone. The nation demands an independent opinion.” |
| Two keeps | “It's a match! Two people are willing to endure the same airport security queue.” |
| Disagreement | “One person's dream getaway. Another person's connecting flight nightmare.” |
| Grand final | “And the winner is… a destination you'll still need to book yourselves.” |
| Direct comparison | “Enough romance. Let's check the small print.” |
| Skip mode | “I refuse to participate in this nonsense.” |

**Per-contestant profile seed lines** (make them original, accurate and editable):

| Destination | Flirtatious but useful intro | Awkward truth |
|---|---|---|
| Wrocław | “I've got a handsome old town and remarkably modest financial expectations.” | “The priced flight timing needs another look.” |
| Warsaw | “I bring museums, good food and five entire nights of conversation.” | “Previously indexed airfare: recheck times and price.” |
| Kaunas | “I like interesting cafés, Baltic city streets and unexpected rail outings.” | “January in Lithuania is not a beach holiday.” |
| Kraków | “Come for the old streets. Stay for the food and Kazimierz.” | “Flight quote needs reconfirming.” |
| Prague | “I do romance with bridges, pubs and photogenic architecture.” | “Five nights: check whether you'd prefer four.” |
| Gdańsk | “Waterfront strolls and exceptionally good-looking facades.” | “Priced example was a connecting itinerary.” |
| Copenhagen | “Expensive tastes, but my flight quote is suspiciously approachable.” | “Daily spending can be much higher than the starter quote suggests.” |
| Tallinn | “Medieval charm and very convincing winter atmosphere.” | “Connections and short winter days are worth checking.” |
| Málaga | “If you find everyone else too cold, may I offer you tapas and the sea?” | “Milder, not a guaranteed sunny beach holiday.” |
| Paphos | “I have a thing for antiquity and seaside walks.” | “A connection is involved in the priced example.” |
| Tenerife South | “I am prepared to offer actual winter warmth.” | “Location and onward transport may need a closer look.” |
| Vilnius via Kaunas | “History, cafés and a little logistical adventure.” | “The flight lands at Kaunas; allow for the onward journey.” |

Generate **clues from checked destination facts**, stored as editorial data—do not generate them at runtime using invented geography. Clue 1 broad, clue 2 useful, clue 3 more obvious. Avoid making clue #1 itself an exact city giveaway.

---

## 6. Suggested cast and holiday dataset

**There are 20 previously priced itinerary rows covering 19 distinct destination concepts (Kaunas has two date variants).** This snapshot should not be used in place of the full workbook when the workbook is available.

### Seed priced data — source workbook snapshot

Amounts below are **£ for TWO people**, inclusive of the workbook's illustrative extras. Round to whole pounds for the theatrical big reveal; keep original figures for detail views. The latest attached workbook takes precedence if discrepancies appear.

| Holiday concept | Dates, Jan 2027 | Nights | Airport | Total for two (£) | Important note |
|---|---|---:|---|---:|---|
| Wrocław | 18–22 | 4 | GLA | 298.18 | Very low estimate; flight time needs recheck |
| Kaunas | 18–22 | 4 | EDI | 384.37 | Direct scheduled pair; Baltic winter |
| Warsaw | 17–22 | 5 | EDI | 391.01 | Previously found fare; reconfirm timing |
| Kaunas (alternative) | 17–22 | 5 | EDI | 402.87 | Same destination, alternate dates — **do not make another prize card** |
| Gdańsk | 17–22 | 5 | EDI | 407.21 | Priced example involved a connection |
| Kraków | 17–22 | 5 | EDI | 410.19 | Food, Kazimierz, cultural attractions |
| Vilnius via Kaunas | 18–22 | 4 | EDI | 418.22 | Flight into Kaunas + additional ground transfer |
| Prague | 17–22 | 5 | EDI | 420.89 | Architecture, pubs, cafés |
| Pisa / Florence | 18–22 | 4 | EDI | 469.86 | Rail onward, connecting-flight concern |
| Berlin | 18–22 | 4 | EDI | 470.76 | Repeat trip / less novel |
| Copenhagen | 18–22 | 4 | EDI | 494.21 | Very low indexed airfare; expensive day-to-day spend |
| Tallinn | 17–22 | 5 | EDI | 521.09 | Beautiful winter old town; connections need recheck |
| Paris via Beauvais | 18–22 | 4 | EDI | 530.06 | Beauvais airport transfer caveat |
| Málaga | 17–22 | 5 | GLA | 551.89 | Mild, seafood, historic centre |
| Munich | 17–21 | 4 | EDI | 558.90 | Beer halls and Bavaria |
| Paphos | 18–22 | 4 | EDI | 567.03 | Antiquity and mild winter; connecting flight |
| Tenerife South | 18–22 | 4 | EDI | 592.22 | Winter sunshine; accommodation location matters |
| Rome | 17–21 | 4 | EDI | 593.52 | Archaeology; connecting priced example |
| Porto | 18–22 | 4 | EDI | 627.09 | Food/city break; connecting / winter rain |
| Luxembourg City | 18–22 | 4 | EDI | 666.66 | Interesting, but dearer hotel |

**This table is a convenience seed, not a substitute for importing the full workbook.** The full workbook contains actual hotel names, ratings, URLs, route evidence, flight/room cost columns and warnings.


### Unpriced but viable schedule contenders

Direct same-airport timetables and hotel quotes were found in the workbook for destinations including **Poznań, Venice, Amsterdam, Madrid, Helsinki, Alicante, Santander, Barcelona, Brussels/Charleroi, Lanzarote and Gran Canaria**. Their **overall two-person total should remain empty** until a qualifying dated return fare is genuinely matched. These are still useful wildcards to investigate after playing.


### Casting & category rules

- Feature **around 12** priced **distinct destination concepts** in the standard show. The rest remain fully discoverable under **More contestants** and Sensible mode.
- On the show a contestant = **destination**, not a separate date variant; do not double-vote for Kaunas 4/5-night options.
- Let the user change preferred variant at price/compare stage; reset guessing state when switched.
- Unpriced wildcards must not quietly compete in an “accurate price guess” round or appear as £0.
- Avoid stale numbers outside their explicitly dated source and prominent **estimate** labels.
- Don't silently substitute a less attractive airport or different property merely to preserve a score or a joke.

---

## 7. Data schema and logic

Create a one-time import/transformation step from the XLSX workbook into normalized static JSON/TypeScript used by the site. Keep raw data **outside the public web asset directory**, and document where edits are made. Support nulls, source dates, route provenance and original hotel/flight links.

Suggested types (adjust as needed; meaning must survive):

```ts
type FareEvidence =
  | 'priced_indicative'
  | 'scheduled_unpriced'
  | 'needs_manual_review';

type Vote = 'keep' | 'maybe' | 'pass';
type PlayerId = 'traveller1' | 'traveller2';
type PlayMode = 'two_person' | 'quick';

type Itinerary = {
  id: string;
  destinationId: string;
  departureAirport: 'GLA' | 'EDI';
  arrivalAirport: string;
  departDate: string;                  // YYYY-MM-DD
  returnDate: string;                  // YYYY-MM-DD
  nights: 4 | 5;
  routeType: 'direct' | 'connecting' | 'direct_plus_ground' | 'unknown';
  routeCaution?: string;
  flightsPerPersonGBP: number | null;
  roomForTwoGBP: number | null;
  extrasForTwoGBP: number | null;
  estimatedTotalForTwoGBP: number | null;
  fareEvidence: FareEvidence;
  quoteObservedDate?: string;           // e.g. 2026-10-23
  quoteNote?: string;
  flightSourceUrl?: string;
  roomSourceUrl?: string;
  hotelName?: string;
  hotelReviewOutOf10?: number;
};

type Destination = {
  id: string;
  name: string;
  country: string;
  category: string;
  stageIntro: string;                    // original editorial copy
  clues: [string, string, string];       // grounded, progressively specific
  shortPitch: string;
  highlights: string[];
  awkwardTruth: string;
  heroImage?: string;
  heroAlt?: string;
  itineraryIds: string[];
  defaultItineraryId: string;
};

type PlayerProgress = {
  votes: Record<string, Vote | undefined>;    // keyed by destinationId
  guessedPricesGBP: Record<string, number | undefined>; // itinerary id
};

type GameState = {
  schemaVersion: 2;
  mode: PlayMode;
  activePlayer: PlayerId;
  activeDestinationId?: string;
  destinationOrder: string[];
  preferredItineraryByDestination: Record<string, string>;
  players: Record<PlayerId, PlayerProgress>;
  winnerDestinationId?: string;
  soundEnabled: boolean;                // false by default
};
```

**Invariants / unit-test cases:**

1. Only eligible **17/18 January outbound → 21/22 January return, 4+ nights** appear as bookable-window options.
2. `estimatedTotalForTwoGBP` is null if the dated airfare or complete package components are missing; **no fabricated totals**.
3. A displayed price always corresponds to the **selected itinerary** and uses `estimatedTotalForTwoGBP`; avoid adding extras twice.
4. The reveal and price guess reset when itinerary/date choice changes, even if the destination stays the same.
5. Names, photos, hotel URLs, flight URLs and flights are always tied to the correct destination/itinerary.
6. Repeating a destination on different dates **does not add a second contestant or extra vote**.
7. Traveller 2 cannot see Traveller 1 votes until completion or explicit user-authorized reveal.
8. Matches use the deterministic Keep/Maybe/Pass rules above. Unknown votes are not counted as Pass.
9. A two-person Match cannot exist in quick mode, and a price-guess score cannot affect matching.
10. Total for two, per-person total and fare/hotel/extras math all use consistent currency and rounding.
11. Missing URLs or properties remain missing; never synthesize fake deep links.
12. Undo, refresh/persistence, restart and re-voting are supported without corrupting both ballots.

---

## 8. Engineering approach and repository

### Stack

- **Next.js App Router**, **TypeScript**, **Tailwind CSS**.
- **Motion** (`motion/react`) or equivalent, but graceful static fallback when reduced-motion is active.
- Lucide icons and/or custom original SVG stage ornaments.
- **Local, normalized JSON/TS data** sourced from the workbook. No Excel parsing on every page render.
- **localStorage** with `schemaVersion`, guarded JSON load/migration and a visible reset button. State must survive refresh; no login or database for V1.
- **Vercel** hosting with GitHub-connected automatic preview and production deployments.
- No paid APIs, external booking integrations or secrets required for MVP.

### Suggested repo structure

```text
blind-flight/
  README.md
  docs/
    BLIND_FLIGHT_CLAUDE_BUILD_BRIEF.md
  data/
    source/
      January_2027_Europe_Holidays_Updated_Flexible_Flight_Times.xlsx
  scripts/
    import-holiday-data.ts
  src/
    app/
      page.tsx
      globals.css
      layout.tsx
    components/
      OpeningCredits.tsx
      GameShowStage.tsx
      MysteryContestant.tsx
      ClueReveal.tsx
      DestinationReveal.tsx
      PriceGuess.tsx
      PriceReveal.tsx
      VoteButtons.tsx
      HandoverScreen.tsx
      MatchReveal.tsx
      FinalComparison.tsx
      SensibleBrowse.tsx
      PriceProvenance.tsx
    data/
      destinations.ts
      itineraries.ts
      episodes.ts
    lib/
      cost.ts
      voteMatching.ts
      persistence.ts
      eligibility.ts
  public/
    images/
      destinations/
  package.json
```

Do not over-engineer the directory; a smaller coherent architecture is preferable. Clearly separate **facts**, **editorial dating-show copy**, **presentation**, and **game state**.

### Hosting and handover

1. Read this brief and the original XLSX. Parse and validate data before hardcoding final content.
2. Create/use an appropriate GitHub repository, commit working code and a README. **Never claim you created a repository unless confirmed.**
3. Run installation, unit tests if provided, `npm run build`, and relevant interactive checks before commit.
4. Import GitHub repo into **Vercel** and deploy when authenticated access is available. If not, provide exact manual import steps without falsely claiming deployment.
5. Surface the deployed Vercel URL and repo URL only if they actually exist. Documentation should cover updating quotes/dates, adding contestant copy and adjusting the category cast.
6. Consider a Vercel preview deployment for visual QA, then production through the main branch.

**Optional later:** Separate-device private voting and live matching via an authenticated shared session/backend or explicit exchange link. **Do not claim synchronized two-phone voting works using localStorage alone.** The MVP must work on one device without any network calls after loading.

---

## 9. MVP acceptance checklist

### Experience

- [ ] Title screen and distinctive **original** Blind Flight brand with cheeky presenter copy.
- [ ] Actual mini-episode / three-contestant staging, not merely a generic endless scroll of travel cards.
- [ ] Three genuine, manually checked **mystery clues** per featured destination.
- [ ] Clear **city reveal**, attractive correct photo, highlights, awkward truth and trip facts.
- [ ] Priced trips offer **optional** price guessing and a correct, well-labelled estimate reveal.
- [ ] Unpriced trips present **price pending** rather than invented fare/cost.
- [ ] Keep/Maybe/Pass choices work via accessible controls; swipes optional.
- [ ] Two-player **private sequential ballots** and pass-the-phone moment work, with no login.
- [ ] Accurate **mutual matches**, potential matches and disagreements.
- [ ] Winner can be selected manually and reselected; other trips remain reviewable.
- [ ] Finale provides proper side-by-side comparison, real source links and copyable shortlist.
- [ ] A **Skip to the holidays / Sensible mode** exists and is useful for actual booking.

### Data & engineering

- [ ] All matching itineraries comply with 17–22 Jan 2027 constraint and 4/5-night rule.
- [ ] Two-person pricing, per-person amounts, room costs, baggage/transfers and quote caveats are not conflated.
- [ ] Kaunas 4/5-night variants remain a single contestant, with working date selector and state reset.
- [ ] Persisted state survives refresh; empty ballot, partial ballot, no matches, all passes and revisit work.
- [ ] iPhone Safari at 375–430 px works comfortably: no forced long animation, inaccessible buttons or horizontal overflow.
- [ ] Keyboard controls, focus indication, image alt text, contrast, reduced motion and sound-off defaults work.
- [ ] Images do not break; attribution/rights notes documented.
- [ ] `npm run build` succeeds; simple tests cover eligibility, cost breakdown and matching logic.
- [ ] README covers local development, data updates, and GitHub/Vercel deployment.

### Test scenarios (specifically exercise these)

1. Traveller 1 KEEP and Traveller 2 KEEP → “It's a Match!”
2. Traveller 1 KEEP and Traveller 2 MAYBE → “Potential Match”.
3. Traveller 1 KEEP and Traveller 2 PASS → disagreement, **not** a match.
4. Traveller 1 PASS and Traveller 2 PASS → mutual pass, easily recoverable.
5. One player votes, reload mid-flow, continues at right contestant; Traveller 2 sees no prior votes.
6. Change Kaunas itinerary from 4 to 5 nights → price/dates/hotel fields change and guessing resets.
7. Unpriced Venice or Helsinki → no price guessing with invented total; known room quote presented distinctly.
8. No Keep/Keep matches → show constructive “We have some talking to do” state, show maybes and reconsider actions.
9. Sensible mode used immediately from landing; all data remains accessible and filterable.
10. Start show in reduced-motion mode and with sound disabled.

---

## 10. Build order / priorities

**P0 — Functional playable release:** Original game-show visual identity, 12 featured contestants, clue/destination reveals, price logic, sequential same-device ballots, matching finale, comparison and sensible mode. Authentic source quote statuses, persistence and iPhone usability.

**P1 — Production polish:** Original subtle fanfares (optional off by default), excellent stage transitions, better responsive photo art direction, price-guess badge humour, CSV export, contestant expansion and more flexible variant controls.

**P2 — Follow-on ideas, not requirements:** Real-time two-device ballot sharing, QR pairing, backend collaboration, legitimate APIs to recheck fare availability, dynamic weather, more game-show mini-games (Catchphrase, Play Your Cards Right, etc.). Never delay P0 by building P2.

**Scope discipline:** Prefer 12 excellent profiles and a complete two-person journey to 40 mediocre jokes and half-finished functionality. It is acceptable to ship without audio. The matching mechanics, data honesty and mobile UI are not optional.

---

## 11. Concrete instruction prompt to give Claude

> Read `BLIND_FLIGHT_CLAUDE_BUILD_BRIEF.md` and the supplied `January_2027_Europe_Holidays_Updated_Flexible_Flight_Times.xlsx`. **Build the working Blind Flight website described**, not another written proposal. Make it an original, intentionally camp British retro dating-show parody in which 12 European holiday destinations deliver mystery clues and funny dating pitches, are revealed with real travel information, and then receive independent Keep/Maybe/Pass votes from two travellers on one phone. Include optional guess-the-price rounds using only the spreadsheet's legitimately priced trips, an honest “fare unverified” path, a pass-the-phone handover, match reveal, final genuinely useful comparison and a sensible browse mode. Use Next.js/TypeScript/Tailwind, mobile-first design, local state persistence, correct quote provenance, GitHub and Vercel. Make reasonable creative decisions without stopping for minor questions, implement working source code, test the app, and report what is and isn't deployed.

### Assets to provide with this brief

1. This Markdown file (`BLIND_FLIGHT_CLAUDE_BUILD_BRIEF.md`, or its downloaded filename).
2. The most recent actual Excel workbook: `January_2027_Europe_Holidays_Updated_Flexible_Flight_Times.xlsx`.
3. Optionally any destination photos you personally have the rights to use; otherwise the agent should source properly usable imagery and record credit/rights.

**Final quality bar:** “This looks like a lovingly ridiculous British game show that somehow does a better job of choosing our January holiday than the spreadsheet.”
