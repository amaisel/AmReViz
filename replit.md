# Visualize AmRev - American Revolution Visualization

## Overview
An interactive visualization of the American Revolution, featuring a horizontal timeline of key events from the Boston Tea Party (1773) through Washington resigning his commission (1783). Built with React, Leaflet maps, and Framer Motion animations.

## Project Structure
```
client/                     # React frontend application
├── src/
│   ├── components/
│   │   ├── Map.jsx              # Interactive Leaflet map with vintage styling
│   │   ├── HorizontalTimeline.jsx  # Horizontal scrolling timeline (time flows left to right)
│   │   └── Charts.jsx           # Recharts visualizations for army/trade data
│   ├── data/
│   │   └── events.js            # Historical events, army data, economic data
│   ├── App.jsx                  # Main app with view switching
│   └── App.css                  # Vintage colonial styling
└── vite.config.js               # Vite configuration
```

## Features
- **Timeline View**: Map on top with horizontal scrolling timeline at bottom (1773→1783)
- **Event Card**: Fixed card on right side showing selected event details (positioned over Atlantic)
- **State Boundaries**: Accurate colonial boundary polygons with hover tooltips (population, exports, trade data)
- **Map View**: Independent exploration of all event locations with colony boundaries
- **Data View**: Charts showing Continental vs British army strength and colonial trade patterns
- **Light/Dark Mode**: Toggle between light (vintage sepia) and dark themes
- **Vintage Styling**: Colonial-inspired design with Playfair Display font and period-appropriate colors
- **Historical Accuracy**: Label-free map tiles (no modern city names), all 13 colonial boundaries

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
- Dec 2024: Switched to ESRI Shaded Relief tiles for terrain-focused colonial aesthetic
- Added accurate GeoJSON polygon boundaries for all 13 colonies with dashed borders
- Added colonial-style labels on map (Playfair Display italic font, 2-letter abbreviations for all colonies)
- Added District of Maine as part of Massachusetts Colony
- Fixed Georgia northern border
- Removed non-US events (Treaty of Alliance, Treaty of Paris) - now 9 US-based events
- Added Valley Forge Winter Encampment as new event
- Horizontal timeline redesign - time now flows naturally left-to-right
- Map takes full view height with timeline as bottom bar
- Limited map zoom out to eastern seaboard (minZoom=4, maxBounds covering 25°-48°N, 90°-65°W)
- Future events appear translucent/subtle (35% opacity) before their date is reached
- Added "Hide Future Events" toggle in Map view to completely hide events that haven't occurred yet
- All colony labels now use standard 2-letter abbreviations (MA, ME, NH, RI, CT, NY, NJ, PA, DE, MD, VA, NC, SC, GA)

## User Preferences
- Explain code relative to Python concepts when possible
- Minimal color usage, clear and sleek design
- Red for England, Blue for US, White base
- Horizontal timeline preferred for natural time flow
