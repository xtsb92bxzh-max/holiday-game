# THE GREAT BRITISH GETAWAY SHOW
## Claude coding-agent build brief — Version 3 · 24 October 2026

> **Build the real website, not a concept, prototype screenshot, or another brief.** Deliver a working, polished, mobile-first game using the accompanying January 2027 holiday data, commit it to the user's GitHub repository when access is authorised, and make it deployable to Vercel. The jokes are frivolous; the itinerary data must not be.

**Project:** A tongue-in-cheek, late-1980s/early-1990s British TV game-show parody that helps two people choose a January European getaway.  
**Title:** **THE GREAT BRITISH GETAWAY SHOW**  
**Tagline:** *Tonight, twelve cities enter. Two indecisive adults leave.*  
**Secondary line:** *Flights, frights and unnecessarily dramatic price reveals.*  
**Format:** Catchphrase-like picture reveals + higher/lower price games + dartboard-style wildcard selection + a grand final, all with original branding.  
**Platform:** iPhone Safari first; responsive desktop.  
**Stack:** Next.js App Router, React, TypeScript, Tailwind CSS; GitHub → Vercel. Use small animation/icon libraries only where useful.  
**Source vintage:** Holiday research recorded 23 October 2026; not a live fare or booking feed.  
**Input attachments:** `January_2027_Europe_Holidays_Updated_Flexible_Flight_Times.xlsx` (authoritative) and `Great_British_Getaway_Show_Travel_Data.json` (convenient structured export of all 45 *Viable itineraries* rows).

---

## 1. The creative direction

Imagine an inexplicably elaborate British Saturday-evening TV special filmed in a village-hall-sized studio in 1989. A fictional, disconcertingly confident host uses enormous lettering, dry one-liners, cheap gold starbursts, and astonishingly consequential suspense to decide between Prague and Kaunas. The prize is a real holiday *which the contestants pay for themselves*.

This is **not** a straight holiday Tinder clone and **not** the earlier *Blind Flight* dating-show concept. It's a sequence of very short original mini-games with a genuinely usable holiday shortlist at the end.

**Product principle:** The games make comparison entertaining; they must not randomly dictate the destination. Both travellers' expressed preferences and the real prices/flight practicalities decide what makes the final shortlist. A user who hates quizzes must still be able to browse and decide in under two minutes.

### Voice / humour

- Mock-authoritative, knowingly silly, dry British comedy. The host refers to flights and prices with scandalous seriousness.
- Illustrative copy: **“The jackpot is a four-night holiday. The twist is you have to pay for it.”**
- Roast suspiciously long airport transfers, aggressive 06:00 departures, 4 pm winter sunsets, overconfident claims of winter sunshine, and the cost of Copenhagen coffee; never nationality, ethnicity, disability or accents.
- Keep information credible even when the presentation is ridiculous. One good joke per screen beats five AI-generated jokes.
- Write **original** presenter lines, music (if any), art, mechanics and UI. The historical programmes are inspiration only: **do not reproduce their names as branding, logos, TV theme music, actual presenters' likenesses or voices, exact sets, trademarks or famous scripted catchphrases**.

### Art direction / identity

- Palette: ink/navy `#192943`, battered teal `#196C73`, tomato red `#C95140`, custard gold `#F3C44E`, warm paper `#FFF7E6`, nearly black `#141B29`.
- Original hand-made-feeling wordmark: monumental condensed/rounded display lettering, thick cream outline, faux brass plate, pinstripe/starburst/light-bulb details. Avoid using exact vintage show logos.
- Original fictional channel bug: `GBC — GETAWAY BROADCASTING CORPORATION` (make clear fictional, not BBC or ITV). Maybe a humorous `Series 1 • Episode 1 • Almost certainly cancelled` footer.
- Main show stage: velvet-like curtain / studio floor / light-up sign; don't let decoration overwhelm cards and legibility.
- Prefer strong, accurate destination photography after reveals and stylish silhouetted / tiled original art before reveals. No recognisable photo should accidentally spoil a location supposedly still hidden.
- Animations: tile flips, stage curtains, large numbered price cards, spinning categories, spotlight for winner. Duration typically 200–500 ms, skippable; no strobe effects. Sound off by default, optional and muting persistent.
- All essential text must work without video, sound or motion, and with low-bandwidth images.

### Opening title screen

> **THE GREAT BRITISH GETAWAY SHOW**  
> *Tonight, twelve cities enter. Two indecisive adults leave.*  
> “From Glasgow or Edinburgh to a place with slightly better cafés, we bring you the cheapest entertainment on television. Not necessarily the cheapest flights.”

