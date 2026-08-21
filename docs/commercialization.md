# Commercial viability

Last updated: 2026-08-21.

A record of where the "could this be sold" question stands, what the evidence
says, and what would have to be true for the answer to change. Written to the
same rule as `ROADMAP.md`: claims are sourced or marked as reasoning, so they
can be re-checked when they go stale.

Live version of this analysis, with the full evidence table:
https://claude.ai/code/artifact/e25116f4-ada2-45f4-a285-9fc2be884fc0

## The question

Whether the app is the basis for something sold to schools, and if not, who
else would pay. Three markets were considered — K–12, professional military
education, and Model UN/Congress. K–12 was the one worth pursuing, on the
strength of existing connections to both public and private schools.

MUN was ruled out early: it is live, multi-participant and present-tense, and
would need real-time shared state, roles, and moderation — the entire backend
this app does not have. It remains a good demo surface (a crisis map on a
projector in front of 400 delegates) but not a business.

PME — staff colleges, virtual staff rides — fits the structure well, and an
air-gapped static SPA is an advantage rather than a liability on .mil networks.
Ruled out for now on cycle length: RMF/ATO, SME historian review, and SBIR or
subcontracting as the only realistic entry. Worth revisiting if the
institutional path below works, because the content credibility earned there
is the same credibility PME requires.

## What the evidence says about schools

Two findings are close to decisive, and both are about free incumbents rather
than about the product.

**The best American history resource in the country is free.** The Gilder
Lehrman Institute's Affiliate School Program is 100% free to any K–12 school
teaching American history — free since inception, originally on an NEH
challenge grant, sustained by philanthropy. Their paid tier is $29.99 teacher
courses, not site licences. Charging for sourced American history content
means charging against an endowed non-profit that gives away more of it,
better credentialed, at zero.

**Esri gives away the mechanic, with district provisioning.** ArcGIS
StoryMaps is free for K–12 teaching and learning; districts can request a
schools bundle that provisions accounts for every teacher and student.
Lessons and MapMaker run in a browser with no account at all. Mapped
historical narrative with timelines is an advertised use case with an active
educator community. The price floor for anything a buyer perceives as
"interactive map with a timeline" is therefore zero.

**The budget year is the worst in a decade.** ESSER money is gone — states
could extend spending only to 30 March 2026. Districts stood up tools on
one-time federal money without recurring funding plans, and technology
contracts are described across the sector as first to be cut, precisely
because they are easier to cut than staff. The prevailing motion is
consolidation and ROI scrutiny.

**The structural problem underneath all of it** (this part is reasoning, not
a cited finding): social studies is not a tested subject in most states.
Reading and mathematics attract budget because test scores create
accountability pressure and someone's job depends on moving them. History has
no equivalent lever. In most public districts a department head's
discretionary authority rounds to zero, and real money moves on curriculum
adoption cycles that come round every five to eight years. A cheaper product
does not create a line item where none exists.

For scale: districts spent about $154.69 per student on *all* digital
curriculum across every subject (2020 survey figure, order-of-magnitude
anchor only).

## What the evidence says about institutions

Museums, historic sites and commemorative bodies buy software at prices
schools cannot reach. Entry-level digital exhibition software runs about
$4,300/year; mid-size licences around $10,000 up front plus $2,000 annual
maintenance. Single-station interactive installations start near $20,000 and
room-scale work runs to $150,000, procured against seven-to-ten-year
operational lifespans.

One site at mid-size licence pricing is worth roughly a thousand students at
supplemental per-seat rates — without FERPA, COPPA, rostering, or a district
procurement cycle. They also bring the content and the historians, which is
the capability this project most lacks.

Commemorative money is already moving. Pennsylvania awarded $1M across two
grant periods in one fiscal year; Nevada allocated $250,000 across 14
organisations. IMLS National Leadership Grants are funding this exact shape of
project — the American Philosophical Society is building a digital portal for
Philadelphia's revolutionary past on one. The 4 July peak passed, but the
commemorative arc runs to the Treaty of Paris in 2033, with Yorktown in 2031,
and institutional money lags anniversaries rather than leading them.

