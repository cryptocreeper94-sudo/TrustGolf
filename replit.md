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
    *   **PWA Support**: Offline caching and installability through a service worker and manifest. **Bomber PWA**: Standalone PWA served at `/play` with its own manifest (`/bomber-manifest.json`), service worker (`/bomber-sw.js`), and branding separate from the Trust Golf PWA. Installs as "Bomber" on home screen. Bomber screen dynamically swaps manifest for proper PWA identity.
    *   **Bomber Dashboard**: User stats screen at `/bomber-dashboard` with division progress, top drives, achievement progress, equipment collection, venue completion, and global rank.
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
- Behind-the-player perspective view with vanishing point, fairway narrowing to horizon, golfer silhouette at bottom center, perspective-scaled ball flight, arc/semicircle swing gauge (Golf Clash-style), trees lining fairway edges with depth scaling
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

## Bomber Game — Frontend Deactivated, External 3D Game Connected via API
The Bomber game frontend (`app/bomber.tsx` and `app/bomber-dashboard.tsx`) has been deactivated — both routes redirect to the home screen. The game is being rebuilt externally as a 3D game at `bomber.tlid.io` and connects to this backend via API.
- **CORS configured** for `https://bomber.tlid.io` and localhost dev origins in `server/index.ts`
- **Adapter routes** added at end of `server/routes.ts` to accept the external game's payload format:
  - `POST /api/bomber/drive` — auto-translates `distanceYards`/`carryYards`/`rollYards`/`ballSpeedMph`/`launchAngleDeg`/`windSpeedMph`/`equipmentUsed` fields to the internal format
  - `GET /api/bomber/leaderboard/:venueId` — venue-filtered leaderboard
  - `POST /api/bomber/chest/open` — accepts `{ userId, chestId }` in body
  - `POST /api/bomber/daily-reward` — accepts `{ userId }` in body (vs original URL param)
  - `GET /api/bomber/contest/available/:userId` — alias for contest-eligibility
  - `POST /api/bomber/contest/submit` — alias for use-contest with userId in body
- **All original `/api/bomber/*` endpoints remain active** alongside the adapter routes
- **Database tables** (`bomber_profiles`, `bomber_equipment`, `bomber_leaderboard`, `bomber_chest_queue`, `bomber_daily_challenges`, `bomber_venues`, `bomber_venue_unlocks`, `bomber_tournaments`, `bomber_tournament_entries`, `bomber_achievements`) remain in the schema
- **Shared game data** (`shared/bomber-data.ts`) and **storage layer** (`server/storage.ts`) remain intact

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

## Bomber — Mobile-First Optimization
- `isSmallScreen` (height < 700px) and `isMobile` (native or width < 500px) detection
- Horizon pushes higher on small screens (25% vs 30%), golfer moves up (72% vs 78%)
- Fairway widens on mobile (88% vs 78%) for immersive feel
- Arc gauge: larger radius on mobile (32% / max 110px), thicker band (18px), safe-area-aware bottom positioning
- Gauge text/needle/labels scale up on mobile for touch clarity
- Distance marker text scales larger on mobile
- Drive button positioned at 22% from bottom (above gauge)
- Results panel total yards font scales to 44px on mobile (52px desktop)
- Interval cleanup on component unmount (power, accuracy, shot clock)
- AsyncStorage reads wrapped with .catch() for error resilience

## Bomber Phase 4 — Polish & Game Feel
Phase 4 adds audio, visual effects, and venue-specific challenges:
- **Sound Effects** (`lib/bomber-sounds.ts`): Web Audio API synthesized sounds — swing whoosh, impact crack, crowd reaction (300+), chest open/reveal, level up fanfare, achievement unlock, OB miss, shot clock countdown, menu tap. Toggle on/off in menu header, persisted via AsyncStorage
- **Ball Trail Particles**: Trailing circles behind the ball during flight with decreasing opacity. Power drives (85%+) get a fire trail with extra glow effect. Trail color adapts to day/night mode
- **Animated Chest Opening**: Three-stage reveal — "Chest Ready" with tap prompt → burst animation with expanding rings → sequential item reveal (coins, XP, gems, equipment) with individual zoom-in animations and rarity glow borders. Each item triggers a chime sound
- **Venue-Specific Challenges** (`shared/bomber-data.ts` VENUE_CHALLENGES): 16 unique challenges across all 11 real venues. Condition types: distance threshold, headwind mastery, night mode, power threshold, accuracy streak. Challenges shown in menu when venue is selected, with completion tracking (persisted via AsyncStorage). Challenge toast notification on completion
- **Dependencies added**: `expo-av` (audio support)

## Trust Layer Hallmark System & Affiliate Program
Trust Golf (prefix: `TG`, genesis: `TG-00000001`, domain: `trustgolf.tlid.io`) implements the Trust Layer ecosystem's universal audit trail and affiliate program.

### Full Ecosystem Registry (33 Apps)
All apps share the same `{uniqueHash}` per user, parent genesis `TH-00000001`, hallmark format `[PREFIX]-[8-DIGIT-PADDED]`.