Primary CTA: `ROLL THE TITLES`  
Secondary CTA: `SKIP THE NONSENSE — SHOW HOLIDAYS`  
Tertiary: `WHAT DO THESE PRICES INCLUDE?`

---

## 2. What the game is trying to decide

**Two travellers**, sharing one double/twin room or apartment, choosing a European break. Depart **Glasgow (GLA)** or **Edinburgh (EDI)** on **Sunday 17 or Monday 18 January 2027**; return **Thursday 21 or Friday 22 January 2027**. Minimum **four nights**; valid combinations are `17→21`, `17→22`, `18→22`. Flight departure and arrival *clock times are flexible*; the earlier morning-out / afternoon-back cut-offs were preferences, not hard exclusions.

Prioritise **overall value** rather than the cheapest possible fare. Useful features: food, bars, cafés, attractive historic neighbourhoods, authentic local experiences, culture/architecture/history, cosy winter atmosphere, perhaps a warm-weather alternative. Include Poland, the Baltics and lesser-known cities as well as the obvious European capitals. **Exclude Jordan and Croatia**, as previously requested. Previously visited places can appear with a repeat-trip caveat rather than being silently excluded.

### Source authority and price truth

The workbook `January_2027_Europe_Holidays_Updated_Flexible_Flight_Times.xlsx` is the source of truth. **Actual sheet names** are:

1. `Shortlist` — 20 previously priced itinerary combinations.
2. `Viable itineraries` — **45 itinerary rows**: **20 with an indicative dated flight + room + allowance estimate** and **25 without a complete total**; this contains hotel names, review scores, evidence qualifiers, hotel/flight URLs and warnings.
3. `Connections to verify` — search ideas that are *not yet validated as priced itineraries*.
4. `Destination guide` — editorial notes and January cautions.
5. `Uploaded outbound` and `Uploaded return` — the original user's restricted-time timetable (incomplete for other clock times).
6. `Method & assumptions` — evidence hierarchy, constraints, allowances and limitations.

The companion JSON has been mechanically derived from `Viable itineraries`, preserves all 45 rows, stable source itinerary IDs `EU001` etc., prices, links, property, route notes, and `null` missing values. Use the JSON for initial implementation; cross-check original workbook where possible. Don't replace workbook facts with invented fare search results.

**What the estimated total means:** `estimatedWithExtrasForTwoGBP` = indicative return flights for **two** + one shared hotel/apartment for the entire stay + *illustrative* baggage/transfer allowances. The workbook typically adds **£100 total** for baggage and ground transfer estimates, but trust the actual value in each row. This is **not** the total holiday spending budget: meals, entertainment, sightseeing and UK airport transport are excluded. Show both **total for two** and **per person**; exact number on detail screens, rounded pounds on game-show placards. Do not add extras a second time.

**Date and confidence:** Observations were researched around **23 October 2026**; many fares were indexed dated quotes rather than rechecked live inventory. Never call them current, live, guaranteed, held, confirmed bookable or immediately available. Make the caveat available on *every* pricing reveal and in comparison. Put external booking links beside each relevant hotel/flight for **checking current prices**.

**Missing quotes:** Source `null` remains `null`. A timetable + hotel quote **does not** justify calculating a whole-trip cost. Label those contestants `Flights unpriced — total unknown`; show hotel-only and timetable data separately. They are valid *wildcards* but cannot take part in a higher/lower price duel or a numerical best-value ranking.

**Direct flight evidence:** Source descriptors may say `Direct; times not reconfirmed`, `Scheduled direct pair in uploaded file`, `Connecting; times not reconfirmed`, or `Direct + ground`. Preserve the differences. Do not upgrade timetable evidence into verified seat availability, or hide a connection to make a contestant more attractive.

**Dates/variants:** Several itineraries share a destination (especially 4- and 5-night Kaunas). One destination = **one vote and one show contestant**, with a date/itinerary variant selector. Selecting a new variant must change cost, hotel, airport, transport caveats, external links and reset any price-game reveal state. Paris via Beauvais and direct Paris/CDG must be represented as one Paris destination with different itineraries, not silently conflated into one airport itinerary.

---

## 3. The show: short acts rather than a laborious quiz

A typical complete game should feel like **6–10 minutes**, not a 30-minute slideshow. The interface includes `Skip round`, `Reveal now`, `Previous`, `Skip animation`, and `Go to sensible comparison` at every stage. The whole show is optional.

### PRE-SHOW: “Members of the audience”

Choice of:

