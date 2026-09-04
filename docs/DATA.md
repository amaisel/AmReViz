# The data, and what it does not say

Every figure in this project comes from a cited public source, and most of them
are estimates. This page records where each one comes from and what it covers,
because the most common way to misuse a number here is to add it to another one
that was counted differently.

## The events

47 events, 1765–1783. Each carries a title, a date (or date range), a location
with coordinates, a type, a short account, a note on why it mattered, and a link
to its source.

| Type | Count | What it covers |
|---|---|---|
| Battle | 24 | Engagements and sieges |
| Political | 14 | Congresses, acts, declarations, constitutional milestones |
| Military | 5 | Campaigns, encampments and evacuations — armed activity that was not a single engagement |
| Diplomatic | 4 | Treaties, alliances and missions abroad |

The line between Battle and Military is where the estimates stop: every one
of the 24 battles carries an outcome and 23 of them carry force and casualty
figures, while no Military event carries either. Valley Forge, the Sullivan–
Clinton campaign, the two evacuations and the Spanish Gulf campaign are army
activity spread over weeks or months with no single engagement to count.

23 of the 47 carry force and casualty estimates. 18 carry a period image, each
credited to its Wikipedia source. Five happen in Europe — the Proclamation of
Rebellion, Franklin's arrival at Passy, the Treaty of Alliance, the Commons
vote against the war, and the Treaty of Paris — and the map widens to reach
them rather than pretending the war was fought only on the seaboard.

### Turning points

The Explore view's "Turning Points" filter is a judgement, not a category. It
used to be every battle plus the four diplomatic events — 28 of the 47, and a
strict superset of the "Major Battles" filter beside it — which named a
judgement the data never made.

One test decides membership: **the war's direction, its aims, or the balance of
forces measurably changed here.** Not the biggest engagement, not the bloodiest.
By that test the set is 13 events, each carrying its reason in the data as
`turningPoint`:

| Year | Event | Why it turns |
|---|---|---|
| 1775 | Battles of Lexington and Concord | The dispute becomes a war |
| 1776 | British Evacuation of Boston | The army's first strategic victory, and the British quit New England for good |
| 1776 | Declaration of Independence | The aim changes from redress to independence |
| 1776 | Battle of Trenton | Stops the rout after New York and keeps the army in being |
| 1777 | British Surrender at Saratoga | A whole British army surrendered; it brought France in |
| 1777 | Valley Forge Winter Encampment | The army that marched out was retrained, and held the line at Monmouth nine days later |
| 1778 | Treaty of Alliance Signed with France | A colonial rebellion becomes a European war |
| 1780 | Battle of Kings Mountain | Breaks Loyalist recruiting and stalls the southern strategy |
| 1781 | Battle of Cowpens | Costs Cornwallis his light troops and starts the march to Yorktown |
| 1781 | Battle of the Chesapeake | The French fleet seals the bay; without it there is no siege |
| 1781 | Siege of Yorktown | Ends major operations in North America |
| 1782 | The Commons Votes Against the War | Britain gives up the war and opens negotiations |
| 1783 | Treaty of Paris Signed | Independence recognised, and the war formally over |

It spans battles, a declaration, a treaty, an encampment and a vote in the
Commons, so no combination of the four event types describes it — which is why it is a flag on
the event rather than a filter over types. Each event keeps the source already
cited on its card; the selection is editorial, and arguing with it means
arguing with the reasons above rather than with a number.