| # | App | Prefix | Genesis | Domain |
|---|-----|--------|---------|--------|
| 1 | Trust Layer Hub | TH | TH-00000001 | trusthub.tlid.io |
| 2 | Trust Layer (L1) | TL | TL-00000001 | dwtl.io |
| 3 | TrustHome | TR | TR-00000001 | trusthome.tlid.io |
| 4 | TrustVault | TV | TV-00000001 | trustvault.tlid.io |
| 5 | TLID.io | TI | TI-00000001 | tlid.io |
| 6 | THE VOID | VO | VO-00000001 | thevoid.tlid.io |
| 7 | Signal Chat | SC | SC-00000001 | signalchat.tlid.io |
| 8 | DarkWave Studio | DS | DS-00000001 | darkwavestudio.tlid.io |
| 9 | Guardian Shield | GS | GS-00000001 | guardianshield.tlid.io |
| 10 | Guardian Scanner | GN | GN-00000001 | guardianscanner.tlid.io |
| 11 | Guardian Screener | GR | GR-00000001 | guardianscreener.tlid.io |
| 12 | TradeWorks AI | TW | TW-00000001 | tradeworks.tlid.io |
| 13 | StrikeAgent | SA | SA-00000001 | strikeagent.tlid.io |
| 14 | Pulse | PU | PU-00000001 | pulse.tlid.io |
| 15 | Chronicles | CH | CH-00000001 | chronicles.tlid.io |
| 16 | The Arcade | AR | AR-00000001 | thearcade.tlid.io |
| 17 | Bomber | BO | BO-00000001 | bomber.tlid.io |
| 18 | Trust Golf | TG | TG-00000001 | trustgolf.tlid.io |
| 19 | ORBIT Staffing OS | OR | OR-00000001 | orbit.tlid.io |
| 20 | Orby Commander | OC | OC-00000001 | orby.tlid.io |
| 21 | GarageBot | GB | GB-00000001 | garagebot.tlid.io |
| 22 | Lot Ops Pro | LO | LO-00000001 | lotops.tlid.io |
| 23 | TORQUE | TQ | TQ-00000001 | torque.tlid.io |
| 24 | TL Driver Connect | DC | DC-00000001 | driverconnect.tlid.io |
| 25 | VedaSolus | VS | VS-00000001 | vedasolus.tlid.io |
| 26 | Verdara | VD | VD-00000001 | verdara.tlid.io |
| 27 | Arbora | AB | AB-00000001 | arbora.tlid.io |
| 28 | PaintPros | PP | PP-00000001 | paintpros.tlid.io |
| 29 | Nashville Painting Professionals | NP | NP-00000001 | nashvillepainting.tlid.io |
| 30 | Trust Book | TB | TB-00000001 | trustbook.tlid.io |
| 31 | DarkWave Academy | DA | DA-00000001 | darkwaveacademy.tlid.io |
| 32 | Happy Eats | HE | HE-00000001 | happyeats.tlid.io |
| 33 | Brew & Board Coffee | BB | BB-00000001 | brewandboard.tlid.io |

### Hallmark System
- **Genesis Hallmark**: `TG-00000001` — auto-created on first server boot via `seedGenesisHallmark()` in `server/hallmark.ts`
- **Database Tables**: `hallmarks`, `trust_stamps`, `hallmark_counter` — all in `shared/schema.ts`
- **Hashing**: SHA-256 hash of every hallmark/stamp payload; simulated txHash and blockHeight (pre-mainnet)
- **API Endpoints**:
  - `GET /api/hallmark/genesis` — public, returns genesis hallmark
  - `GET /api/hallmark/:id/verify` — public verification endpoint
- **Trust Stamps**: Auto-generated for `auth-register` and `auth-login` events
- **UI**: Genesis badge in profile footer (tappable → `app/hallmark-detail.tsx`), also in hamburger menu

### Affiliate Program
- **Module**: `server/affiliate.ts` — tier logic, dashboard, referral tracking, payouts, commission processing
- **Database Tables**: `affiliate_referrals`, `affiliate_commissions` — in `shared/schema.ts`
- **User field**: `unique_hash` column added to `users` table, generated at registration (12-char hex)
- **Commission Tiers**: Base (10%), Silver (12.5%), Gold (15%), Platinum (17.5%), Diamond (20%)
- **Referral Link Format**: `https://trustgolf.tlid.io/ref/[uniqueHash]`
- **Referral Flow**: `/ref/[hash]` stores hash in localStorage → registration reads it and passes to backend → verification email includes `?ref=hash` → email verification calls `convertReferral` → localStorage cleared after registration
- **Commission Auto-Creation**: `processSale()` in `server/affiliate.ts` — called on Bomber Pro unlock ($9.99), creates commission row with duplicate prevention (one commission per referral)
- **API Endpoints**:
  - `GET /api/affiliate/dashboard?userId=` — full affiliate stats
  - `GET /api/affiliate/link?userId=` — user's referral link + cross-platform links
  - `POST /api/affiliate/track` — public, tracks referral click `{ referralHash, platform }`
  - `POST /api/affiliate/request-payout` — request payout of pending commissions (min 10 SIG)
- **UI**: "Share & Earn" screen at `app/affiliate.tsx`, accessible from hamburger menu and profile screen (logged-in users only)

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