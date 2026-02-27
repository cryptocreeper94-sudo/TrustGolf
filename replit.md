# Trust Golf - Premium Golf Companion App

## Overview
Trust Golf is a premium mobile-first golf platform built with React Native + Expo. It offers a cinematic landing page, AI-powered swing analysis, score tracking, course discovery, media integration via TrustVault, and exclusive deals. The platform aims to provide a comprehensive golf companion experience, allowing users to browse content without login and gating advanced features behind authentication. It is developed by DarkWave Studios LLC.

## User Preferences
- **Course Catalog Philosophy**: The course catalog is designed to ultimately become a physical, printable coffee table book. Every course entry must be written at editorial/publishing quality — rich narrative descriptions covering course history, designer legacy, signature holes, landscape and flora, seasonal character, and the kind of vivid storytelling that invites conversation. Think: a glossy book someone displays in their sunroom in Florida that guests pick up and say "we need to play this one." This standard applies to ALL future course additions. No placeholder or sparse entries — every course deserves the full premium treatment.
- **Premium UI Standard**: All catalog-style screens (courses, deals, blog) should be designed with a print-ready aesthetic sensibility — beautiful typography, generous spacing, cinematic imagery, and layouts that would translate to a physical publication.

## System Architecture
Trust Golf is built on a modern full-stack architecture:
-   **Frontend**: React Native + Expo (SDK 54) utilizing file-based routing via Expo Router for a mobile-first experience. In production, a static web export (`dist-web/`) is built via `npx expo export --platform web` and served to browser visitors, while Expo Go native manifests are served to mobile devices.
-   **Backend**: An Express.js server handles API requests and business logic.
-   **Database**: PostgreSQL is used for data persistence, managed with Drizzle ORM.
-   **AI Integration**: OpenAI's vision model, accessed via Replit AI Integrations, powers the AI swing analysis feature.
-   **Object Storage**: Replit Object Storage is used for storing application assets.
-   **Media Platform**: TrustVault is integrated for advanced media storage, editing, and video processing, secured via HMAC authentication.
-   **UI/UX Design**: The app features a golf-green primary color scheme with a gold accent, a 3-column Bento grid layout, glass morphism cards, orb effects, and skeleton loaders. It uses the Inter font and supports light/dark mode toggling.
-   **Authentication**: The app allows free content browsing, with a login modal appearing only for gated features like AI Swing Analyzer and round tracking. A developer dashboard is accessible via a master PIN, and a whitelist system provides VIP access.
-   **Key Features**:
    *   **Cinematic Explorer Page**: A dynamic landing page with an image slideshow hero, category carousels, hot deals, and quick actions.
    *   **Course Catalog**: Comprehensive database of 55 golf courses across SC, TN, GA, NC, MS, FL, NY, PA, CA, OR, WI, WA, and Scotland — filterable by state, with rich editorial descriptions, amenities, designer credits, and unique imagery. Designed as a future coffee table book.
    *   **Score Tracking**: Users can log rounds with detailed stats (putts, FIR, GIR), view history, and automatically calculate USGA Handicap Index. Includes real hole-by-hole scorecards for specific courses.
    *   **AI Swing Analyzer**: Club-specific AI analysis of golf swings from photos or videos, providing detailed feedback, score meters, tips, and drills.
    *   **Video Swing Playback**: Slow-motion playback, frame extraction, and TrustVault integration for video editing.
    *   **GPS Distance Finder**: Satellite map view of courses, allowing users to tap and calculate distances from their GPS position, with a simulation mode for testing.
    *   **Developer Dashboard**: An admin panel for managing courses, deals, affiliate programs, and whitelist members.
    *   **Self-Hosted Analytics**: A first-party tracking system for sessions, page views, and events, with a dashboard in the developer panel to monitor KPIs.
    *   **AI-Driven Blog**: An SEO-focused blog system where AI (GPT-4o) generates posts, managed via the developer dashboard.
    *   **PWA Support**: Offline caching and installability through a service worker and manifest.
    *   **TrustVault Integration**: Enables media storage, editing, and video processing with webhook callbacks for rendering status.
    *   **Trust Layer Ecosystem Page**: A dedicated `/ecosystem` page displaying the DarkWave Studios ecosystem directory widget (from dwsc.io), SSO/Blockchain/API feature cards, linked from the footer.

## Roadmap: "Bomber" — Long Drive Contest Game

**Concept**: A long drive contest game built into the Trust Golf app. Modeled after real professional long drive competitions — the grid, the pressure, the crowd, day sessions and night sessions under the lights. Not a full course simulator. This is the one perfect shot that keeps golfers coming back. Pure power, instant gratification, big numbers.