- **Two-person edition (default):** Two travellers participate together in the stage games, then each completes an **independent Keep / Maybe / Pass ballot on the same phone**. Names/nicknames optional. Local-only saves; no account, internet-dependent backend or hidden data collection.
- **Quick edition:** One shared set of choices and a final shortlist. Do not fabricate two-person matches.

Sound default `off`, motion preference respected. Add `Resume show` if a saved session exists, plus `Start again` requiring confirmation. Start at 12 featured distinct priced destination concepts, with optional expansion. Keep a visible approximate progress indicator.

### ROUND 1 — “CATCH A FLIGHT” (destination picture reveal)

**Inspiration:** Slowly revealing picture puzzles; build your own original tile-reveal mechanic and branding rather than a copy of any TV screen.

Each of **~12 distinct destinations** appears as an obscured photo/postcard covered by large numbered tiles or original stage panels. One or more tiles flip away after `SHOW ME A BIT MORE`, giving room for an amusing oral guess. Reveal a grounded clue at each step: e.g. region, distinguishing landmark, food, climate. The city can always be revealed immediately; guessing the identity is entertainment, not a geographical knowledge test.

After reveal, each contestant gets a polished 10-second information card:

- City + country; correctly matched hero photo; one evocative sentence about the place.
- **Three interesting reasons** to visit, genuinely sourced from destination guide/editorial material.
- **“The catch”**: one unambiguous practical downside (cold / short daylight / connection / long ground transfer / source timing unverified / expensive local spend).
- Date + nights + UK airport and clearly labelled flight confidence.
- `ADD TO MY POSSIBLES`, `NOT FOR ME`, or `KEEP WATCHING` *as informal quick bookmarks only*. These must **not** replace the later private two-person ballots.

Optional small original “studio points” for early guesses; always show **NO INFLUENCE ON THE HOLIDAY RESULT**. No aggressive timed questions; if using a timer, it must be opt-in and pauseable.

**Suggested opening cast, balanced across price and style** (one selected itinerary per unique destination):

| Broadcast group | Destinations | Why this grouping is funny/useful |
|---|---|---|
| **The Bargain Basement** | Wrocław, Kaunas, Warsaw | Strong value; surprisingly distinct holiday types |
| **Ye Olde Cobblestones** | Kraków, Prague, Gdańsk | Architectural atmosphere and food; Gdańsk connection caveat |
| **The Baltic Freeze & Other Financial Errors** | Tallinn, Copenhagen, Vilnius via Kaunas | Cold-weather appeal; Copenhagen higher spending; Vilnius transport |
| **The Escape Committee** | Málaga, Paphos, Tenerife South | Milder or genuinely warmer alternatives, but very different travel practicality |

Use the cast as editorial defaults, not an immutable hardcoded limit. Enable `MORE DESTINATIONS` to access the other priced places (e.g. Berlin, Pisa/Florence, Munich, Rome, Porto, Paris via Beauvais, Luxembourg), and unpriced possibilities as labelled wildcards (Venice, Helsinki, Madrid, Amsterdam, Poznań etc.).

**Important:** A location image must not be ambiguous or misleading: no sunny beach photograph for an inland Tenerife hotel, no photograph of Vienna captioned Bratislava without explaining the connection.

### ROUND 2 — “PLAY YOUR FLIGHTS RIGHT” (higher or lower)

**This is the signature price-game moment.** Present the first destination's *estimated total for TWO including the source's illustrative extras*. Then show another attractive destination. The question: **“Is the next holiday HIGHER or LOWER?”** Buttons `HIGHER`, `LOWER`, `SHOW BOTH PRICES` (skip), with exaggerated original flip-card animation and deadpan host line.

Run **5 or 6 price duels**, drawn deterministically from available **distinct priced destinations**. A sensible sequence should vary price bands, destination types and the difficulty of the comparison. Never use two alternative dates for Kaunas as separate cities. Avoid trivially ordered pairs that always go from cheapest to dearest. Randomise **presentation order** optionally, but keep prices linked to their own itinerary IDs.

**Example price ladder (rounded for theatre, exact in details):**

- Wrocław **£298** vs Prague **£421** → Higher.
- Copenhagen **£494** vs Kraków **£410** → Lower.
- Tallinn **£521** vs Málaga **£552** → Higher.
- Tenerife South **£592** vs Kaunas **£384** → Lower.

Each reveal panel must show `Estimated package comparison for 2 • research dated 23 Oct 2026`, and expandable breakdown: return flights ×2, accommodation total, illustrative extras, dates, source evidence, and explicit exclusions from the estimate. A cheeky `GUESS IT TO THE POUND` bonus can accept a number but is entirely optional. Do not turn this into an exact-quote live shopping game.

