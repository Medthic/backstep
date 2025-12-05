# Backstep - AI Development Guide

## Project Overview
Backstep is a fire station information display system built with React 19 + Vite, showing real-time apparatus assignments, calendars, and announcements. It's designed to run continuously on station displays with auto-rotating pages.

## Architecture

### Core Structure
- **Single-page app with carousel**: `PageCarousel.jsx` rotates between Assignment, Calendar, Information, and Google Slides pages every 10 seconds
- **Supabase backend**: All data stored in Supabase (assignments, member list, carousel config, sliding messages, admin audit logs)
- **Real-time sync**: Components subscribe to Supabase realtime channels for live updates across all connected displays
- **Admin authentication**: Simple passcode-based auth stored in `admins` table, tracks actor in localStorage as `admin_actor`

### Key Components
- `App.jsx`: Router with three routes: `/` (carousel), `/edit-assignments`, `/admin`
- `PageCarousel.jsx`: Auto-rotating display manager, config controlled via `carousel_settings` table
- `AssignmentPage.jsx`: Shows apparatus assignments in grid layout (Engine 41/42, Truck, Rescue, Ambulances 47/48/49)
- `AssignmentEditPage.jsx`: Drag-and-drop interface for assigning members to apparatus positions
- `AdminPage.jsx`: Manages members, messages, carousel config, and ambulance statuses

### Data Flow
1. Components fetch initial data from Supabase on mount
2. Subscribe to `postgres_changes` events on relevant tables (assignments, memberlist, carousel_settings, sliding_messages)
3. UI updates automatically when any client makes changes
4. Admin actions logged to `admin_audit` table with actor tracking

### Deployment Modes
- **GitHub Pages**: `base: "/backstep/"` in vite.config.js, `basename="/backstep"` in App.jsx
- **AWS Amplify**: `base: "/"` when `VITE_DEPLOY_TARGET=amplify` (controlled via env vars)
- Check `amplify.yml` for build config

## Supabase Tables (Inferred Schema)
- `assignments`: `box` (int, apparatus index), `position` (int, position index), `member_id` (uuid), `last_updated` (timestamp)
- `memberlist`: `id` (uuid), `name` (text), `rank` (text - see rankColors.js for valid values)
- `carousel_settings`: `id`, `config` (jsonb with keys: assignment, calendar, information, slide - booleans)
- `sliding_messages`: Messages displayed in bottom ticker
- `info_statuses`: Station ambulance statuses (station number → status string)
- `admins`: Admin passcodes for authentication
- `admin_audit`: Audit log with `actor`, `action`, `details` fields

## Patterns & Conventions

### Rank System
All ranks defined in `src/components/rankColors.js` with color coding:
- Base ranks: CHIEF, CAPTAIN, LIEUTENANT, ENGINEER, FIREFIGHTER, GREENSHIELD, JUNIOR
- Medical suffixes: EMT, MEDIC (e.g., CAPTAINEMT, LIEUTENANTMEDIC)
- Pure medical: EMT, AEMT, PARAMEDIC
- Use `formatRankLabel()` for display (handles "Firefighter | EMT" formatting)

### Component Structure
- Each page component has paired `.jsx` + `.css` files in `src/components/pages/`
- Shared components in `src/components/` (TopNavBar, Clock, WeatherBadge, etc.)
- CSS uses custom properties in `:root` and component-specific classes

### Real-time Subscription Pattern
```javascript
useEffect(() => {
  const channel = supabase
    .channel("unique-channel-name")
    .on("postgres_changes", { event: "*", schema: "public", table: "table_name" }, (payload) => {
      // Refetch data
    })
    .subscribe()
  
  return () => { supabase.removeChannel(channel) }
}, [])
```

### Apparatus Configuration
**Engines 41/42**: 6 positions - CHAUFFEUR, OFFICER, NOZZLE, LAYOUT, FORCIBLE ENTRY, BACKUP  
**Truck**: 6 positions - CHAUFFEUR, OFFICER, CAN, OVM, IRONS, ROOF  
**Rescue**: 6 positions - CHAUFFEUR, OFFICER, SAFETY, TOOL, CRIB, CRIB  
**Ambulances 47/48/49**: 2 positions each - STAFF, STAFF

Positions are 0-indexed arrays. Box indices: 0=Engine41, 1=Engine42, 2=Truck, 3=Rescue, 4=Amb47, 5=Amb48, 6=Amb49

### Styling
- **Tailwind** for utilities (configured in `tailwind.config.js`, imported in `index.css`)
- **Component CSS** for complex layouts (grids, animations, carousel transitions)
- Dark theme by default (`#242424` background, light text)
- Responsive font sizing: `html { font-size: 15px }` in `index.css`

## Development Workflows

### Local Development
```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run lint         # ESLint check
```

### Environment Variables (`.env.local`)
Required for Supabase:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DEPLOY_TARGET=amplify  # or omit for GitHub Pages
```

### Deployment
- **GitHub Pages**: `npm run deploy` (uses gh-pages package)
- **AWS Amplify**: Automatic via `amplify.yml` on git push

## Common Tasks

### Adding a New Page to Carousel
1. Create component in `src/components/pages/YourPage.jsx`
2. Add to `allPages` array in `PageCarousel.jsx` with unique `key`
3. Update `defaultCarouselConfig` in both `PageCarousel.jsx` and `AdminPage.jsx`
4. Admin UI will auto-populate toggle for new page

### Adding a New Rank
1. Add to `rankColors` object in `src/components/rankColors.js` with `background` and `color`
2. Update `formatRankLabel()` if special formatting needed
3. Rank will appear in AdminPage dropdown automatically (reads from rankColors keys)

### Modifying Apparatus/Positions
- Update `boxNames` and `boxPositions` arrays in `AssignmentPage.jsx`
- Update `APPARATUS` constant in `AssignmentEditPage.jsx`
- Keep indices synchronized between view/edit pages

### Working with Supabase
- Single client instance exported from `src/lib/supabase.ts`
- Always use `.from("table_name")` pattern for queries
- Subscribe to realtime changes for any table that might update from multiple clients
- Handle network errors gracefully (display still functions with stale data)

## ESLint Configuration
- Unused vars allowed if prefixed with `_` or all-caps (see `eslint.config.js`)
- React Hooks rules enforced
- React Refresh warnings for non-component exports

## Gotchas
- **Carousel timing**: `INTERVAL=10000ms`, `ANIM_DURATION=700ms` in PageCarousel - adjust carefully to avoid jank
- **Realtime subscriptions**: Must call `supabase.removeChannel(channel)` in cleanup to prevent memory leaks
- **Assignment updates**: Use `last_updated` timestamp to show freshness, updated automatically on save in EditPage
- **Admin actor tracking**: Stored in localStorage, included in audit logs - don't clear it during admin session
- **Ambulance numbers**: External ambulances (18, 19, 58, 59, 68, 69) have special status tracking in AdminPage