Two of the thirteen were added after the first pass left them out, and the
omission is worth recording because it shows what the test does when applied
carelessly. Boston and Valley Forge both fail a reading of "the balance of
forces changed" that only counts armies destroyed and territory taken, and both
pass the one the sources actually support: the [National Park
Service](https://www.nps.gov/articles/000/dorchester-heights-history.htm) calls
Dorchester Heights "the first major strategic and political victory" for the
Continental Army and "one of the most pivotal events of the Revolutionary War",
and describes [Valley Forge](https://www.nps.gov/vafo/learn/historyculture/valley-forge-history-and-significance.htm)
as one of the war's turning points because the army that marched out of it
could stand against British regulars at Monmouth nine days later. A set chosen
for strategic causation alone drifts toward the end of the war, where the chain
to Yorktown is easiest to trace, and quietly drops the years when there was a
question of whether an army would survive to fight at all.

Reaching an event outside the set — by search, by a link, or from the data
view — brings the rest of the story back rather than refusing to show it.

### Linking to an event

The address bar names an event by its slug, taken from the title:
`#/explore/battle-of-bunker-hill`. Slugs are stored on the record rather than
derived at run time, so a later rewording of a title does not break links
already shared. A data interlude shares the URL of the event it follows.

Each event also carries a numeric `id`. It is an internal key, not a position:
the first 18 events were numbered 1–18 and the 29 added later took 101–129, so
that nothing already pointing at the first block had to move. Links written
before slugs — `#/explore/105` — still resolve, and are rewritten to the slug
on load.

### Where the events come from

| Source | Events |
|---|---|
| [American Battlefield Trust](https://www.battlefields.org/learn/revolutionary-war/battles) | 23 |
| [National Park Service](https://www.nps.gov/subjects/americanrevolution/timeline.htm) | 16 |
| [National Archives](https://www.archives.gov/) | 5 |
| [Office of the Historian, Department of State](https://history.state.gov/) | 2 |
| [United States Senate Historical Office](https://www.senate.gov/) | 1 |

## The war-wide figures

The three headline numbers in the data view come from one series:

| Figure | Value | |
|---|---|---|
| U.S. servicemembers | 217,000 | median of an estimated 184,000–250,000 who served |
| Recorded battle deaths | 4,435 | |
| Non-mortal woundings | 6,188 | |

Source: [U.S. Department of Veterans Affairs — *America's
Wars*](https://department.va.gov/americas-wars/).

**What that series does not cover.** It counts U.S. servicemembers. It does not
count every Patriot, allied, Crown, Indigenous or civilian loss, and its death
figures rest on incomplete returns. Disease killed far more than combat in this
war, and the number above is battle deaths only.

**These are not the sum of the engagements listed elsewhere in the app**, and
adding the per-battle casualties will not reproduce them. The engagements are a
selection, they are counted on a different basis, and they include both sides.

## The aggregate series

| Series | Source |
|---|---|
| Annual American manpower | [U.S. Army Center of Military History — *History of Military Mobilization*](https://history.army.mil/portals/143/Images/Publications/catalog/104-10.pdf) |
| Colonial trade with England | [U.S. Census Bureau — *Historical Statistics, Colonial Times to 1957*](https://www2.census.gov/library/publications/1960/compendia/hist_stats_colonial-1957/hist_stats_colonial-1957-chZ.pdf) |
| Battle estimates | [American Battlefield Trust](https://www.battlefields.org/learn/revolutionary-war/battles) |
| Chronology | [National Park Service](https://www.nps.gov/subjects/americanrevolution/timeline.htm) |

**Annual troop totals are higher than the army present at any one time.** Short
enlistments, militia tours and reenlistments could count the same person more
than once in a year, and across years many times over. The chart is a measure
of turnover as much as of strength.

**The trade figures are an index, not market values.** The Census recommends
them as a relative series; the pound figures are official values, not prices
anyone paid.

**Militia records are fragmentary.** The source labels part of that series
conjectural, and the chart says so under it.

## Reading the battle estimates

Casualty counts for this period mix killed, wounded, missing and captured, and
different sources draw those lines differently. A "casualty" figure is not a
death toll.

Ten events carry a "reading the numbers" note for exactly this reason, and they
are the ones where the raw figure misleads most. More than 5,000 of the American
total at Charleston were troops captured at the surrender. The Crown total at
Yorktown includes the army that surrendered on 19 October. Nobody was killed at
all in the capture of Fort Ticonderoga — the Crown "casualties" are its 48-man
garrison, taken prisoner. Known Crown casualties at Oriskany omit many
Indigenous losses. At Kings Mountain, with one exception, Americans fought
Americans.

**"American / allied" and "Crown / allied" are comparison columns, not claims
about nationality.** French soldiers, engineers, artillery and money were
decisive at Yorktown; Hessian regiments fought through the middle campaigns;
Loyalist units were American; Indigenous nations fought on both sides and for
their own reasons; Spain fought Britain in the Gulf. The story cards name those
forces where the record supports it, and the `combatants` field on an event
overrides the default column labels when it matters.

## The map geometry

Coastlines, lakes and rivers derive from [Natural
Earth](https://www.naturalearthdata.com/), pulled through `us-atlas`,
`world-atlas` and `natural-earth-geojson` and generated into
`client/src/data/geo/` by `client/scripts/build-geo-data.mjs`. Do not
hand-edit those files; rerun the script.

Two deliberate choices are recorded in `ROADMAP.md` and worth repeating here.
European geometry comes from the coarse 110m set and is **not** run through a
second simplification pass — that shredded the Channel and the Breton and
Iberian coasts into loose triangles. And the land silhouette is generated on
wider bounds than the water, because at minimum zoom the viewport is wider than
the map's own bounds and the clipper's straight cut would otherwise show as a
false coastline.

Colony boundaries are approximate period outlines for orientation, not survey
lines. Borders in this period were contested, overlapping and in several cases
simply unmapped.

## Corrections

If a figure here is wrong, the useful report names the event or chart, the value
shown, the value you believe is right, and a source. The events live in
`client/src/data/events.js` and the aggregate series in
`client/src/data/metrics.js`, each with its `source` alongside the number, so a
correction is usually a two-line change plus a citation.