Sample host lines:

- Right: “A completely pointless point, but beautifully earned.”
- Wrong: “A difficult moment for the nation's amateur travel economists.”
- Higher: “The finance department is looking nervous.”
- Low price: “A remarkable saving, provided that flight still exists.”

**No favourites are eliminated because of a wrong guess.** This round educates both people about relative costs.

### ROUND 3 — “THE HOLIDAY BULLSEYE” (the wildcards)

**Inspiration:** Darts-and-prizes television spectacle. Build a distinct original segmented travel board, no borrowed mascot, board design, logo, prize characters or theme music.

Show a playful **six-category target board**, with segments such as:

1. `CHEAP AS CHIPS` — lowest verified two-person starting estimates.
2. `VERY OLD BUILDINGS` — historic towns and architecture.
3. `POSSIBLY HYPOTHERMIA` — Baltics / Nordic winter character.
4. `I REQUIRE SUNSHINE` — winter-sun and milder alternatives.
5. `EAT YOUR WAY ROUND` — food, markets, cafés and local cuisine.
6. `THE CURIOUS WILDCARD` — destinations present in schedule evidence but **not priced**.

Tapping a segment (or optionally pressing **THROW THE DART** for a clearly random category) surfaces **one or two additional correctly categorised destinations not already shown**, with a full detail panel. If no eligible destination remains in that segment, show a friendly `ALL PRIZES CLAIMED` and allow another pick. The wildcards can be bookmarked for further fare research or added to the later ballot with `price unknown` plainly visible; they cannot be included in a price duel or declared better value than priced entries.

Do not have a dart's random landing decide the real holiday. This is *discovery*, not a rigged roulette. The manual category picker is the accessible alternative to the spinning animation.

Host line: **“And the grand prize is… the opportunity to arrange your own baggage allowance!”**

### ROUND 4 — “THE NATION HAS VOTED” (independent preferences)

This is the heart of the practical decision, after users have had fun seeing places and real figures.

In **two-person edition**:

1. Give **Traveller A** the 12 featured destinations (plus any explicitly added wildcards) as polished, compact cards with full real prices/status, photographs, main reasons, and the catch. Traveller A chooses **YES / MAYBE / NO** for each. It should be possible to revisit and change responses.
2. Show an interstitial: **“Pass the phone. No peeking. The votes are being counted in a disused office above the studio.”** Make it clear Traveller A's votes are hidden.
3. **Traveller B** sees the same destinations and facts, but not A's choices. Traveller B votes independently.
4. Show `REVEAL THE RESULTS` and categorise outcomes:
   - **Two YES votes:** `THE PUBLIC HAVE SPOKEN` / **Mutual favourite**.
   - **YES + MAYBE / MAYBE + MAYBE:** `A GROWER, NOT A SHOWER` / **Worth discussing**.
   - **YES/MAYBE opposed by NO:** `CONTROVERSY IN THE STUDIO` / **Disagreement**.
   - **Two NO votes:** `DID NOT MAKE IT PAST THE AUDITIONS` / **Rejected**.
   - Missing ballot: **Not voted** — never silently classify as NO.
5. The user can revise either ballot later. Provide a private edit mode that does not expose the other's historical choices until an explicit reveal step.

In **quick edition**, use one ballot and `Favourites / Maybes / Passes`; do not call results a two-person match.

**Deterministic, visible ranking:** Prioritise mutual YES, then mutual/mixed maybes, then explicit user-selected wildcards. The prices, sample guess points and target-board luck **must not** overpower user preferences. Ties can be resolved by a user-selected head-to-head comparison, not a hidden random score. If no mutual YES, show the strongest maybes/disagreements and a way to reconsider; don't force a fictitious winning couple.

### GRAND FINAL — “HERE'S WHAT YOU COULD HAVE FLOWN”

Compare **up to three** user-selected finalists. Make this the best genuinely useful page in the whole project, not another bit of television theatre.

For each finalist show:

