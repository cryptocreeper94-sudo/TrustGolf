# GolfPro - Premium Golf Companion App

## Overview
A premium mobile-first golf platform built with React Native + Expo, featuring a cinematic Explorer landing page, AI-powered swing analysis, score tracking, course discovery, and exclusive deals. Inspired by GolfNow. No login required to browse — auth only gates subscription features.

## Architecture
- **Frontend**: React Native + Expo (SDK 54) with file-based routing via Expo Router
- **Backend**: Express.js server on port 5000
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (vision model for swing analysis)
- **Object Storage**: Replit Object Storage for assets
- **Video**: expo-video for cinematic hero section

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
- Developer access: password 0424 → developer dashboard

## Key Features
1. **Cinematic Explorer Page** - Video hero with auto-cycling golf course flyovers (with image fallback), category carousels, hot deals, top courses, quick actions
2. **Course Discovery** - Search/browse courses with detailed info, ratings, amenities
3. **Score Tracking** - Log rounds with stats (putts, FIR, GIR), view history and averages
4. **AI Swing Analyzer** - Upload photo via camera/gallery, get AI-powered feedback with scores
5. **Swing Results** - Detailed breakdown with score meters, tips, and drills
6. **Deals** - Browse discounted tee times and packages
7. **Developer Dashboard** - Password-protected (0424) admin panel for managing courses and deals
8. **Profile** - User settings, theme toggle, stats overview

## File Structure
```
app/
  _layout.tsx          - Root layout with providers (theme, auth, fonts)
  index.tsx            - Redirect to (tabs)
  login.tsx            - Login modal (triggered for gated features)
  (tabs)/
    _layout.tsx        - Tab navigation (5 tabs)
    index.tsx          - Cinematic Explorer page (video hero + category carousels)
    courses.tsx        - Course discovery
    scores.tsx         - Score tracking
    deals.tsx          - Deals listing
    profile.tsx        - User profile & settings
  course/[id].tsx      - Course detail modal
  new-round.tsx        - Log new round modal
  swing-analyzer.tsx   - AI swing analysis modal
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

contexts/
  ThemeContext.tsx      - Theme management (light/dark/system)
  AuthContext.tsx       - Authentication state

server/
  index.ts             - Express server setup
  routes.ts            - API routes (auth, courses, rounds, deals, swing-analyze, stats, seed)
  storage.ts           - Database storage implementation
  db.ts                - Database connection

shared/
  schema.ts            - Drizzle ORM schema (users, courses, rounds, swingAnalyses, deals, conversations, messages)

constants/
  colors.ts            - Theme color palette (light + dark)
```

## API Endpoints
- POST /api/auth/login - Login/register
- GET/POST /api/courses - Course CRUD
- GET /api/courses/:id - Course detail
- GET /api/rounds/:userId - User rounds
- POST /api/rounds - Create round
- GET /api/deals - Get deals
- POST /api/deals - Create deal
- POST /api/swing-analyze - AI swing analysis
- GET /api/stats/:userId - User statistics
- POST /api/seed - Seed sample data
