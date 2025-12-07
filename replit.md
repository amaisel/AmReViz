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
- **Map View**: Independent exploration of all event locations with colony population circles
- **Data View**: Charts showing Continental vs British army strength and colonial trade patterns
- **Light/Dark Mode**: Toggle between light (vintage sepia) and dark themes
- **Vintage Styling**: Colonial-inspired design with Playfair Display font and period-appropriate colors

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
- Dec 2024: Horizontal timeline redesign - time now flows naturally left-to-right
- Removed redundant event card overlay on map
- Map takes full view height with timeline as bottom bar
- Sepia filter on map tiles for vintage aesthetic
- Independent map exploration in Map view (autoFly disabled)

## User Preferences
- Explain code relative to Python concepts when possible
- Minimal color usage, clear and sleek design
- Red for England, Blue for US, White base
- Horizontal timeline preferred for natural time flow