- Destination hero + vibe summary; winter advantages and disadvantages.
- Chosen itinerary and date variant: depart/return **exact 2027 dates**, UK departure airport, nights, known flight timings or `not yet reconfirmed`, and connection/ground transfer caution.
- Room/hotel **name**, out-of-10 rating where sourced, neighbourhood if known, accommodation total for both.
- **Indicative return-flight fare per adult**, **estimated total for both with extras**, **per-person estimate**, plus what's specifically omitted. For missing fare use `TOTAL UNKNOWN` and a separate hotel-only price; don't include it in the numerical cheap-to-dear graph.
- Main travel booking-source links, visible `Recheck price / timings before booking` CTA; verify hrefs, don't invent links or claim they reserve inventory.
- `Why this could win` and `What's the catch` from grounded editorial data.
- Optional user-controlled filters/ranking of finalists: `Cheapest estimated starter trip`, `Simplest journey`, `Most time there` (only if flight timings known), `Winter escape`, `Cafés & culture`. Mark uncertain comparisons `not comparable`.

Selection of the winner is **explicit**, made by the users. Fire brief original confetti / spotlight and show a ridiculous prize certificate:

> **CONGRATULATIONS. YOU HAVE WON THE RIGHT TO BUY TWO PLANE TICKETS.**  
> **Winner:** [destination]  
> [17–22 January trip dates; nights; indicative total; caveat]

Allow `Print / save as PDF` using browser print styles, `Copy comparison` to clipboard, and `Copy/share the shortlist` as a formatted text summary. Local game state is not automatically synchronised between devices. Sharing a read-only summary can be done entirely client-side; do **not** pretend a dynamic sharing link works without a real backend or URL-encoded data design.

**Always include a button: `ENOUGH NONSENSE — SEE THE TABLE`.** It goes to a clean, sortable/filterable *all eligible itineraries* list. The site must still be useful after the game has been played once.

---

## 4. Source dataset and example prices

The attached `Great_British_Getaway_Show_Travel_Data.json` contains all 45 records (20 priced, 25 fare-unpriced); use it as the initial static source. Rows include exact hotel names, URLs, flight provenance and caveats. **Do not hand-type prices when the JSON is provided.** Keep source IDs as stable keys and add an editorial `destinations.ts` file for accurate descriptions, image metadata, clues and categories.

**Priced comparison cheat sheet — workbook snapshot, GBP for both people with illustrative extras:**

| Destination | Dates in January 2027 | Nights | From | Estimated total for TWO |
|---|---|---:|---|---:|
| Wrocław | 18–22 | 4 | GLA | £298.18 |
| Kaunas | 18–22 | 4 | EDI | £384.37 |
| Warsaw | 17–22 | 5 | EDI | £391.01 |
| Kaunas (date variant) | 17–22 | 5 | EDI | £402.87 |
| Gdańsk | 17–22 | 5 | EDI | £407.21 |
| Kraków | 17–22 | 5 | EDI | £410.19 |
| Vilnius via Kaunas | 18–22 | 4 | EDI | £418.22 |
| Prague | 17–22 | 5 | EDI | £420.89 |
| Pisa / Florence base | 18–22 | 4 | EDI | £469.86 |
| Berlin | 18–22 | 4 | EDI | £470.76 |
| Copenhagen | 18–22 | 4 | EDI | £494.21 |
| Tallinn | 17–22 | 5 | EDI | £521.09 |
| Paris via Beauvais | 18–22 | 4 | EDI | £530.06 |
| Málaga | 17–22 | 5 | GLA | £551.89 |
| Munich | 17–21 | 4 | EDI | £558.90 |
| Paphos | 18–22 | 4 | EDI | £567.03 |
| Tenerife South | 18–22 | 4 | EDI | £592.22 |
| Rome | 17–21 | 4 | EDI | £593.52 |
| Porto | 18–22 | 4 | EDI | £627.09 |
| Luxembourg City | 18–22 | 4 | EDI | £666.66 |

Source workbook *also* contains viable direct schedule pairs with missing complete flight fares for **Venice, Helsinki, Poznań, Madrid, Amsterdam, Alicante, Lanzarote, Gran Canaria, Barcelona, Santander, Brussels/Charleroi**, and others. These are not zero-cost holidays and should never be treated as priced packages. Some additional cities in `Connections to verify` are still *investigation candidates*, **not pre-approved or price-verified trip options**.

### Critical distinction: itinerary vs destination

Maintain two separate entities: a `Destination` (e.g. Kaunas) and one or more `Itinerary` rows (e.g. Kaunas 18–22 or 17–22). Group the two Paris airport options carefully. Do not combine different hotel/flight URLs under a misleading shared amount. Show user's preferred variant in final comparison, allowing a change.

### Editorial content directions

For the twelve initial contestants, write one original 1–2-sentence presenter setup, three true location clues (broad → specific), a sensible trip pitch, two or three highlights, and a meaningful travel drawback. Examples, **not mandatory verbatim copy**:

