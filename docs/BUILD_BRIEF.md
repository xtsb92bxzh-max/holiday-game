# THE GREAT JANUARY GETAWAY
## Claude / coding-agent implementation brief

**Project type:** Playful, mobile-first, interactive travel-decision website  
**Tone:** Deliberately tongue-in-cheek British TV game show, with genuinely useful holiday information  
**Hosting:** Vercel  
**Source control:** GitHub  
**Status:** Product / design brief; this is **not** a request to invent new flight quotes or book travel  
**Brief written:** 23 October 2026

---

## 1. The assignment

**Build a real, working website, not just a mock-up.** Turn a serious January 2027 European holiday comparison spreadsheet into a comedy game show for two people deciding where to go away together.

The experience should riff *in spirit* on the prize conveyor belt of **The Generation Game**, the cost-guessing format of **The Price Is Right**, and a shortlisting finale. **Do not copy the logos, recordings, catchphrases, graphics, theme tunes or other protected show assets.** Create original branding and original jokes.

Working title: **THE GREAT JANUARY GETAWAY**  
Possible strapline: **“Two travellers. Twenty holidays. One deeply overworked spreadsheet.”**  
Optional host intro: **“Good evening, bargain hunters. Tonight's prizes include medieval old towns, suspiciously cheap flights and a very real possibility of January drizzle.”**

### The real purpose

Help my partner and me pick a European break together in an enjoyable, accessible way. The game is the *presentation layer*, not a substitute for a sound comparison. The end result should be a **ranked, exportable shortlist** that we can use to check live fares and book a trip.

**Non-negotiable:** The site should be a polished and responsive production-quality mini-application, not a slide deck, list of generic cards or plain spreadsheet viewer.

---

## 2. Source of truth and trip rules

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

---

## 3. The creative direction

### Overall mood

Imagine a lovingly overproduced **late-1970s/1980s British Saturday-night television game show**, crossed with an attractive contemporary travel guide.

- Saturated cobalt / royal blue, rich red, mustard/gold spotlights and cream; occasional glitter/sparkle details.
- Retro marquee type, scoreboards, prize labels, shameless theatrical reveal animations, moving dotted light borders.
- Playful host commentary, mock applause, confetti, bouncing price digits and slightly absurd prize introductions.
- Strong, beautifully framed **real travel photography** so the destinations themselves still look appealing.
- A distinctly original graphic identity: no copied programme marks, famous hosts or music.
- Never let the jokes make important pricing, durations or flight limitations difficult to read.
- Make the experience excellent on **iPhone Safari first**, and equally usable on desktop.
- Respect `prefers-reduced-motion`; include **Skip intro**, **Sound on/off** and **Pause/Next** controls. Sound starts **off**, no autoplay audio.

### Sample original copy

- Opening: “Welcome to the only game show where the grand prize is paying for your own holiday.”
- Conveyor intro: “Behold the conveyor belt of aggressively researched European opportunities.”
- Reveal: “And tonight's fabulous prize is... FIVE NIGHTS IN PRAGUE! Subject to airline baggage policies, naturally.”
- Price guess: “Higher? Lower? Has anyone checked the exchange rate?”
- Correct/close guess: “An almost suspiciously respectable estimate.”
- Too high: “You've just invented a very generous hotel minibar allowance.”
- Reject: “Not even for that price? Brutal.”
- Final: “One getaway will leave with our hearts. All others will remain in the spreadsheet.”

Keep writing fresh and sparing: more charm than relentless quips. No default emoji overload.

---

## 4. Core player experience

### Screen 0 — Opening title sequence

Big original show logo, moving stage lights, tongue-in-cheek opening caption, button **“LET'S SEE THE PRIZES”**, optional **“Skip the nonsense”** link to the sensible full comparison. Explain in one sentence that there are real researched holiday options with indicative prices.

### Round 1 — The Holiday Conveyor Belt

The signature feature. Build a **visible animated horizontal conveyor belt** across a retro TV stage, cycling through the curated destination prize cards. Images, nameplates and quirky short descriptions pass across screen. It should look unmistakably like a *conveyor belt*, not just a normal carousel.

Interactions:

- User can **Start / Stop / Next** the belt; provide a manual next button for accessibility.
- Tap a city or stop the belt to spotlight it and open its individual game card.
- Introduce a dozen or so **distinct** destinations (not separate cards for the same city on different dates).
- Show a progress/remaining-prizes indication.
- Don't force users to sit through long animations; after watching briefly they can move to the rounds.