**Contest Format (mirrors real long drive events)**:
- **The Grid**: A marked driving grid with distance markers every 25 yards, boundary lines (must land in-bounds to count), and a landing zone camera
- **Rounds & Elimination**: Qualifying round (6 balls), bracket rounds (3 balls each), finals (2 balls, best single drive wins)
- **Shot Clock**: 30-second timer per ball — step up, set up, swing. Pressure builds.
- **Day Mode**: Bright sun, blue sky, green fairway. Shadows shift with time of day. Heat shimmer on long drives. Clean, crisp visibility — you see the ball all the way out.
- **Night Mode**: Stadium lights illuminating the grid. The ball launches into darkness — all you see is the tracer arc glowing against a black sky. Spotlight tracks the landing. Dramatic, electric atmosphere. The crowd reacts to the sound before they see where it lands.
- **Ball Tracer**: Glowing flight path that lingers — white/gold in day, neon in night mode. Shows apex, carry, and total distance.
- **Crowd & Atmosphere**: Animated spectators behind the tee box. Reactions scale with distance — polite claps at 280, roaring at 350+, absolute pandemonium at 400+. Night sessions are louder, rowdier.

**Technical Stack**:
- **Rendering**: @shopify/react-native-skia (bundled in Expo Go, web via CanvasKit) for 2D/2.5D ball flight visualization, tracer effects, lighting
- **Game Loop**: react-native-game-engine for entity management and physics tick
- **Physics**: Custom ballistic flight model (launch angle, spin, wind resistance, altitude, temperature effects)
- **Platform**: Runs on web, iOS, and Android inside the existing Expo app — no native build required

**Phase 1 — Playable MVP**:
- Swing mechanic: Timing-based power meter with angle control (two-tap: power then accuracy)
- Ball flight physics: realistic trajectory with carry + roll, must land in-bounds
- Side-view or 3/4 view rendering of the drive with grid markers
- Day and night mode toggle (different sky, lighting, tracer colors)
- Ball tracer effect on every shot
- Big dramatic distance display on landing (carry + roll breakdown)
- Grid boundary — out-of-bounds drives don't count
- Personal best tracking (local state)
- Free play mode — unlimited swings, chase your longest

**Phase 2 — Contest Mode & Economy Foundation**:
- Full long drive contest format: qualifying (6 balls) -> brackets (3 balls) -> finals (2 balls)
- AI opponents with different skill profiles ("The Bomber", "The Technician", "The Rookie")
- Shot clock (30 seconds per ball)
- Leaderboards (server-side, per-user high scores, separate day/night records)
- Daily challenges ("Hit 350+ at night in crosswind", "Win a bracket with 3 straight 300+ drives")
- Weather/wind conditions: headwind, tailwind, crosswind, gusts, temperature (cold = less distance)
- Sound design: crack of the driver, ball tracer whoosh, crowd reactions, night stadium ambiance
- Launch monitor readout after each drive (ball speed, launch angle, spin rate, carry, total)
- **Daily Rewards System**:
  - Daily Chest: free chest every 24 hours for logging in (coins, XP, occasional equipment cards)
  - Drive Chests: earn a chest every 5-10 drives, better performance = better tier (Bronze, Silver, Gold, Diamond)
  - Streak Bonus: 3-day streak = upgraded daily chest, 7-day = guaranteed rare, 30-day = legendary
  - Chest opening animation with reveal suspense
- **Currency & Economy (foundation)**:
  - Coins: earned from drives, chests, daily rewards. Buy common/uncommon equipment
  - Gems: premium currency, earned slowly through achievements. Buy Gold/Diamond chests, instant unlocks, premium venues
  - XP: every drive earns XP. Leveling up unlocks new content (venues, equipment slots, cosmetics)
- **Equipment System (initial)**:
  - Drivers: 3-4 base models with trade-offs (distance vs accuracy vs forgiveness)
  - Balls: distance, control, all-rounder types
  - Equipment cards drop from chests — collect duplicates to upgrade (Clash Royale style card fusion)
  - Equipment affects physics: driver changes ball speed ceiling, ball changes spin/roll characteristics

**Phase 3 — Venues, Seasons & Live Game**:
- **Real Course Venues** (the killer feature):
  - Tee off on iconic holes from the 55-course catalog: 7th at Pebble Beach (ocean), 12th at Augusta (Amen Corner), 18th at TPC Sawgrass (island green), 17th at St Andrews (Road Hole)
  - Each venue has unique visual backdrop, wind patterns, elevation, and conditions
  - Venues unlock through leveling or purchased with coins/gems
  - Legendary venues: only available on certain days or through special events
  - Venue-specific leaderboards — who holds the record at Pebble?
