# Trust Golf — Premium Golf Companion Platform

**Developer:** DarkWave Studios LLC
**Live URL:** https://trustgolf.app
**Replit URL:** https://trustgolf.replit.app
**Connected Game:** https://bomber.tlid.io (Bomber Long Drive 3D — hosted on Vercel)

---

## Marketing Description

Trust Golf is a premium, mobile-first golf companion platform designed for the modern golfer. It combines AI-powered swing analysis, GPS distance finding, comprehensive course cataloging, score tracking with live handicap calculation, curated deals, and an editorial-quality blog — all wrapped in a cinematic, publication-grade interface.

At its core is a curated catalog of 45+ premier golf courses across 13 states and Scotland, written with the detail and storytelling quality of a coffee table book. Each course profile reads like a feature article — covering designer legacy, signature holes, landscape, seasonal character, and the kind of narrative that makes golfers say "we need to play this one."

The platform also powers **Bomber Long Drive**, an external 3D long drive competition game at bomber.tlid.io, providing the backend for player profiles, leaderboards, equipment progression, achievements, tournaments, and a full in-game economy.

Trust Golf is built for golfers, by golfers — designed to be the one app you open before every round and the one platform that connects your entire golf life.

---

## Lines of Code

| Language / File Type | Files | Lines |
|---------------------|-------|-------|
| TypeScript / TSX | 70 | ~17,650 |
| HTML (landing page, templates) | — | ~820 |
| JSON (config, app.json, tsconfig) | — | ~245 |
| **Total Application Code** | **70+** | **~18,700** |

*Excludes node_modules, build output (dist-web), lock files, and Expo cache.*

---

## Full Feature Set

### 1. Cinematic Explorer (Home Screen)
- AI-generated golf video hero section with parallax scrolling
- Image slideshow with course photography
- Category carousels (Courses, Deals, Blog, Tools)
- Quick-action grid: Score Tracker, Swing Analyzer, GPS, Deals
- "Hot Deals" highlighting savings over 30%
- Hamburger navigation menu with links to all features and Bomber game

### 2. Course Catalog (45+ Courses)
- Curated catalog spanning SC, TN, GA, NC, MS, FL, NY, PA, CA, OR, WI, WA, and Scotland
- State-based filtering with search
- Detailed course profiles: green fees, par, yardage, slope/rating, designer, year established
- Amenity tags (Pro Shop, Driving Range, Restaurant, Lodging, etc.)
- Editorial-quality descriptions — rich narrative covering history, landscape, signature holes
- Designed as a future printable coffee table book

### 3. Score Tracking & Handicap Intelligence
- Digital 18-hole scorecards with per-hole par, yardage, and handicap index
- Quick-entry buttons for scores and putts
- Front 9 / Back 9 / Total score calculations
- Round history with total scores, par differentials, and dates
- Statistics dashboard: total rounds, average score, personal best
- Live USGA Handicap Index calculation from recorded rounds
- Fairways in Regulation (FIR) and Greens in Regulation (GIR) tracking

### 4. AI Swing Analyzer
- Powered by OpenAI GPT-4 Vision via Replit AI Integrations
- Photo and video capture modes (camera or gallery upload)
- Club-specific analysis: Driver, Woods, Hybrids, Irons, Wedges, Putter
- Slow-motion video frame extraction for isolating swing positions
- Detailed feedback on grip, stance, backswing, impact, and follow-through
- Score meters, actionable tips, and recommended drills
- TrustVault integration for video editing and processing

### 5. GPS Distance Finder
- Satellite map view with 45+ pre-mapped courses
- Tap-to-pin distance measurement from current GPS position
- Simulation mode for off-course planning and testing
- Yards/meters unit toggle
- Uses react-native-maps (native) and Leaflet + Esri satellite tiles (web)

### 6. Deals Engine
- Curated discounted tee times and equipment promotions
- "Hot Deal" badges for savings over 30%
- Affiliate program integration
- Managed via Developer Dashboard

### 7. Golf Blog
- AI-generated SEO-optimized content via GPT-4o
- Categories: Tips, Course Spotlights, Equipment, News, Fitness, Strategy
- Dynamic Meta/OG tags for social sharing
- Automated sitemap.xml generation
- Blog management via Developer Dashboard