**Important:** This can be implemented as a timed, CSS/Framer Motion animated train of cards with a seamless loop, but it must have a useful reduced-motion/manual fallback.

### Round 2 — “GUESS THE HOLIDAY PRICE!”

One destination at a time, using a large photograph and succinct readable details:

- Destination + country.
- **4 or 5 nights**, exact dates, UK departure airport.
- Three concise reasons to go (e.g. food, old town, weather, museums).
- One honest caution (e.g. cold/dark, connecting itinerary, unusually early flight, airport transfer).
- A big **£???** price display and a slider / large numerical entry to **guess the all-in estimated total for two**.
- **REVEAL THE PRICE** triggers fun audiovisual *optional* fanfare and rolling-digit animation.
- Display the correctly labelled total, plus details: flight cost x 2, accommodation for two, estimated extras, total/person, and confirmation status.
- Light-hearted closeness points can be shown: within £20 = 10 points, within £60 = 5, anything else = 0. These are **entertainment only**, not a ranking of holiday suitability.

Use a slider whose min/max sensibly encompasses the holiday data, but also support direct keyboard/tap input. Do not hide numeric precision until the user needs to see it.

### Round 3 — “KEEP IT / MAYBE / BIN IT”

Immediately after each reveal, select one:

- **KEEP IT** — shortlist candidate.
- **MAYBE** — undecided.
- **BIN IT** — reject from finals, but recoverable.

The user can revisit/edit decisions. One person operating the show with their companion is the **MVP default**, with joint choices and an optional rotating “contestant” label for the person guessing. Don't require both people to create accounts or navigate separate devices.

Consider independent private voting, real-time sync or QR-code collaboration a **phase 2 enhancement**, not a blocker for deployment.

### Round 4 — “THE GRAND FINAL”

A finale showing the **kept holidays side by side**, genuinely useful comparison cards with:

- Hero image; city, trip dates and nights.
- Total for two / per person.
- Flights and airport quality, direct vs connecting, whether timings are verified.
- Hotel / room name and review score where supplied.
- Winter weather *typical* description (do not pretend this is a dated weather forecast).
- Food/café/culture strengths and one honest reason not to choose it.
- Links to search/check flights and the accommodation, derived from the workbook.
- User's choices and optionally a manually selected “winner”.

Allow **sort by cost**, **compare selected**, **reconsider rejected** and **export/share the final shortlist**. A simple shareable text summary / download CSV / copy-to-clipboard is sufficient for MVP; PDF is optional.

### Alternate entry: Sensible mode

A button **“I refuse to participate in this nonsense”** jumps directly to a clean searchable destination list, with categories and price-confidence filters. This is particularly useful when revisiting the site to book.

---

## 5. Destination selection and data seeding

The newest spreadsheet has **20 priced trip combinations**, representing **19 distinct destination concepts** because Kaunas has 4-night and 5-night versions. It also contains many further viable schedules with **unverified fares**. Curate around **12–15 main show contestants** covering different feels and price tiers, rather than forcing every itinerary into the game.

Suggested starting cast (not mandatory): **Wrocław, Warsaw, Kaunas, Kraków, Prague, Gdańsk, Copenhagen, Tallinn, Málaga, Paphos, Tenerife, Rome**. Optional wildcards: **Venice, Helsinki, Amsterdam, Madrid, Poznań, Bruges/Brussels** — but these must be clearly labelled as *flight price not verified* if no matching fare is present.

Do **not** make up a price for an unpriced wildcard. Such destinations can enter a separate **“mystery contestant”** round, where the reveal states **“Flight price awaiting confirmation”**, or can stay in Sensible mode.

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

### Unpriced contenders worth retaining (examples)

Direct same-airport timetables and hotel quotes were found in the workbook for destinations including **Poznań, Venice, Amsterdam, Madrid, Helsinki, Alicante, Santander, Barcelona, Brussels/Charleroi, Lanzarote and Gran Canaria**. Their **overall two-person total should remain empty** until a qualifying dated return fare is genuinely matched. These are still useful wildcards to investigate after playing.

### Required normalized TypeScript data shape