| Destination | Presenter setup | The awkward reality |
|---|---|---|
| Wrocław | “An old town, a modest price and absolutely no obligation to pronounce it correctly on live television.” | Price is indicative; flight timing needs checking |
| Warsaw | “Five nights and an almost indecent quantity of museums and restaurants.” | Previously indexed fare needs reconfirmation |
| Kaunas | “Baltic charm on a budget, and a plausible excuse for a train journey.” | Lithuanian winter; check actual transport to Vilnius if relevant |
| Kraków | “A city prepared to fight dirty using cafés, cobblestones and dinner.” | Recheck flight timings and fare |
| Prague | “A photogenic bridge, atmospheric bars and extremely strong old-town credentials.” | Five nights; may be more time than needed |
| Gdańsk | “A waterfront charmer with a slightly complicated travel history.” | Priced example includes a connection |
| Copenhagen | “Affordable to fly to. The actual coffees are a separate financial event.” | Expensive daily spend |
| Tallinn | “Possibly the most convincing winter fairy tale on the board.” | Short daylight and connecting itinerary |
| Vilnius via Kaunas | “Lovely streets. Minor logistical plot twist.” | Flight lands at Kaunas, onward transfer required |
| Málaga | “Sunshine-adjacent and extremely persuasive about tapas.” | Milder January, not guaranteed beach weather |
| Paphos | “Ancient ruins, sea air and serious winter escape ambitions.” | Connection on priced option |
| Tenerife South | “The only contestant who may actually have remembered what summer looks like.” | Hotel location and onward journey need checking |

**Do not promise conditions that cannot be predicted months in advance.** Photos should depict the named location accurately. Respect image licences and embed local optimised assets or approved image service URLs; do not rely on arbitrary hotlinked photo-search thumbnails.

---

## 5. Product implementation requirements

### Recommended application architecture

Use a deliberately simple, maintainable, Vercel-friendly static site. No database or login needed for MVP.

```text
app/
  layout.tsx
  page.tsx
  holidays/page.tsx              # clean all-itineraries mode
  globals.css
components/
  ShowIntro.tsx
  DestinationReveal.tsx          # picture tiles + real clue/reveal
  HigherLowerGame.tsx
  CategoryTarget.tsx
  IndependentBallot.tsx
  ResultsStudio.tsx
  FinalComparison.tsx
  PriceBreakdown.tsx
  SourceStatus.tsx
  SoundToggle.tsx
  ProgressControls.tsx
lib/
  itinerary.ts                   # safe selection, grouping and prices
  matching.ts                    # pure functions for two ballots
  formatters.ts
  game-state.ts                  # persistent versioned client state
  editorial.ts                   # typed, checked destination content
  images.ts                      # authoritative alt text + source details
  __tests__/
data/
  source/
    January_2027_Europe_Holidays_Updated_Flexible_Flight_Times.xlsx
  Great_British_Getaway_Show_Travel_Data.json
public/
  destination-images/           # optimised and licensed, not user data
  show-art/
README.md
package.json
```

The filenames may be adapted if cleanly documented. If the spreadsheet is committed to GitHub, do not place it under public assets. Use JSON as build-time/static data, not a remotely writable API. Keep any user selections local to the client.

### Suggested types (change implementation details, preserve semantics)

```ts
type FareStatus = 'priced_indicative' | 'scheduled_unpriced';
type Vote = 'yes' | 'maybe' | 'no';
type PlayerId = 'a' | 'b';
type Mode = 'two_person' | 'quick';
type Phase = 'intro' | 'picture_reveal' | 'higher_lower' | 'wildcard_board' | 'ballots' | 'results' | 'grand_final';

type Itinerary = {
  id: string;                 // stable workbook ID EU001 etc.
  destinationId: string;
  destinationLabelInSource: string;
  departAirport: 'GLA' | 'EDI';
  arriveAirport: string;
  departDate: string;         // 2027-01-17 or 2027-01-18
  returnDate: string;         // 2027-01-21 or 2027-01-22
  nights: number;
  routeEvidence: string;
  flightReturnPerPersonGBP: number | null;
  roomForTwoGBP: number | null;
  illustrativeExtrasForTwoGBP: number | null;
  estimatedWithExtrasForTwoGBP: number | null;
  fareStatus: FareStatus;
  hotel?: string | null;
  hotelRatingOutOf10?: number | null;
  sourceNote?: string | null;
  flightLink?: string | null;
  roomLink?: string | null;
  descriptionOrCaution?: string | null;
};

type DestinationEditorial = {
  id: string;
  displayName: string;
  country: string;
  categoryIds: string[];
  introLine: string;
  clues: [string, string, string];
  highlights: string[];
  caution: string;
  imagePath: string;
  imageAlt: string;
  itineraryIds: string[];
};

type GameState = {
  version: 3;
  mode: Mode;
  phase: Phase;
  playerNames: { a: string; b: string };
  presentedDestinationIds: string[];
  unlockedDestinationIds: string[];
  preferredItineraryIds: Record<string, string>;
  pictureGuessResults: Record<string, boolean | null>;
  priceDuelHistory: Array<{ leftItineraryId: string; rightItineraryId: string; guess: 'higher' | 'lower' | 'skip'; correct: boolean | null }>;
  ballots: { a: Record<string, Vote | undefined>; b: Record<string, Vote | undefined> };
  finalistDestinationIds: string[];
  winnerDestinationId?: string;
  soundEnabled: boolean;
};
```