- **Full Equipment Depth**:
  - Shafts: affect launch angle and spin independently
  - Swing style customization: draw/fade tendency, launch profile, swing speed ceiling
  - Dozens of equipment cards across Common, Uncommon, Rare, Epic, Legendary tiers
  - Equipment loadouts — save your favorite setups for different conditions
- **Seasons & Live Events**:
  - Monthly season with reward tiers (free track + premium track, like Fortnite battle pass)
  - Weekly online tournaments on specific venues with specific conditions — top finishers get exclusive rewards
  - Limited-time events: "Night at Augusta", "Storm Drive Challenge", "Altitude Bomber" (mountain venue, thin air, ball flies further)
  - Season-exclusive cosmetics (tracer colors, ball skins, celebration animations)
- **Progression & Prestige**:
  - Divisions: Bronze → Silver → Gold → Platinum → Diamond → Legend
  - Achievements: "Hit 400+", "Win 10 brackets", "Play every venue", "30-day streak" — each with unique badges
  - Integration with Trust Golf profile (handicap, swing speed feed into starting attributes)
  - Replay system: slow-mo camera angles of best drives, shareable to social media
  - Animated crowd and announcer reactions that scale with division (Legend division = stadium packed, pyrotechnics on 400+ bombs)

**Design Philosophy**: Premium, clean aesthetic consistent with Trust Golf brand. Not cartoony — stylized and satisfying. Day mode feels like a sunny Saturday at a pro long drive event. Night mode feels electric — stadium lights, glowing tracers, darkness beyond the grid. The feeling of a 350-yard bomb should look and feel as good in the game as it does in real life. The economy is generous but strategic — players always feel like they're progressing, but mastery takes time and skill, not just spending.

## Bomber Phase 2 — Implemented
Phase 2 of the Bomber long drive contest game is now fully implemented with server-side persistence:
- **Database Tables**: `bomber_profiles`, `bomber_equipment`, `bomber_leaderboard`, `bomber_chest_queue`, `bomber_daily_challenges` — all defined in `shared/schema.ts` and pushed to the database
- **Shared Game Data**: `shared/bomber-data.ts` contains all equipment definitions (5 drivers, 5 balls with rarity tiers), division progression, chest drop tables, AI opponent profiles, weather conditions, daily challenge templates, and helper functions
- **Storage Layer**: Full CRUD methods in `server/storage.ts` for all Bomber tables
- **API Routes** (in `server/routes.ts`):
  - `GET /api/bomber/profile/:userId` — profile with auto-creation
  - `POST /api/bomber/drive` — records drive, awards XP/coins, generates chests every 5 drives
  - `GET /api/bomber/leaderboard` — top 50 scores
  - `POST /api/bomber/daily-reward/:userId` — claim daily chest with streak tracking
  - `POST /api/bomber/chest/:id/open` — open chest with randomized contents
  - `GET /api/bomber/challenges/today` — daily challenge (auto-generated)
  - `GET /api/bomber/equipment/:userId` — user equipment inventory
  - `POST /api/bomber/equipment/:id/upgrade` — upgrade with duplicates
  - `POST /api/bomber/equip` — equip driver or ball
- **Frontend** (`app/bomber.tsx`):
  - Menu screen with profile stats, division badge, XP bar, currency display
  - Free Play mode with unlimited drives
  - Contest Mode: qualifying (6 balls) → bracket (3 balls) → finals (2 balls) vs AI opponents
  - 30-second shot clock with auto-miss on expiry
  - Equipment selection modal with rarity colors and stat display
  - Leaderboard modal
  - Daily reward banner with chest opening animation
  - Unopened chest queue on menu screen
  - Weather system affecting physics (rain, hot, cold conditions)
  - Equipment bonuses modify ball physics (speed, accuracy, distance, roll)
  - XP/coins/gems rewards after each drive
  - Daily challenge card on menu
- **Payment Gating** (Bomber Pro — $4.99 one-time):
  - Free Play: always unlimited, no payment required
  - Contest Mode: 1 free entry per day for all users
  - Bomber Pro unlock: unlimited Contest Mode entries
  - RevenueCat integration (`react-native-purchases`) for in-app purchase flow
  - Server-side tracking: `bomberPro`, `dailyContestDate`, `dailyContestCount` fields on bomber_profiles
  - API routes: `GET /api/bomber/contest-eligibility/:userId`, `POST /api/bomber/use-contest/:userId`, `POST /api/bomber/unlock-pro/:userId`, `POST /api/bomber/restore-pro/:userId`
  - Paywall modal with feature list, price display, purchase button, and restore purchase option
  - Graceful fallback: if RevenueCat not configured, purchase still unlocks server-side (for testing)
  - Note: RevenueCat API key needs to be configured when products are set up in App Store Connect / Google Play Console

