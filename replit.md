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

## Roadmap: "Bomber" — Long Drive Game

**Concept**: A long drive mini-game built into the Trust Golf app. Not a full course simulator — this is the one perfect shot that keeps golfers coming back. Pure power, instant gratification, big numbers.

**Technical Stack**:
- **Rendering**: @shopify/react-native-skia (bundled in Expo Go, web via CanvasKit) for 2D/2.5D ball flight visualization
- **Game Loop**: react-native-game-engine for entity management and physics tick
- **Physics**: Custom ballistic flight model (launch angle, spin, wind resistance, altitude)
- **Platform**: Runs on web, iOS, and Android inside the existing Expo app — no native build required

**Phase 1 — Playable MVP**:
- Swing mechanic: Timing-based power meter with angle control
- Ball flight physics: realistic trajectory with carry + roll
- Side-view or 3/4 view rendering of the drive with distance markers
- Big dramatic distance display on landing
- Personal best tracking (local state)
- Single venue (open fairway)

**Phase 2 — Engagement Layer**:
- Leaderboards (server-side, per-user high scores)
- Daily challenges ("Hit 300+ in 40mph headwind")
- Multiple venues (desert, links, mountain, stadium)
- Weather/wind conditions that change per attempt
- Replay camera showing the ball flight from different angles
- Sound design (crack of the driver, crowd reactions on monster drives)

**Phase 3 — Depth & Monetization**:
- Unlockable equipment (drivers, balls) with different flight characteristics
- Swing style customization (draw/fade tendency, launch profile)
- Tournament mode (weekly competitions with prizes/badges)
- Integration with Trust Golf profile (handicap affects starting conditions)
- Share replays to social media
- Stadium mode with animated crowd and announcer reactions

**Design Philosophy**: Premium, clean aesthetic consistent with Trust Golf brand. Not cartoony — stylized and satisfying. The feeling of a 350-yard bomb should look and feel as good in the game as it does in real life.

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