**Persist state:** use `localStorage` with a namespaced version key and safe migration/reset. Since Next.js renders server-side, read localStorage only in browser-safe client contexts without hydration mismatch. No auth, tracking pixels, analytics or sharing of private ballots by default. `Start over`, `Resume`, `Change dates`, `Edit ballots`, `Print summary` must work.

### Images and accessibility

- Original, thematic hero images **correctly matched to destination**; use Next.js Image with correct aspect ratios, loading priority and source/licence acknowledgement where relevant.
- Puzzle clues must remain understandable to screen readers without spoiling the answer: reveal image alternative text only when user activates reveal, not while hidden in DOM with readable hidden city name.
- Keyboard-usable tile reveal, price buttons, category board, ballots; proper focus management, interactive element semantics and visible focus outlines.
- Minimum 44px touch targets; correct colour contrast; text works at larger browser font sizes; landscape and portrait responsive.
- No motion-based interaction as the only mechanism; `prefers-reduced-motion` gracefully disables flips, spins, flashes and confetti. If sound exists, off by default and user-initiated only.
- Realistic complete `alt` attributes, no `image missing` square for all key destinations at launch. UI must survive image load failure.

### Comparison algorithm / ballot logic

- **Shared preference > trivia score.** Neither the Catch-a-Flight points, higher/lower accuracy nor target-board RNG is permitted to automatically eliminate a destination or elect a winner.
- Group itineraries by destination before voting; once one city, one vote. Do not confuse Kaunas 4 nights and 5 nights or two Paris airports.
- Default finalists: all both-YES destinations (highest), then all YES/MAYBE and MAYBE/MAYBE, with manual `Add to final` options. Finalists are manually limited to three for side-by-side comparison.
- `null` votes are incomplete, **not** negative. Unpriced trips can receive votes and be finalists, but carry explicit `total unknown` label.
- Total calculations must use source `estimatedWithExtrasForTwoGBP` once; per-person `total/2` displayed to 2 d.p. or appropriately rounded. Where source is null, no total.
- A date-variant change resets relevant price mini-game reveal/duel state but should **not** erase a destination vote unless clearly justified; provide visible explanation.
- If favourites are 0, or all 12 are No, show a constructive and funny empty state with `Revisit rejects` and `Show more destinations`, not a fabricated winner.
- The source data must remain editable with future fares or hotels, and the UI should adapt without hard-coded round lengths.

### Price/evidence component (used everywhere)

Include reusable `<EstimatedPrice/>` / `<PriceBreakdown/>` / `<EvidenceStatus/>` logic. Indicative amount label: **`Estimated for two · as researched 23 Oct 2026`**; link to a short explainer. Note any route warnings on the same screen as the price. Source evidence must not be transformed into an assertion of live availability.

**Never**:

- invent a return airfare for the 25 unpriced records;
- present an unpriced hotel's cost as the trip total;
- infer outbound/return flight times from flight numbers, route labels or dates;
- conflate currency or double count allowance;
- bury baggage/transfer assumptions or room-for-two wording;
- label source date 23 Oct 2026 as a current live search;
- let a random board category exclude a genuinely preferred destination;
- use external booking redirects that point to another city or hotel without clearly explaining why.

---

## 6. Testing and delivery acceptance criteria

**Build must work before it is called complete.** At a minimum:

1. `npm install`, `npm run lint` and `npm run build` work; unit tests run, or specify the testing command and include runnable tests.
2. Title screen, picture reveal, higher/lower, wildcard board, two independent ballots, results, final comparison, and `Skip to comparison` are interactive and functional on a modern iPhone-width viewport (~375px).
3. A real source image reveals only when requested; guessing / skipped puzzles never block further progress.
4. Higher/lower correctness is calculated from source totals for *two* and never uses an unpriced option or mismatched itinerary variant.
5. Exactly one vote per destination; selecting Kaunas date alternatives does not create two contestants.
6. Traveller B cannot read Traveller A's votes before the explicit reveal (including through any visible UI or accidental in-card badge).
7. Two YES votes are a mutual favourite; a single ballot in Quick mode is never labelled a two-person match.
8. With no votes / no mutual picks, the show handles the state honestly and remains navigable.
9. All 20 source priced combinations and 25 fare-unpriced rows are represented in site data, and source IDs, hotels and links stay intact.
10. The 20 quoted `estimatedWithExtrasForTwoGBP` values match the dataset to a penny; totals/allowances are not double counted; all absent totals stay `null` and render as **unknown**.
11. The dates/airports and 4/5 nights respect the trip window; uncertain connection timings and hotel location cautions remain visible.
12. On mobile: no horizontal page overflow, no long animation trapping focus, keyboard/button alternatives to darts/swipes, sound opt-in, reduced-motion support.
13. Reload resumes the saved game; user can clear or reset; print/share summary functions do what they claim.
14. External links are real hrefs from the data. The application never claims to have booked a ticket or checked live bookability.
15. Include at least one real browser-based smoke test or document clearly how to run/play through each round; show screenshots in PR or README if possible.

### Quality bar / things to avoid

- A beautiful static home page with dead `Start the show` buttons is not sufficient.
- Don't ship infinite AI-written jokes or require 12 geography questions before any useful information appears.
- Do not rebuild a classic TV show's copyrighted branding; this is original retro-parody graphic design.
- Don't show a priced hotel room without the two-person, stay-wide context.
- Do not send the user back to a spreadsheet to find the actual booking links or warnings.
- Prefer fast polished interaction over dependencies and architecture complexity. No Supabase, paid API, user logins or server unless a real user-requested feature demands it.

---

## 7. GitHub and Vercel handover

Preferred path:

1. Set up a Next.js TypeScript application in the **user-specified/authorised GitHub repository**, or create a new repository through the user's authorised workflow when explicit access exists. Do not invent a repo URL or claim a push occurred until it succeeds.
2. Commit application, original written content, data JSON, tests, README, and only correctly licensed local image assets. If the source XLSX is placed in repo, keep it under `data/source`, not `public`.
3. Provide explicit local commands (`npm install`, `npm run dev`, `npm run build`, tests).
4. Connect repository to **Vercel** (Next.js autodetection; no backend/environment variables required for MVP). Don't claim the user has a production URL before deployment confirms it.
5. The README must document data-source date, where editorial and fare data live, how to update estimates, licensing for images, and how the user can redeploy via GitHub commits.

**No external booking transactions.** The product is a playful decision aid with dated estimates and links out to external verification.

### Delivery checklist to return to the user

- Link to committed GitHub repository / branch, if actually committed.
- Link to a live Vercel deployment, if actually deployed; otherwise clear deployment steps.
- Screenshots or brief run-through of each functioning mini-game.
- Any missing image assets or source fields clearly identified, not hidden.
- One sentence explaining price-data vintage and non-live status.

---

## 8. Implementation priority (work in this order)

**P0 — A genuinely useful holiday site:** import all 45 itinerary records; working all-holidays list, trip detail, cost provenance, date variants, images, direct external links, accessible layout.

**P1 — Fully functioning game:** original title/set, 12 pictured contestants and reveal, 5–6 higher/lower duels, category target/wildcards, two-private-ballot mode, results and manual winner selection.

**P2 — Polish:** presenter captions, beautifully paced visual transitions, optional tiny sound cues, printable winner certificate, rich save/share text, thoughtful empty/revisit states, automated tests.

If time is constrained, **ship a complete P0/P1 loop before implementing any fancy animated stage**, and tell the user exactly what is still missing. Do not represent placeholder interactions as finished features.

---

## 9. Paste this in Claude with the brief and data

> Build the full Next.js application described in `Great_British_Getaway_Show_Claude_Build_Brief.md`. Use `Great_British_Getaway_Show_Travel_Data.json` for all 45 source itinerary rows, and the supplied spreadsheet for validation. I want an original, tongue-in-cheek late-1980s British game show with functioning destination picture reveals, higher-or-lower priced-trip games, a category-target wildcard round, **private two-person voting**, and a practical final comparison. Implement the complete project, run the build and tests, and commit to the authorised GitHub repository so it can deploy to Vercel. Never invent fares or bookability; clearly identify dated indicative totals and unknown prices. Avoid making another planning document in place of working code.