```ts
type EvidenceStatus =
  | 'priced_indicative'       // dated quote, not guaranteed live
  | 'scheduled_unpriced'      // flight schedule identified, fare not confirmed
  | 'needs_manual_review';

type Itinerary = {
  id: string;
  destinationId: string;
  departureAirport: 'GLA' | 'EDI';
  arrivalAirport: string;
  departDate: string;           // YYYY-MM-DD
  returnDate: string;
  nights: 4 | 5;
  routeType: 'direct' | 'connecting' | 'direct_plus_ground' | 'unknown';
  routeCaution?: string;
  flightsPerPersonGBP: number | null;
  roomForTwoGBP: number | null;
  extrasForTwoGBP: number | null;
  estimatedTotalForTwoGBP: number | null;
  fareEvidence: EvidenceStatus;
  flightSourceUrl?: string;
  roomSourceUrl?: string;
  hotelName?: string;
  hotelReviewOutOf10?: number;
};

type Destination = {
  id: string;
  name: string;
  country: string;
  regionOrCategory: string;      // e.g. Baltic winter, food/culture, winter sun
  intro: string;
  highlights: string[];
  caution: string;
  imagePath?: string;
  itineraryIds: string[];       // may have multiple date/room variants
  defaultItineraryId: string;
};
```

Data invariants:

1. `estimatedTotalForTwoGBP` is **null** unless the source actually has a fare **for the selected dates**, room total, and documented extras.
2. No two separate holiday game cards for the same destination solely due to a change in nights; use an itinerary toggle on the card.
3. The price reveal must always correspond to the **currently selected itinerary**. Reset guesses/reveal state if dates change.
4. Keep distinctions such as **Paris via Beauvais**, **Vilnius via Kaunas**, and **Pisa / Florence** honest.
5. Always display indicative provenance/last-check date in the details.
6. Exclude flights/holidays that violate the specified travel window or minimum stay.
7. Display a price breakdown only if the source provides those fields; don't reverse-invent fare components from the total.
8. Mark missing or broken booking URLs rather than inventing a deep link.

---

## 6. Visual layout guidance

### Main show

On larger screens, a full-width imaginary game-show stage with layered footlights and a prominent central horizontal conveyor, host scoreboard in the top-right, title marquee across top. On mobile, preserve the **conveyor-belt illusion** in a horizontally clipped stage area and stack the legible destination controls below.

### Individual destination card

- Large 16:9 photograph.
- Oversized retro number/nameplate: `PRIZE 07 · PRAGUE`.
- Destination title + short one-liner.
- Visible facts row for airport, dates, nights.
- Main price-guess panel.
- Big reveal with responsive animation and detailed cost disclosure.
- Large thumb-friendly KEEP/MAYBE/BIN buttons.

### Grand final

Move toward an elegant travel-magazine comparison design. Less stage clutter, more information. Use narrow cards/accordion detail on mobile and a side-by-side comparison on desktop. Keep the retro branding as a framing device.

### Images

Use high-quality, licensable, destination-appropriate photography; create source/attribution records if required. Do not use generic random city images, watermarked imagery, or a broken external photo endpoint. Where photos have not been sourced, build intentional colourful fallback illustrations/gradients. Make destination content editable in `src/data/`.

---

## 7. Recommended stack and deployment

### Technical recommendation

- **Next.js** with the App Router.
- **TypeScript**.
- **Tailwind CSS** for responsive styling.
- **Motion** (`motion/react`) or similar for animated conveyor and reveal.
- **Lucide** icons or custom SVG stage ornaments.
- **Local JSON/TypeScript dataset generated once from the workbook**. Keep the full original workbook outside public site assets unless there is a reason to expose it.
- **LocalStorage** to persist session progress and choices (works without a backend for the first version).
- **Vercel** as the production host, connected to the GitHub repo for preview and main-branch production deployments.

No paid API, database, user accounts or secret keys are needed for MVP. **Prioritise a single coherent deployment** over complex architecture.

### Preferred repository structure (suggestion)

```text
great-january-getaway/
  README.md
  docs/
    BUILD_BRIEF.md                 <- this brief
  data/
    source/
      January_2027_Europe_Holidays_Updated_Flexible_Flight_Times.xlsx
  src/
    app/
      page.tsx
      layout.tsx
      globals.css
    components/
      Stage.tsx
      ConveyorBelt.tsx
      DestinationCard.tsx
      PriceGuess.tsx
      PriceReveal.tsx
      VotingControls.tsx
      GrandFinal.tsx
      SensibleMode.tsx
    data/
      destinations.json
      itineraries.json
    lib/
      pricing.ts
      gameState.ts
  public/
    images/
  scripts/
    import-holiday-data.ts
  package.json
  ...
```

Adapt structure if simpler. The actual production client should use normalized JSON, not Excel cell references on every render.

### Deployment workflow