### 8. Bomber Long Drive (External 3D Game — bomber.tlid.io)
Backend API powering the external Bomber 3D game:
- **Player Profiles**: Creation, progression, XP, leveling, division ranking
- **Equipment System**: Drivers and balls with rarity tiers (Common → Legendary), card collection/fusion, stat modifiers affecting physics
- **Currency Economy**: Coins (earned from drives/chests), Gems (premium), XP (progression)
- **Leaderboards**: Global and venue-specific high score tracking
- **Daily Rewards**: 24-hour chest cycle with streak bonuses (3-day, 7-day, 30-day)
- **Drive Chests**: Bronze/Silver/Gold/Diamond tiers based on performance
- **Achievements**: 25 achievements across 6 categories (milestone, distance, contest, streak, venue, collection)
- **Tournaments**: Entry fees, drive recording, tournament leaderboards
- **12 Real Course Venues**: The Grid (free), Pebble Beach, Augusta National, TPC Sawgrass, St Andrews, Kiawah Island, Pinehurst No. 2, Whistling Straits, Bethpage Black, Bandon Dunes, Harbour Town, Torrey Pines — each with unique wind patterns, elevation, altitude bonuses
- **Venue Challenges**: 16 unique challenges (distance thresholds, headwind mastery, night mode, power, accuracy)
- **Divisions**: Bronze → Silver → Gold → Platinum → Diamond → Legend
- **Contest Mode**: Qualifying (6 balls) → Brackets (3 balls) → Finals (2 balls)
- **Daily Challenges**: Dynamic objectives with rewards
- **CORS**: Configured for bomber.tlid.io and bomber-3d.vercel.app
- **Adapter Routes**: Auto-translate external game payloads to internal format
- **Pay Gating**: Currently disabled — all features free during development

### 9. Developer Dashboard (Admin Panel)
- Master PIN authentication
- CRUD management for courses, deals, and blog posts
- AI blog post generator (topic + category → full article)
- Real-time self-hosted analytics:
  - Session tracking, page views, unique visitors
  - Device breakdown, top pages, traffic trends
  - KPI dashboard with date filtering
- Whitelist management for VIP/early access users
- Affiliate program management

### 10. Partner Program
- Vendor application system for golf courses and pro shops
- Three tiers: Free Listing, Featured Partner, Premium Partner
- Automated confirmation emails via Resend
- Marketing page with value proposition and benefits

### 11. Trust Layer / DarkWave Ecosystem Integration
- SSO / Unified Identity system
- HMAC-authenticated server-to-server communication
- TrustVault media platform integration (upload, edit, process video)
- Webhook callbacks for render status
- Ecosystem directory page (via dwsc.io widget)

### 12. PWA & Web Support
- Service worker for offline caching and installability
- Separate Bomber PWA identity (own manifest, service worker, branding)
- Responsive web layout with platform-aware safe area insets
- SEO: robots.txt, sitemap.xml, dynamic OG tags

### 13. Authentication & Access Control
- Free content browsing (no login required for courses, deals, blog)
- Login modal for gated features (Swing Analyzer, Score Tracking)
- Whitelist system for VIP access
- Developer PIN for admin dashboard

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React Native | Cross-platform mobile UI framework |
| Expo SDK 54 | Development platform, build tooling, native APIs |
| Expo Router | File-based routing (Pages Router pattern) |
| TypeScript | Type-safe application code |
| @tanstack/react-query | Server state management and caching |
| react-native-reanimated | Animations and transitions |
| react-native-maps | Native map component (GPS features) |
| Leaflet + Esri | Web map component (satellite tiles) |
| expo-image | Optimized image loading |
| expo-video | Video playback for swing analysis |
| expo-video-thumbnails | Frame extraction from swing videos |
| expo-camera | Photo/video capture for swing analysis |
| expo-location | GPS positioning |
| expo-haptics | Tactile feedback |
| expo-secure-store | Secure credential storage |
| @expo/vector-icons (Ionicons) | Iconography |
| @expo-google-fonts/inter | Typography |
| expo-linear-gradient | Gradient backgrounds and overlays |

### Backend
| Technology | Purpose |
|-----------|---------|
| Express.js | HTTP server and API framework |
| TypeScript | Type-safe server code |
| PostgreSQL | Primary database (Replit managed) |
| Drizzle ORM | Database schema, migrations, and queries |
| OpenAI GPT-4 Vision | AI swing analysis engine |
| Replit AI Integrations | Managed AI model access |
| Replit Object Storage | Cloud asset storage |
| Resend | Transactional email (partner confirmations) |
| TrustVault API | Media storage, video editing, processing |
| HMAC Authentication | Secure server-to-server communication |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Replit | Hosting, deployment, database, object storage |
| Vercel | Bomber 3D game hosting (bomber.tlid.io) |
| Namecheap | Domain management (tlid.io, trustgolf.app) |
| CORS | Cross-origin API access for external game |
| Service Workers | PWA offline support and installability |

