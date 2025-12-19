# Visualize AmRev - American Revolution Visualization

## Overview
An interactive visualization of the American Revolution, featuring a horizontal timeline of 18 key events from the Boston Tea Party (1773) through Washington resigning his commission (1783). Events include battles, political milestones, cultural moments, and military operations. Built with React, Leaflet maps, and Framer Motion animations.

## Project Structure
```
client/                     # React frontend application
├── src/
│   ├── components/
│   │   ├── Map.jsx              # Interactive Leaflet map with vintage styling
│   │   ├── HorizontalTimeline.jsx  # Horizontal scrolling timeline (time flows left to right)
│   │   ├── WelcomeScreen.jsx    # Intro screen with scroll-to-start
│   │   ├── ScrollytellingView.jsx  # Scroll-driven story progression
│   │   ├── EventCard.jsx        # Event details card
│   │   └── Charts.jsx           # Recharts visualizations for army/trade data
│   ├── data/
│   │   └── events.js            # Historical events, army data, economic data
│   ├── App.jsx                  # Main app with view switching (welcome → story → timeline/map/data)
│   └── App.css                  # Vintage colonial styling
└── vite.config.js               # Vite configuration
```

## Features
- **Welcome Screen**: Intro page with project description, scroll or click to begin
- **Story View**: Scrollytelling experience - scroll advances through events chronologically with map auto-flying to each location
- **Timeline View**: Map on top with horizontal scrolling timeline at bottom (1773→1783)
- **Event Card**: Fixed card on right side showing selected event details (positioned over Atlantic)
- **State Boundaries**: Accurate colonial boundary polygons with hover tooltips (population, exports, trade data)
- **Map View**: Independent exploration of all event locations with colony boundaries
- **Data View**: Charts showing Continental vs British army strength and colonial trade patterns
- **Light/Dark Mode**: Toggle between light (vintage sepia) and dark themes
- **Vintage Styling**: Colonial-inspired design with Playfair Display font and period-appropriate colors
- **Historical Accuracy**: Label-free map tiles (no modern city names), all 13 colonial boundaries
- **Pause & Explore**: In story mode, pause to explore the map at current time period

## Color Scheme
- **Blue (#1e3a5f)**: American/Colonial forces
- **Red (#8b2323)**: British forces
- **White/Parchment (#fffef5)**: Base background
- Georgia serif fonts for headings

## Tech Stack
- React 19 with Vite
- react-leaflet for maps (CARTO tiles)
- Framer Motion for animations
- Recharts for data visualization

## Running the App
```bash
cd client && npm run dev
```
Runs on port 5000.

## Recent Changes
- Dec 2024: Expanded timeline from 9 to 18 events with diverse event types:
  - First Continental Congress (1774) - political
  - Second Continental Congress Convenes (1775) - political
  - Publication of Common Sense (1776) - political/cultural
  - British Evacuation of Boston (1776) - military
  - Battle of Long Island (1776) - battle
  - Articles of Confederation Adopted (1777) - political
  - Battle of Monmouth (1778) - battle
  - Arnold's Treason Discovered (1780) - political
  - British Evacuation of New York (1783) - military
- Dec 2024: Added scrollytelling experience inspired by The Upshot/FiveThirtyEight
  - Welcome screen with animated intro and scroll-to-start
  - Story view with scroll-linked event progression
  - Year counter and progress indicator
  - Pause & Explore mode to examine map at current time
  - Navigation dots for jumping between events
- Dec 2024: Switched to ESRI Shaded Relief tiles for terrain-focused colonial aesthetic
- Added accurate GeoJSON polygon boundaries for all 13 colonies with dashed borders
- Added colonial-style labels on map (Playfair Display italic font, 2-letter abbreviations for all colonies)
- Added District of Maine as part of Massachusetts Colony
- Fixed Georgia northern border
- Removed non-US events (Treaty of Alliance, Treaty of Paris) - now 9 US-based events
- Added Valley Forge Winter Encampment as new event
- Horizontal timeline redesign - time now flows naturally left-to-right
- Map takes full view height with timeline as bottom bar
- Limited map zoom out to eastern seaboard (minZoom=4, maxBounds covering 28°-48°N, 85°-60°W)
- Future events appear translucent/subtle (35% opacity) before their date is reached
- Added "Hide Future Events" toggle in Map view to completely hide events that haven't occurred yet
- All colony labels now use standard 2-letter abbreviations (MA, ME, NH, RI, CT, NY, NJ, PA, DE, MD, VA, NC, SC, GA)
- App starts with no event selected, showing all 13 colonies overview
- Clicking an event zooms to level 6 with eastward offset to keep event visible beside the card
- Removed duplicate popup from map markers - event details only show in the side card
- Event card positioned over the Atlantic Ocean (380px wide)

## Multi-Day Events Reference
Some events span more than a single day. These have optional `endDate` and `duration` fields:

| Event | Start Date | End Date | Duration |
|-------|-----------|----------|----------|
| First Continental Congress | 1774-09-05 | 1774-10-26 | 52 days |
| Second Continental Congress | 1775-05-10 | 1781-03-01 | ~6 years |
| Battle of Long Island | 1776-08-27 | 1776-08-30 | 4 days |
| Saratoga Campaign | 1777-09-19 | 1777-10-17 | ~1 month |
| Valley Forge | 1777-12-19 | 1778-06-19 | 6 months |
| Arnold's Treason | 1780-09-21 | 1780-09-25 | 5 days |
| Siege of Yorktown | 1781-09-28 | 1781-10-19 | 3 weeks |

Future enhancement ideas:
- Show duration visually on timeline (wider markers or spans)
- Display date ranges in event cards when applicable
- Add animation showing event progression over time

## User Preferences
- Explain code relative to Python concepts when possible
- Minimal color usage, clear and sleek design
- Red for England, Blue for US, White base
- Horizontal timeline preferred for natural time flow
