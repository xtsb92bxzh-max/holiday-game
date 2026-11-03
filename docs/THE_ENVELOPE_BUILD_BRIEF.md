# The Envelope: build brief

The brief as given for this mode, kept for reference beside the other games' briefs.

---

Build an additional mode for my existing holiday-choosing game: a playable choose-your-own-adventure story that uses the player's decisions to recommend a holiday.

Inspect the existing app first and integrate this mode into its current design and navigation. Preserve the existing game.

## The experience

The player should feel they are taking part in a story. Their choices should reveal what they enjoy about travelling, without directly asking them to choose a destination.

Aim for a complete playthrough of around 5–8 minutes, with 8–12 decisions and three options at most decision points. Write for an adult audience, using atmospheric prose, occasional dry humour and concise passages that work well on a phone. Avoid personality-test clichés and excessive fantasy terminology.

Starting premise:

> You arrive in an unfamiliar city with five nights free and an envelope left for you at reception. Inside is a hand-drawn map, a key and a note: "There is more than one way to find what you came for."

The city remains unnamed. Its streets, people and opportunities gradually change in response to the player's choices. Give the player a satisfying objective and resolution, regardless of which destination they ultimately receive.

## Meaningful choices

Each choice should affect what happens next. Some open distinct scenes; others change a character's response, reveal information or create a later callback. Branches may rejoin, but the player should notice that their decisions mattered.

Preferences to explore:

- Slow wandering versus a full day of planned activities.
- Outdoor light and coastal space versus atmospheric interiors.
- Historical depth versus everyday local life.
- Staying in one place versus discovering a second city.
- Familiar comforts versus curiosity about somewhere new.
- Lively evenings versus quiet recovery.
- Willingness to spend time travelling for a particular experience.

Avoid making each answer an obvious destination label. Do not consistently give one option more appealing writing than the others. Include a few genuine trade-offs.

Example of the tone:

> The bookseller recognises the mark on your map. She can explain it over coffee, but the next train leaves in forty minutes. Outside, the rain has stopped for the first time all morning.

- Stay and hear what she knows.
- Take the train and follow the address on the envelope.
- Walk towards the river, where you spotted the same mark earlier.

## Destination shortlist

Initial, editable candidates:

- Málaga, five nights in one base.
- Kraków, five nights in one base.
- Gdańsk for three nights, followed by Poznań for two.
- Rzeszów for one night, followed by Kraków for four.

The trip is in January. Do not present Málaga as a guaranteed beach holiday or Poland as guaranteed snow. Keep destination profiles and practical travel information separate from the story.

## Recommendation logic

- Track several preference dimensions behind the scenes. Choices should usually influence more than one.
- Use a consistent, inspectable scoring method. Every destination must be reachable through a plausible playthrough. Longer branches must not gain an unfair advantage.
- Do not infer budget, cold tolerance or willingness to take an early flight from fictional behaviour. If those matter, offer a short, clearly labelled practical check after the story.
- If the top two are close, acknowledge that. Offer one final story decision that distinguishes them, or present both as credible matches.
- Keep scores hidden during play. No claims of scientific validation and no invented confidence percentages.

## The ending

Resolve the story before revealing the recommendation. Then show the best match and night split, a short explanation referring to specific decisions, a picture of how the holiday could feel, the main compromise, and a runner-up with the preference that would make it the better choice. Use "Your choices suggest…" rather than a fixed personality type.

Let the player compare the top two, revisit a choice, replay the story or return to the existing holiday comparison.

## Implementation

Use the existing technology and visual style. Support keyboard navigation, readable contrast and reduced motion. Save progress locally with a clear restart. Keep scenes, choices, scoring rules and destination profiles easy to edit. Include a development-only view showing how each decision affected the recommendation.

Do not invent prices, flight availability or opening times. Use existing verified travel data where available, with its date checked; otherwise leave practical details explicitly unconfirmed.

Deliver a complete playable story with all endings written. Check that every path finishes, every destination is reachable, backtracking correctly reverses scores, and the final explanation accurately reflects the player's choices.
