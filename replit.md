# Trust Golf - Premium Golf Companion App

## Overview
A premium mobile-first golf platform built with React Native + Expo, featuring a cinematic Explorer landing page, AI-powered swing analysis (photo + video), score tracking, course discovery, TrustVault media integration, and exclusive deals. Inspired by GolfNow. No login required to browse — auth only gates subscription features. By DarkWave Studios LLC.

## Architecture
- **Frontend**: React Native + Expo (SDK 54) with file-based routing via Expo Router
- **Backend**: Express.js server on port 5000
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (vision model for swing analysis)
- **Object Storage**: Replit Object Storage for assets
- **Media Platform**: TrustVault integration for media storage, editing, and video tools
- **Hero**: Image slideshow with Ken Burns effect (no video dependency)

## Design System
- **Theme**: Golf-green primary (#1B5E20 light, #4CAF50 dark) with gold accent (#C5A55A)
- **UI**: 3-column Bento grid layout, glass morphism cards, orb effects, skeleton loaders
- **Font**: Inter (Google Fonts)
- **Components**: GlassCard, BentoGrid, Carousel, OrbEffect, AccordionItem, PremiumText, SkeletonLoader
- **Light/Dark toggle** with system option

## Auth Flow
- App opens directly to Explorer page (no login gate)
- Users can browse all content freely (courses, deals, etc.)
- Login modal triggers only when accessing gated features:
  - AI Swing Analyzer (requires sign-in)
  - Creating new rounds (requires sign-in)
- Login modal supports redirect params for seamless post-login navigation
- Developer access: master pin 0424 → developer dashboard

## Branding
- **App Name**: Trust Golf
- **Company**: DarkWave Studios LLC © 2026 → darkwavestudios.io
- **Trust Layer**: Powered by Trust Layer → dwtl.io
- **TrustShield**: Protected by TrustShield → trustshield.tech
- **Header**: "Trust Golf" left, hamburger menu right (compact)
- **Footer**: Company links, developer access

## Key Features
1. **Cinematic Explorer Page** - Image slideshow hero with Ken Burns effect, category carousels, hot deals, top courses, quick actions
2. **Course Catalog** - 45 courses (20 world-class + 8 Upstate SC + 17 Middle TN/Nashville) with full descriptions, designer info, year built, course type, unique gallery images, amenities with icons, contact info
3. **Score Tracking** - Log rounds with stats (putts, FIR, GIR), view history and averages
4. **AI Swing Analyzer** - Upload photo OR record video for AI-powered analysis
5. **Video Swing Playback** - Slow-motion playback (0.25x/0.5x/1x), frame capture for analysis, TrustVault studio editing
6. **Swing Results** - Detailed breakdown with score meters, tips, and drills
7. **Deals** - Browse discounted tee times and packages
8. **Developer Dashboard** - Password-protected (0424) admin panel for managing courses and deals
9. **Profile** - User settings, theme toggle, stats overview
10. **TrustVault Integration** - Media storage, video/image/audio editors via embedded iframe, webhook callbacks for render status

## TrustVault Integration
- **API Base**: https://trustvault.replit.app/api/studio
- **Auth**: Trust Layer SSO (shared JWT_SECRET, HS256)
- **Service Module**: server/trustvault.ts (upload, confirm, list, embed editor, projects)
- **Backend Routes**: /api/trustvault/* (webhook, status, media, upload-url, confirm-upload, editor-embed, capabilities)
- **Webhook**: POST /api/trustvault/webhook receives render.started, render.complete, render.failed events
- **SSO**: Register app at orbitstaffing.io, shared JWT_SECRET env var needed for live connection

## File Structure
```
app/
  _layout.tsx          - Root layout with providers (theme, auth, fonts)
  index.tsx            - Redirect to (tabs)
  login.tsx            - Login modal (triggered for gated features)
  (tabs)/
    _layout.tsx        - Tab navigation (5 tabs)
    index.tsx          - Cinematic Explorer page (image slideshow hero + category carousels)
    courses.tsx        - Course discovery
    scores.tsx         - Score tracking
    deals.tsx          - Deals listing
    profile.tsx        - User profile & settings
  course/[id].tsx      - Course detail modal
  new-round.tsx        - Log new round modal
  swing-analyzer.tsx   - AI swing analysis (photo + video modes)
  swing-video.tsx      - Video swing playback with slow-mo + frame capture
  swing-result.tsx     - Analysis results display
  developer.tsx        - Developer dashboard

components/
  GlassCard.tsx        - Glass morphism card with blur and 3D press
  BentoGrid.tsx        - Flexible grid layout system
  Carousel.tsx         - Horizontal carousel with dots
  OrbEffect.tsx        - Animated orb background effect
  AccordionItem.tsx    - Expandable accordion
  PremiumText.tsx      - Styled text with variants and shadows
  SkeletonLoader.tsx   - Loading skeleton animation
  InstallBanner.tsx    - PWA install prompt (web only)
  AppSplash.tsx        - Animated app splash screen

contexts/
  ThemeContext.tsx      - Theme management (light/dark/system)
  AuthContext.tsx       - Authentication state

server/
  index.ts             - Express server setup
  routes.ts            - API routes (auth, courses, rounds, deals, swing-analyze, stats, trustvault, seed)
  storage.ts           - Database storage implementation (CRUD for all entities)
  db.ts                - Database connection
  trustvault.ts        - TrustVault API service module

shared/
  schema.ts            - Drizzle ORM schema (users, courses, rounds, swingAnalyses, deals, conversations, messages)

constants/
  colors.ts            - Theme color palette (light + dark)
```

## API Endpoints
- POST /api/auth/login - Login/register
- GET/POST /api/courses - Course CRUD
- GET /api/courses/:id - Course detail
- PUT /api/courses/:id - Update course
- DELETE /api/courses/:id - Delete course
- GET /api/rounds/:userId - User rounds
- POST /api/rounds - Create round
- GET /api/deals - Get deals
- POST /api/deals - Create deal
- POST /api/swing-analyze - AI swing analysis
- GET /api/stats/:userId - User statistics
- POST /api/trustvault/webhook - TrustVault render callbacks
- GET /api/trustvault/capabilities - TrustVault service discovery
- GET /api/trustvault/status - Check TrustVault connection
- GET /api/trustvault/media - List vault media
- POST /api/trustvault/upload-url - Get presigned upload URL
- POST /api/trustvault/confirm-upload - Confirm media upload
- POST /api/trustvault/editor-embed - Get editor embed token
- POST /api/seed - Seed sample data

## Course Catalog Regions
- **World-Class**: Augusta National, Pebble Beach, TPC Sawgrass, Pinehurst No. 2, Bethpage Black, Torrey Pines, Whistling Straits, Kiawah Island Ocean Course, Bandon Dunes, Pacific Dunes, Oakmont, Cypress Point, Shinnecock Hills, Merion, Streamsong Red, Cabot Cliffs, Sand Valley, Winged Foot, Chambers Bay, St Andrews
- **Upstate SC**: Walker Course (Clemson), Furman, Cherokee Valley, Preserve at Verdae, Cobb's Glen, Boscobel, Southern Oaks, Smithfields
- **Middle TN / Nashville**: Gaylord Springs, Hermitage (President's Reserve + General's Retreat), Nashville Golf & Athletic, Harpeth Hills, McCabe, Greystone, Old Fort, Indian Hills, Twelve Stones Crossing, Windtree (Mt Juliet), Pine Creek (Mt Juliet), Eagles Landing (Lebanon), Long Hollow (Gallatin), Ted Rhodes, Stones River (Murfreesboro), Shepherds Crook (Hendersonville)