---

## Database Schema (PostgreSQL)

### Core Tables
- `users` — User accounts and authentication
- `rounds` — Score tracking round records
- `swing_analyses` — AI swing analysis results
- `courses` — Golf course catalog entries
- `deals` — Promotional deals and discounts
- `blog_posts` — Blog content and metadata
- `analytics_sessions` — Self-hosted analytics sessions
- `analytics_events` — Self-hosted analytics events
- `partners` — Partner program applications

### Bomber Game Tables
- `bomber_profiles` — Player profiles, XP, level, division, currency, equipped items
- `bomber_equipment` — Player equipment inventory (drivers, balls, rarity, stats)
- `bomber_leaderboard` — Drive records and high scores
- `bomber_chest_queue` — Chest reward queue and opening timers
- `bomber_daily_challenges` — Daily challenge assignments and completion
- `bomber_venues` — Course venue definitions
- `bomber_venue_unlocks` — Per-user venue unlock records
- `bomber_tournaments` — Tournament definitions and scheduling
- `bomber_tournament_entries` — Tournament participation and scores
- `bomber_achievements` — Per-user achievement unlock records

---

## API Surface

### Core Endpoints
- `GET/POST /api/courses` — Course catalog CRUD
- `GET/POST /api/deals` — Deals management
- `GET/POST /api/rounds` — Score tracking
- `POST /api/swing-analysis` — AI swing analysis
- `GET/POST /api/blog` — Blog content
- `GET/POST /api/analytics` — Self-hosted analytics
- `POST /api/partner` — Partner applications
- `GET /api/sitemap.xml` — SEO sitemap
- `GET /api/robots.txt` — SEO robots

### Bomber Game Endpoints (serves bomber.tlid.io)
- `POST /api/bomber/drive` — Submit drive (auto-translates external field names)
- `GET /api/bomber/profile/:userId` — Get/create player profile
- `PUT /api/bomber/profile/:userId` — Update profile
- `GET /api/bomber/leaderboard/:venueId` — Venue-filtered leaderboard
- `GET /api/bomber/equipment/:userId` — Player equipment
- `POST /api/bomber/equip/:userId` — Equip item
- `POST /api/bomber/chest/open` — Open chest
- `POST /api/bomber/daily-reward` — Claim daily reward
- `GET /api/bomber/contest/available/:userId` — Contest eligibility
- `POST /api/bomber/contest/submit` — Submit contest entry
- `GET /api/bomber/venues` — List venues
- `GET /api/bomber/achievements/:userId` — Player achievements
- `POST /api/bomber/achievements/check` — Auto-check achievement progress
- `GET /api/bomber/tournaments/active` — Active tournaments
- `POST /api/bomber/tournaments/enter` — Enter tournament
- `POST /api/bomber/tournaments/drive` — Record tournament drive

---

## Connected Services & Domains

| Domain | Host | Purpose |
|--------|------|---------|
| trustgolf.app | Replit | Main platform (frontend + API) |
| trustgolf.replit.app | Replit | Replit default domain |
| bomber.tlid.io | Vercel | Bomber 3D long drive game |
| bomber-3d.vercel.app | Vercel | Bomber default Vercel domain |
| trustvault.replit.app | Replit | Media storage/editing platform |
| dwsc.io | — | DarkWave Studios ecosystem directory |

---

## Business Model

- **Freemium**: Core features (course catalog, blog, deals) are free. Premium features (AI Swing Analyzer, Score Tracking) require login.
- **Partner Revenue**: Tiered partnership program for golf courses and pro shops.
- **Bomber Economy**: In-game currency system (Coins, Gems) — currently free during development, designed for future monetization via Bomber Pro subscriptions and premium content.
- **Affiliate**: Deal referral commissions.

---

## Project Status

- **Production**: Live at trustgolf.app
- **Bomber 3D**: Live at bomber.tlid.io, connected to backend API
- **Pay Gating**: Disabled for Bomber — all features unlocked during development
- **Course Catalog**: 45+ courses, editorial quality, designed as future coffee table book
- **Active Development**: Ongoing feature additions across both platforms
