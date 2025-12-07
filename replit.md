# Visualize AmRev - American Revolution Visualization

## Overview
An interactive visualization of the American Revolution, featuring a timeline of key events from the Boston Tea Party (1773) through Washington resigning his commission (1783). Built with React, Leaflet maps, and Framer Motion animations.

## Project Structure
```
client/                     # React frontend application
├── src/
│   ├── components/
│   │   ├── Map.jsx        # Interactive Leaflet map with vintage styling
│   │   ├── Timeline.jsx   # Scrollable timeline with animations
│   │   └── Charts.jsx     # Recharts visualizations for army/trade data
│   ├── data/
│   │   └── events.js      # Historical events, army data, economic data
│   ├── App.jsx            # Main app with view switching
│   └── App.css            # Vintage colonial styling
└── vite.config.js         # Vite configuration
```

## Features
- **Timeline View**: Scrollable timeline with 10 key events, synchronized with map
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
- Dec 2024: Initial MVP with 10 events, timeline/map sync, light/dark mode
- Compact timeline panel for more map visibility
- Sepia filter on map tiles for vintage aesthetic
- Independent map exploration in Map view (autoFly disabled)

## User Preferences
- Explain code relative to Python concepts when possible
- Minimal color usage, clear and sleek design
- Red for England, Blue for US, White base