## Positioning: sell finished units, not a customizable tool

The instinct to generalise beyond the Revolution is right about the
engineering and wrong about the positioning.

Repositioning as "a repeatable, customizable mapped-narrative teaching tool"
walks directly into Esri's product — same axis, same price, none of their
distribution. The generic version is the *more* blocked one.

What the incumbents leave open is the gap between them. Gilder Lehrman is
content without an engine. StoryMaps is an engine without content, and its
free price tag hides a large cost paid in teacher prep hours. Neither gives
away a *finished* interactive unit built to a standard a teacher has no time
to reach.

So: depth per unit is the defensible thing; customizability is the commodity.

This does not change the decision to decouple content from code — it changes
the reason. Moving `events.js`, `interludes.js` and `metrics.js` behind a
schema is a production-line investment so that unit two costs a fraction of
unit one. It is not an authoring feature, and nobody outside should ever see
it as one. The event shape is already most of the way there: `facts[]` as
label/value pairs and a structured `source` object are the parts that are
usually got wrong.

What generalises best is not the map but the data interlude — charts truncated
to what was knowable at that point in the story (`yearCutoff` in
`interludes.js`). That mechanic is the differentiator and it carries to any
topic where quantities move over time: Reconstruction, the Dust Bowl and New
Deal, wartime production, arms races, immigration waves, epidemic response.
It is also the piece Esri cannot execute, because it requires per-topic
historical statistical work.

The one customization worth building eventually is remixing, not authoring:
trim events, reorder, adjust reading level, add a local angle. A feature of a
content product, not a product.

## The test

Three weeks, under two working days of effort, no platform work, app exactly
as it stands. Both tracks in parallel.

**Track A — five budget-holder conversations.** Not teachers; the people who
sign. Split across public and private contacts to learn the difference. Demo
what exists rather than pitching a roadmap. Ask: what would you pay per year;
**which budget line does it come out of**; who else has to say yes; what did
you cut this year and why that.

Kill criterion: if three or more cannot name a specific line item, the school
path is closed for now — not "needs a better pitch", closed. Record answers
verbatim so the result survives later optimism.

**Track B — institutional emails.** Signal to watch: one reply asking for a
call beats five enthusiastic teachers. Send in week one; these organisations
reply slowly.

Decision rule. Both soft: this is a portfolio piece and a good one — open
source the engine, stop building a business case. Track A lands: build the
school product, starting with content decoupling. Track B lands: this is a
licensing and commissioned-work business, and the whole K–12 compliance
burden leaves the roadmap.

## Who to approach

Do not email the funders. NEH's Digital Projects for the Public funds exactly
this shape of work — Discovery to $30,000, Prototyping to $100,000, Production
to $400,000 — but eligibility is 501(c)(3) organisations, universities and
government agencies. Same for IMLS. What makes the programme useful anyway is
that NEH *requires* project teams to include digital media professionals
alongside humanities scholars. The grant structure creates the role. So the
pitch to a small institution is "I am the media partner your application
needs, and here is a working prototype to attach to it" — help getting money,
not a sales call.

State 250 commissions are funders too. Write to ask who they are funding and
whether any of those projects need a technical partner; treat it as
intelligence, not a pitch.

Best first contact is the **American Battlefield Trust** education department:
their battle summaries are the cited source on roughly twenty events in
`events.js`, so the opener is warm; they already commission outside digital
production (animated battle maps, and a 12-minute VR film for the Lexington
and Concord 250th co-produced with Wide Awake Films); their education
operation reaches real numbers (1,335 teachers through institutes in one year,
~425,000 learners across five virtual field trips); and they are mid-campaign
on Revolutionary War battlefield acreage for the 250th. They also solve the
schools problem sideways, since they already hold the teacher distribution
this project would otherwise spend years building.