## Bomber Phase 3 — Implemented
Phase 3 adds venues, achievements, and tournament infrastructure:
- **Database Tables**: `bomber_venues`, `bomber_venue_unlocks`, `bomber_tournaments`, `bomber_tournament_entries`, `bomber_achievements` — all in `shared/schema.ts`
- **Real Course Venues** (12 venues from the 55-course catalog):
  - The Grid (free default), Pebble Beach, Augusta National, TPC Sawgrass, St Andrews, Kiawah Island, Pinehurst No. 2, Whistling Straits, Bethpage Black, Bandon Dunes, Harbour Town, Torrey Pines
  - Each venue has unique sky/ground color themes, wind patterns, elevation, altitude bonus, tier (free/standard/premium/legendary), unlock cost (coins or gems), and level requirements
  - Venue selection changes game visuals (sky gradient, ground colors), wind behavior, and applies altitude bonus to carry distance
  - Venue unlock flow: check level requirement, check currency, deduct cost, grant access
- **Achievements System** (25 achievements across 6 categories):
  - Categories: milestone, distance, contest, streak, venue, collection
  - Auto-checked after every drive via server-side `/api/bomber/achievements/check`
  - Each achievement grants coin/XP/gem rewards automatically
  - Achievement toast notification appears in-game when unlocked
  - Full achievements gallery modal with progress tracking
- **Tournament Infrastructure**:
  - Tournament creation, entry (with coin entry fee), drive recording, and leaderboard
  - API routes: `GET /api/bomber/tournaments`, `POST /api/bomber/tournaments/enter`, `POST /api/bomber/tournaments/drive`, `GET /api/bomber/tournaments/:tournamentId`
  - Events modal UI showing active tournaments with countdown timers
- **Storage Methods** (in `server/storage.ts`): getVenues, getVenue, createVenue, getUserVenueUnlocks, unlockVenue, isVenueUnlocked, getTournaments, getTournament, createTournament, getTournamentEntries, getTournamentEntry, enterTournament, updateTournamentEntry, getUserAchievements, addAchievement, hasAchievement
- **API Routes** (in `server/routes.ts`): 9 new endpoints for venues, tournaments, and achievements
- **Shared Data** (`shared/bomber-data.ts`): VENUE_DEFS (12 venues), ACHIEVEMENTS (25 defs), getVenueDef, getVenueWeather, checkAchievements helper

## Bomber Phase 4 — Polish & Game Feel
Phase 4 adds audio, visual effects, and venue-specific challenges:
- **Sound Effects** (`lib/bomber-sounds.ts`): Web Audio API synthesized sounds — swing whoosh, impact crack, crowd reaction (300+), chest open/reveal, level up fanfare, achievement unlock, OB miss, shot clock countdown, menu tap. Toggle on/off in menu header, persisted via AsyncStorage
- **Ball Trail Particles**: Trailing circles behind the ball during flight with decreasing opacity. Power drives (85%+) get a fire trail with extra glow effect. Trail color adapts to day/night mode
- **Animated Chest Opening**: Three-stage reveal — "Chest Ready" with tap prompt → burst animation with expanding rings → sequential item reveal (coins, XP, gems, equipment) with individual zoom-in animations and rarity glow borders. Each item triggers a chime sound
- **Venue-Specific Challenges** (`shared/bomber-data.ts` VENUE_CHALLENGES): 16 unique challenges across all 11 real venues. Condition types: distance threshold, headwind mastery, night mode, power threshold, accuracy streak. Challenges shown in menu when venue is selected, with completion tracking (persisted via AsyncStorage). Challenge toast notification on completion
- **Dependencies added**: `expo-av` (audio support)

## External Dependencies
-   **OpenAI**: Used for AI capabilities, specifically the vision model for swing analysis.
-   **PostgreSQL**: The primary database for all application data.
-   **Drizzle ORM**: Used for interacting with the PostgreSQL database.
-   **Express.js**: Backend framework for the API server.
-   **React Native & Expo**: Frontend development framework.
-   **Replit AI Integrations**: Facilitates access to OpenAI models.
-   **Replit Object Storage**: Cloud storage for application assets.
-   **TrustVault (via trustvault.replit.app)**: Media storage, video/image editing, and processing platform integrated via API (HMAC and bearer token authentication) and webhooks.
-   **Google Fonts (Inter)**: Typography.
-   **react-native-maps**: Native map component for GPS features.
-   **Leaflet + Esri satellite tiles**: Web map components for GPS features.
-   **expo-video-thumbnails**: Used for extracting frames from videos.
-   **Resend**: For confirmation email functionality (e.g., partner signup).