1. Put this brief and the workbook in the coding agent's context.
2. Create a **new GitHub repository** for the app (e.g. `great-january-getaway`).
3. Build and test locally, commit to GitHub, and make sure `npm run build` succeeds.
4. In Vercel choose **Add New → Project → import the GitHub repository**; deploy with the detected Next.js settings.
5. Use Vercel Preview Deployments to review changes; production follows the repo's production branch.
6. Provide me with the GitHub repo URL and Vercel URL when available. If the agent cannot access an authenticated GitHub/Vercel account, provide exact commands and steps; **do not claim the repo or deploy exists until it does**.

---

## 8. Functional acceptance criteria

The project is considered usable when:

- [ ] The website runs, builds and deploys without runtime errors.
- [ ] An actual **animated, pausable prize conveyor belt** exists, not just a generic carousel.
- [ ] Players can go through the show without reading the spreadsheet.
- [ ] A guess can be entered and the correct *indicative* price revealed.
- [ ] Correct trip dates, number of nights, departure airport and quote caveats appear.
- [ ] An unpriced itinerary **never** displays a fabricated or borrowed price.
- [ ] The same city with multiple date choices appears as one destination with a selectable itinerary.
- [ ] KEEP/MAYBE/BIN decisions persist after refresh and can be changed.
- [ ] Grand Final compares favourites and lets us copy/export the shortlist.
- [ ] There is a practical **Sensible mode** for later booking research.
- [ ] Works comfortably on iPhone Safari and desktop; buttons are thumb-friendly and keyboard accessible.
- [ ] All motion can be reduced or skipped, and sound starts off.
- [ ] Photography loads or uses attractive fallbacks; layout has no horizontal page overflow.
- [ ] Flight/hotel buttons point only to real available source URLs and warn that prices need rechecking.
- [ ] README explains how to edit trip data, update a price, run locally, and deploy.

### Quality checks to perform

- Test at narrow mobile width and at desktop widths.
- Test with empty shortlist, one finalist, all kept, all rejected.
- Test missing imagery and missing flight fares.
- Test a changed Kaunas itinerary: **price, dates, nights and guess state all update together**.
- Test reloading the page midway through play.
- Run `npm run build` and include at least minimal automated checks for date eligibility and total price logic.

---

## 9. Scope and priorities

### P0 — Deliver this first

Distinctive visual theme, functional conveyor, 12–15 researched destinations, price guessing/reveal, choices, persisted state, final shortlist, honest flight caveats, Vercel-ready build.

### P1 — Strong nice-to-haves

Alternate 4/5-night itinerary toggles; share shortlist as text/CSV; atmospheric transitions; custom micro-animations; score/badges; a handful of good original host voice-lines (text only by default); category filters.

### P2 — Optional later

Independent voting on two phones, shared session links/QR codes, live synchronized results, live flight/room price refreshes through legitimate APIs, live booking availability, weather data, multi-player scoreboard and advanced itinerary planner. **Do not implement these at the expense of finishing P0.**

---

## 10. Agent working instructions

1. **Read the spreadsheet carefully** before generating final data. Check the sheet names and distinguish priced options from merely scheduled flights.
2. Make sensible creative decisions independently. Don't block on minor design questions; the brief already establishes the style, mechanics, scope and audience.
3. Implement rather than returning a long design proposal. Deliver working source code with a playable user journey.
4. Be attentive to **actual usability**: theatrical but fast, funny but not irritating, legible, quick to revisit.
5. If source data is missing, scaffold honestly with the seed table and document exactly what remains unverified.
6. Do not invent weather forecasts, flights, accommodation inventory, prices or booking links.
7. Finish by reporting: completed features; test/build result; source data status; any unresolved limitations; how to deploy or access the deployed site.

### One-paragraph prompt to paste alongside this file

> Build the website described in `The_Great_January_Getaway_Claude_Build_Brief.md` using my attached latest January holiday spreadsheet as the authoritative data source. Treat this as an implementation task, not just a design consultation. Create an original tongue-in-cheek British game-show aesthetic with a real animated conveyor belt, holiday price guessing, Keep/Maybe/Bin voting, and a polished final comparison. Prioritise iPhone, honest fare provenance, and a Next.js/TypeScript repository that deploys cleanly to Vercel. Make reasonable decisions where unspecified, test the result, and do not invent missing travel data.

---

**Editorial goal:** I want the other person to laugh at the silliness, become genuinely excited by the places, and end up with a sensible decision about where we're going in January.