Then: the Museum of the American Revolution (purpose-built, digital-forward,
in the state distributing $1M in 250th grants); Mount Vernon (endowed, serious
digital education operation); and the sites already in the dataset — Fort
Ticonderoga (present twice, 1775 and 1777), Saratoga, Minute Man, Colonial NHP
at Yorktown, Cowpens, Kings Mountain, Guilford Courthouse. The NPS sites are
slow to transact with directly, but each has a "Friends of" non-profit partner
that is a 501(c)(3) and can hold a grant. That partner is the door, not the
park.

A public history graduate programme is cheap borrowed credibility and they
actively want digital projects for students.

## What to fix before showing anyone

- **Type-badge contrast** (`ROADMAP.md` item 2). Diplomatic at 2.49:1 and
  military at 4.39:1 against a 4.5:1 threshold, on roughly one event in nine.
  About an hour. Showing an accessibility defect to a buyer whose procurement
  asks for a conformance report is an avoidable own goal.
- **Widen the axe scan to one event per type.** The a11y suite starts on event
  101, which is `political` — that is why it misses the failure above.
- **Image licensing audit.** `scripts/fetch-event-images.mjs` assumes public
  domain from Wikimedia and writes an attribution manifest. That assumption
  needs checking per file before money is involved; "educational
  visualization" in the User-Agent string is not a licence.
- **Chromebook performance** (`ROADMAP.md` items 3 and 4) becomes real for a
  classroom pilot, not for institutional display. Splitting the 381.92 kB
  Recharts chunk behind the lazy boundary is the cheap half.

## Caveats

All of the above is desk research, not this market. Pricing figures are
vendor-published or survey-derived and vary widely by negotiation. The
$154.69 per-student figure is a 2020 survey number covering all digital
curriculum across every subject and is an order-of-magnitude anchor only. The
claim about social studies lacking an accountability lever is reasoning, not a
cited finding. Five real conversations outrank the whole document.

## Sources

- Gilder Lehrman Institute — [Affiliate School Program](https://www.gilderlehrman.org/affiliate-schools),
  [Self-Paced Courses for Teachers](https://www.gilderlehrman.org/history-resources/curriculum/self-paced-courses-teachers)
- Esri — [ArcGIS for Schools](https://www.esri.com/en-us/industries/k-12-education/schools-software),
  [Story Maps for Education](https://community.esri.com/t5/story-maps-for-education/gh-p/story-maps-for-education)
- [GovTech — Will the Ed-Tech Backlash Affect School District Budgeting?](https://www.govtech.com/education/k-12/will-the-ed-tech-backlash-affect-school-district-budgeting)
- [IES — Navigating the ESSER Funding Cliff](https://ies.ed.gov/learn/blog/navigating-esser-funding-cliff-toolkit-evidence-based-financial-decisions)
- [EdWeek Research — How School Districts Can Save (Billions) On Edtech](https://epe.brightspotcdn.com/d9/6d/e8aa68d363f0c3c5f960a13c4ef2/how-school-districts-can-save-billions-on-edtech.pdf)
- [Interactive Museum Installations: ROI, Costs & Real Examples](https://www.utsubo.com/blog/interactive-museum-installations-benefits-guide),
  [Intuiface — Museum Digital Exhibit Software](https://www.intuiface.com/museums-digital-signage)
- [IMLS — America250](https://www.imls.gov/our-work/partnerships/america250),
  [America250PA Semiquincentennial Grants](https://www.america250pa.org/Semiquin_Grants),
  [America250 Nevada](https://www.america250nevada.org/travel-nevada-grant),
  [AASLH 250th](https://aaslh.org/programs/250th/)
- [NEH — Digital Projects for the Public](https://www.neh.gov/grants/public/digital-projects-the-public)
- American Battlefield Trust — [Animated Battle Maps](https://www.battlefields.org/learn/maps/animated-battle-maps),
  [Lexington and Concord VR film](https://www.battlefields.org/news/immersive-virtual-reality-video-transports-viewers-250-years-past-battles-lexington-and),
  [Programs](https://www.battlefields.org/about/programs)

## Open

- Which state's 250 commission and historical society to approach — depends on
  where the school and institutional connections actually are.
- Whether the five Track A conversations have happened, and what they said.
