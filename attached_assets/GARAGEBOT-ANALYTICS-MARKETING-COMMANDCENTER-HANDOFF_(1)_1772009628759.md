# GarageBot Analytics, Marketing Hub & Command Center — Full Handoff Document

**Platform:** GarageBot.io  
**Company:** DarkWave Studios LLC  
**Last Updated:** February 14, 2026  
**Stack:** React 18 + TypeScript + Vite (frontend) | Node.js + Express + PostgreSQL/Drizzle ORM (backend)  
**Theme:** "Deep Space / Future Forward" — dark palette, electric cyan (#00D9FF) accents, glassmorphism, neon glow effects

---

## TABLE OF CONTENTS

1. [Command Center (Admin Landing Page)](#1-command-center-admin-landing-page)
2. [Analytics System](#2-analytics-system)
3. [Marketing Hub](#3-marketing-hub)
4. [Meta Ads Campaigns](#4-meta-ads-campaigns)
5. [Social Media Connectors](#5-social-media-connectors)
6. [SEO Management System](#6-seo-management-system)
7. [UI Design System & Premium Styling](#7-ui-design-system--premium-styling)
8. [Database Schema (Key Tables)](#8-database-schema-key-tables)
9. [Environment Variables & Secrets](#9-environment-variables--secrets)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [File Map](#11-file-map)
12. [Setup & Configuration Guide](#12-setup--configuration-guide)

---

## 1. COMMAND CENTER (Admin Landing Page)

### Overview
The Command Center (`/command-center`) is an admin-only dashboard that serves as the central launchpad for managing all 46+ platform tools organized across 8 categories. It features spacious horizontal carousels with photorealistic image-backed cards — each card has its own unique AI-generated image (no repeats), a cinematic dark gradient overlay, and a clean bottom-aligned label with icon.

### Design Philosophy (Feb 2026 Redesign)
- **46 unique photorealistic images:** Every card has its own distinct image stored in `client/src/assets/images/cc/`. No image is reused across cards.
- **Spacious carousels:** Cards are 320px/340px wide with 24px gaps (`pl-6`), giving proper breathing room between cards.
- **Generous section spacing:** `space-y-16` between categories for clear visual separation.
- **Cinematic overlay:** `bg-gradient-to-t from-black/95 via-black/50 to-transparent` keeps text legible over any image.
- **Hover effects:** Cards lift upward (`y: -4`), scale (`1.03`), and the background image zooms in smoothly (`scale-110`, 700ms ease-out).
- **Lazy loading:** All card images use `loading="lazy"` for performance.
- **Card height:** 220px for all cards (taller than before for better image framing).

### Route
`/command-center` — Registered in `client/src/App.tsx`

### File
`client/src/pages/CommandCenter.tsx`

### Access Control
- **Login Gate:** Custom `LoginGate` component requiring username + PIN authentication
- **Role Check:** Only users with `role === "admin"` can access. Non-admin authenticated users see an "Access Restricted" screen.
- **Auth Flow:** Calls `POST /api/auth/login`, checks `data.user.role`, and on success invalidates the `auth-user` query to refresh state.

### 8 Categories (with all cards)

#### Category 1: Analytics & Insights
- **Gradient:** `from-cyan-500 to-blue-500`
- **Icon:** `BarChart3`
- **Cards:**
  - Analytics Dashboard → `/dev` (badge: "Live", featured)
  - System Dashboard → `/dashboard`
  - Affiliate Analytics → `/dev`
  - SEO Manager → `/dev`

#### Category 2: Marketing & Growth
- **Gradient:** `from-purple-500 to-pink-500`
- **Icon:** `Megaphone`
- **Cards:**
  - Marketing Hub → `/marketing` (featured)
  - Blog Manager → `/blog`
  - Newsletter → `/dev`
  - Meta Ads Campaigns → `/marketing`
  - Sponsored Products → `/dev`

#### Category 3: Revenue & Monetization
- **Gradient:** `from-green-500 to-emerald-500`
- **Icon:** `DollarSign`
- **Cards:**
  - Affiliate Networks → `/dev` (badge: "Earn", featured)
  - Inbound Affiliate Program → `/affiliates` (badge: "New")
  - Pro Memberships → `/pro`
  - Stripe Payments → `/dev`
  - Genesis Hallmarks → `/hallmark`
  - Referral Program → `/invite`

#### Category 4: Mechanics Garage Suite
- **Gradient:** `from-orange-500 to-red-500`
- **Icon:** `Wrench`
- **Cards:**
  - Shop Portal → `/shop-portal` (featured)
  - Mechanics Garage → `/mechanics-garage`
  - Shop Inventory → `/mechanics-garage`
  - Digital Inspections → `/mechanics-garage`
  - ORBIT Staffing → `/mechanics-garage`
  - Business Integrations → `/mechanics-garage`
  - Partner API → `/dev`

#### Category 5: Community & Engagement
- **Gradient:** `from-blue-500 to-indigo-500`
- **Icon:** `MessageCircle`
- **Cards:**
  - Signal Chat → `/chat` (featured)
  - Break Room → `/break-room`
  - Shade Tree Mechanics → `/shade-tree`
  - Trivia Quiz → `/trivia`
  - Giveaways → `/dev`

#### Category 6: Vehicle & Parts
- **Gradient:** `from-red-500 to-orange-500`
- **Icon:** `Car`
- **Cards:**
  - Parts Search → `/results` (featured)
  - My Garage → `/garage`
  - DIY Guides → `/diy-guides`
  - Parts Marketplace → `/marketplace`
  - Wishlists → `/wishlists`
  - Build Projects → `/projects`
  - Price Alerts → `/garage`

#### Category 7: Services & Directories
- **Gradient:** `from-teal-500 to-cyan-500`
- **Icon:** `Compass`
- **Cards:**
  - Insurance Comparison → `/insurance`
  - Rental Cars → `/rentals`
  - CDL Directory → `/cdl-directory`
  - Vendor Management → `/vendor-signup`
  - Weather Radar → `/break-room`
  - Support Center → `/support`

#### Category 8: Platform & Development
- **Gradient:** `from-slate-500 to-zinc-500`
- **Icon:** `Settings`
- **Cards:**
  - Dev Portal → `/dev` (featured)
  - Release Manager → `/dev`
  - Blockchain Verifier → `/dev`
  - User Management → `/dev`
  - Explore Page → `/explore`
  - Investor Portal → `/investors`

### Card Design (Photorealistic Image Cards)
Each card is a 320px-wide (340px on sm+) image-backed panel with:
- **Background Image:** Unique AI-generated PNG from `client/src/assets/images/cc/`, `object-cover`, lazy loaded
- **Overlay:** `bg-gradient-to-t from-black/95 via-black/50 to-transparent` for text readability
- **Border:** `border-white/[0.08]`, transitions to `border-white/[0.2]` on hover
- **Icon Badge:** 36x36px rounded-xl with `bg-white/10 backdrop-blur-md border-white/15`
- **Height:** 220px fixed
- **Hover:** Scale 1.03, lift -4px, image zooms to 110%, dark shadow intensifies

### UI Components Used
- **Carousel:** shadcn/ui `Carousel` (`CarouselContent`, `CarouselItem`, `CarouselNext`, `CarouselPrevious`) with `dragFree: true` and `align: "start"`
- **Animations:** Framer Motion — staggered entry with `catIndex * 0.06 + index * 0.04` delay, `whileHover: { scale: 1.03, y: -4 }`, `whileTap: { scale: 0.98 }`
- **Badges:** "Live", "New", "Earn" badges with gradient pill backgrounds positioned top-right (badge takes priority over featured flag to avoid overlap)
- **Featured Flag:** Yellow bordered pill badge positioned top-right for featured cards (hidden when badge is also present)
- **Skeleton Loading:** `SkeletonCard` and `SkeletonSection` components shown during 300ms load delay
- **Top Bar:** Fixed backdrop-blur header with back button, gradient icon, title, user greeting, and logout button

### Card Images
All 46 card images are stored at `client/src/assets/images/cc/` as PNGs and imported at the top of `CommandCenter.tsx`. Each card has its own unique AI-generated image — no image is reused across cards.

Image naming convention: `{feature-name}.png` (e.g., `analytics-dashboard.png`, `marketing-hub.png`, `signal-chat.png`)

### How to Add a New Card
1. Generate or add an image to `client/src/assets/images/cc/` (recommended: high-quality, unique to the feature)
2. Import the image at the top of `CommandCenter.tsx`: `import imgNewFeature from "@/assets/images/cc/new-feature.png";`
3. Add a `LaunchCard` object to the appropriate category in the `categories` array:
```typescript
{ label: "New Feature", description: "Short description here", href: "/route", icon: LucideIconName, image: imgNewFeature, badge: "New", featured: false }
```

### How to Add a New Category
Add a new `Category` object to the `categories` array:
```typescript
{
  title: "Category Name",
  icon: LucideIconName,
  gradient: "from-color-500 to-color-500",
  description: "One or two sentences describing what this category covers.",
  cards: [ /* LaunchCard objects */ ]
}
```

---

## 2. ANALYTICS SYSTEM

### Overview
GarageBot has a custom-built, first-party analytics system that tracks page views, sessions, unique visitors, events, device/browser/geo breakdowns, UTM parameters, and referral sources. No third-party analytics (Google Analytics, etc.) is used — everything is self-hosted in PostgreSQL.

### Architecture

#### Client-Side Tracking Hook: `client/src/hooks/useAnalytics.ts` (186 lines)
- **Visitor ID:** Stored in `localStorage` as `gb_visitor_id` (persists across sessions, format: `v_` + UUID)
- **Session ID:** Stored in `sessionStorage` as `gb_session_id` (new per browser tab/session)
- **Auto-tracking:** The `useAnalytics()` hook is called in `App.tsx` and automatically:
  - Creates a session on first visit (`POST /api/analytics/session`)
  - Tracks page views on route changes (`POST /api/analytics/pageview`) with 100ms debounce
  - Sends session-end beacon on `beforeunload` (`POST /api/analytics/session/:id/end`)
- **UTM Support:** Captures `utm_source`, `utm_medium`, `utm_campaign` from URL params
- **Event Tracking:** Exports `trackEvent(eventName, category?, label?, value?, metadata?)` function; also exposed globally as `window.garagebotAnalytics.trackEvent`

#### Server-Side Storage
- Sessions, page views, and events are stored in PostgreSQL via Drizzle ORM
- All data is tied to `visitorId` and `sessionId` for correlation
- Session includes: userAgent, referrer, landingPage, UTM params, device info, browser, country, startedAt, endedAt

#### Analytics Dashboard Component: `client/src/components/AnalyticsDashboard.tsx` (622 lines)
Rendered inside the Dev Portal (`/dev`). Features:
- **KPI Cards (6):** Active Now (real-time, 10s refresh), Page Views, Unique Visitors, Sessions, Avg Duration, Bounce Rate
- **Chart Carousel (3 views):**
  1. Traffic Overview — Line chart (Page Views + Visitors over time) using Recharts
  2. Top Pages — Bar chart of most visited routes
  3. Device Breakdown — Pie chart of Desktop/Mobile/Tablet split
- **Additional Data:** Top referrers, browser breakdown, geographic distribution
- **Date Range Filter:** 7 / 30 / 90 day selectors
- **SEO Manager:** Full CRUD for per-route SEO meta tags (integrated into this dashboard, see Section 6)

### Data Flow
```
User visits page → useAnalytics hook fires →
  1. POST /api/analytics/session (creates session with device, browser, geo, UTM)
  2. POST /api/analytics/pageview (on each route change)
  3. POST /api/analytics/event (on custom events like search, click, purchase)
  4. POST /api/analytics/session/:id/end (on tab close via sendBeacon)
```

### API Endpoints (Analytics)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/analytics/session` | No | Create new session |
| POST | `/api/analytics/pageview` | No | Track page view |
| POST | `/api/analytics/event` | No | Track custom event |
| POST | `/api/analytics/session/:id/end` | No | End session (beacon) |
| GET | `/api/analytics/summary?days=N` | No | KPI summary |
| GET | `/api/analytics/realtime` | No | Active visitors count |
| GET | `/api/analytics/traffic?days=N` | No | Daily traffic data |
| GET | `/api/analytics/pages` | No | Top pages by views |
| GET | `/api/analytics/referrers` | No | Top referral sources |
| GET | `/api/analytics/devices` | No | Device breakdown |
| GET | `/api/analytics/browsers` | No | Browser breakdown |
| GET | `/api/analytics/geo` | No | Geographic breakdown |
| GET | `/api/analytics/events` | No | Event log |

---

## 3. MARKETING HUB

### Overview
The Marketing Hub (`/marketing-hub` or `/marketing`) is a comprehensive social media management dashboard for auto-posting to Facebook (and optionally Instagram and X/Twitter). It manages 103+ categorized marketing posts, AI-generated images, content bundles, post scheduling, and performance analytics.

### Route
`/marketing-hub` (also `/marketing`) — both registered in `App.tsx`

### Files
- **Frontend:** `client/src/pages/MarketingHub.tsx` (1,928 lines)
- **Scheduler:** `server/marketing-scheduler.ts` (526 lines)
- **Social Connectors:** `server/social-connectors.ts` (211 lines)
- **Content Seeds:** `server/seeds/marketingContent.ts`
- **Meta Ads:** `server/meta-ads-service.ts` (532 lines)

### Auto-Posting System

#### Schedule
Posts are automatically published every 3 hours CST:
- **Hours:** 12am, 3am, 6am, 9am, 12pm, 3pm, 6pm, 9pm CST
- **Logic:** `marketing-scheduler.ts` checks the current CST hour against `POSTING_HOURS_CST` array
- **Rotation:** Posts are selected by lowest `usageCount` then oldest `lastUsedAt` to ensure even rotation
- **Seasonal Matching:** Posts and images are filtered by current season (spring/summer/fall/winter) when applicable

#### Post Selection Flow
1. Get current season via CST timezone
2. Query `marketingPosts` table for active posts matching platform + season, ordered by least-used
3. Get matching image from `marketingImages` table using category-to-filename mapping (`POST_CATEGORY_TO_IMAGE_FILENAMES`)
4. Build message with content + ecosystem URL + hashtags
5. Post to Facebook (photo post with image, or text-only), Instagram (if connected + image available), and X/Twitter
6. Record result in `scheduledPosts` table
7. Increment `usageCount` on both the post and image

#### Post Categories
Posts cover 20+ categories: `cars`, `trucks`, `diy`, `gamified`, `marine`, `atv`, `rv`, `small-engines`, `generator`, `tractor`, `heavy-equipment`, `motorcycle`, `drones`, `rc-cars`, `model-aircraft`, `slot-cars`, `aviation`, `exotic`, `classic`, `diesel`, `kit-car`, `go-kart`, `golf-cart`, `snowmobile`, `jet-ski`, `brand`, `ai`, `blockchain`, `darkwave`, `mechanics`

#### Image Matching
Each post category maps to specific image filenames in `POST_CATEGORY_TO_IMAGE_FILENAMES`. For example:
- `cars` → `cars_and_trucks.png`, `engine_block.png`, `brake_parts.png`, etc.
- `brand` → `hatch_garagebot_right_part_v2.png`, `garagebot_facebook_cover_16x9.png`, etc.
- `marine` → `boat_marine.png`, `marine_parts.png`

### Marketing Hub Frontend Features

#### Tabs
1. **Content Library** — Browse, search, filter, edit, and create marketing posts with categories, tones, CTAs, hashtags, and target sites
2. **Image Gallery** — View and manage marketing images with categories (garagebot, parts, vehicles, diy, shop, comparison, retailers, etc.)
3. **Content Bundles** — Pair images + messages into ready-to-post bundles with targeting, scheduling, and performance tracking
4. **Post History** — View posted/failed/scheduled posts with engagement metrics
5. **Calendar View** — Weekly calendar showing scheduled posts by day
6. **Analytics** — Top-performing content, images, and bundles; time-slot performance analysis
7. **Meta Ads** — Create and manage Facebook/Instagram ad campaigns (see Section 4)

#### Key Interfaces
```typescript
MarketingPost { id, content, platform, hashtags[], targetSite, category, tone, cta, isActive, usageCount, lastUsedAt, createdAt }
MarketingImage { id, filename, filePath, category, subject, style, season, quality, altText, isActive, usageCount }
ContentBundle { id, imageId, messageId, imageUrl, message, platform, status, postType, targetAudience, budgetRange, ctaButton, scheduledDate, postedAt, impressions, reach, clicks, likes, comments, shares, saves, leads, conversions, spend, revenue }
PostHistory { id, platform, content, status, externalPostId, error, postedAt, impressions, reach, clicks, likes, comments, shares, createdAt }
```

### Facebook Insights Integration
The scheduler periodically fetches engagement metrics for posted content from the Meta Graph API:
- **Post Insights:** `post_impressions`, `post_reach`, `post_clicks`
- **Engagement:** likes, comments, shares via Graph API fields
- Updates stored in `scheduledPosts` table

---

## 4. META ADS CAMPAIGNS

### File
`server/meta-ads-service.ts` (532 lines)

### Overview
Manages paid Facebook/Instagram ad campaigns via the Meta Marketing API (v21.0). Supports campaign creation, activation, pausing, deletion, and insight refreshing.

### Configuration
```
META_AD_ACCOUNT_ID = "751302398036834"
META_PAGE_ID = "900725646468208"
META_INSTAGRAM_ACCOUNT_ID = "17841480455608384"
META_PAGE_ACCESS_TOKEN = (stored in secrets)
```

### Required Permission
The Meta token must have the `ads_management` permission. The system checks this on startup and logs detailed instructions if missing:
```
[Meta Ads] To fix: In Meta App Dashboard, add "Marketing API" product, then generate a new token with ads_management checked
```

### Default Ad Targeting
Pre-configured interest targeting for the motorized vehicle audience:
- **Age:** 18-65
- **Geo:** United States
- **Interests:** Automobile, Auto mechanic, Automotive industry, Car tuning, Motorcycle, Boating, Recreational vehicle, ATV, RC cars, Drones, DIY, Classic cars, Trucks, Off-roading, Auto parts, Small engine repair, Fishing boats, Go-karts, Slot cars, Model aircraft, Snowmobiles, Personal watercraft, Golf carts

### Campaign Creation Flow
1. Upload ad creative image to Meta
2. Create campaign with objective (TRAFFIC, ENGAGEMENT, CONVERSIONS, etc.)
3. Create ad set with targeting, budget, and schedule
4. Create ad linking creative + ad set
5. Store campaign details in `adCampaigns` table

### API Endpoints (Ads)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/marketing/ads/create-campaign` | Yes | Create new campaign |
| GET | `/api/marketing/ads/campaigns` | Yes | List all campaigns |
| POST | `/api/marketing/ads/campaigns/:id/activate` | Yes | Activate campaign |
| POST | `/api/marketing/ads/campaigns/:id/pause` | Yes | Pause campaign |
| POST | `/api/marketing/ads/campaigns/:id/delete` | Yes | Delete campaign |
| POST | `/api/marketing/ads/refresh-insights` | Yes | Refresh performance data |
| GET | `/api/marketing/ads/targeting` | Yes | Get targeting config |
| PUT | `/api/marketing/ads/targeting` | Yes | Update targeting config |
| POST | `/api/marketing/ads/init-campaigns` | Yes | Initialize default campaigns |

---

## 5. SOCIAL MEDIA CONNECTORS

### File
`server/social-connectors.ts` (211 lines)

### Facebook Connector
- **Function:** `postToFacebook(pageId, accessToken, message, imageUrl?)`
- **Behavior:** If `imageUrl` provided, posts as photo to `/{pageId}/photos`; otherwise text post to `/{pageId}/feed`
- **API Version:** v21.0

### Instagram Connector
- **Function:** `postToInstagram(igAccountId, accessToken, caption, imageUrl)`
- **Behavior:** Two-step: (1) Create media container via `/{igAccountId}/media`, (2) Publish via `/{igAccountId}/media_publish`
- **Requirement:** Requires a publicly accessible image URL

### X/Twitter Connector
- **Class:** `TwitterConnector`
- **Auth:** OAuth 1.0a with HMAC-SHA1 signature generation
- **Secrets Required:**
  - `TWITTER_API_KEY`
  - `TWITTER_API_SECRET`
  - `TWITTER_ACCESS_TOKEN`
  - `TWITTER_ACCESS_TOKEN_SECRET`
- **Character Limit:** Truncates to 280 chars with `...` suffix

---

## 6. SEO MANAGEMENT SYSTEM

### Overview
Per-route SEO configuration managed through the Analytics Dashboard. Supports setting title, description, keywords, Open Graph tags, Twitter Card tags, canonical URL, and robots directives per page.

### Global SEO Tags (index.html)
Located in `client/index.html`:
- **Title:** "GarageBot | Right Part. First Time. Every Engine."
- **Description:** Full description mentioning 15M+ parts, retailers, AI assistant, all vehicle types
- **Keywords:** 20+ automotive keywords
- **Open Graph:** Type, URL, title, description, image (garagebot_facebook_cover_16x9.png), site_name, locale, article:publisher, fb:profile_id
- **Twitter Card:** summary_large_image, site (@TrustSignal26), creator (@TrustSignal26), matching title/description/image
- **Structured Data (JSON-LD):** WebApplication schema with name, URL, description, applicationCategory, offers
- **Canonical:** https://garagebot.io/
- **Facebook Verification:** Meta tag with domain verification code
- **Google AdSense:** Meta tag with publisher ID `ca-pub-7386731030203849`

### Per-Route SEO (Database-driven)
The `AnalyticsDashboard.tsx` component provides full CRUD for per-route SEO settings stored in the `seo_pages` table:

```typescript
SeoPage {
  id, route, title, description, keywords,
  ogTitle, ogDescription, ogImage,
  twitterTitle, twitterDescription, twitterImage,
  canonicalUrl, robots, isActive
}
```

### API Endpoints (SEO)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/seo/pages` | No | List all SEO page configs |
| GET | `/api/seo/pages/:id` | No | Get specific SEO config |
| GET | `/api/seo/route?route=/path` | No | Get SEO config for route |
| POST | `/api/seo/pages` | No | Create new SEO config |
| PUT | `/api/seo/pages/:id` | No | Update SEO config |
| DELETE | `/api/seo/pages/:id` | No | Delete SEO config |

---

## 7. UI DESIGN SYSTEM & PREMIUM STYLING

### Design Theme: "Deep Space / Future Forward"
- **Primary Color:** Electric Cyan `#00D9FF` (CSS variable: `--color-primary`)
- **Secondary Color:** Purple `#A855F7`
- **Background:** Deep dark navy/charcoal gradients
- **Surface:** Glassmorphism panels (`backdrop-blur-xl`, `bg-white/[0.03]`, `border border-white/10`)
- **Text:** White with opacity variants (`text-white/80`, `text-white/50`, `text-white/30`)

### Fonts
- **Headers:** Rajdhani (`.font-tech`) — weights 500, 600, 700
- **Body:** Inter — weights 400, 500, 600
- **Data/Code:** JetBrains Mono (`.font-mono`) — weights 400, 500

### Key CSS Classes (from `client/src/index.css`)
- `bento-glass` — Glassmorphism panel with blur and border
- `bento-glow` — Animated glow border effect
- `bento-depth-1/2/3` — Three depth levels for layered glass panels
- `btn-cyber` — Neon-glow CTA button with hover effects
- `neon-text` — Text with cyan drop-shadow glow
- `glass-dark` — Dark glass panel variant
- `sparkle-container` / `.sparkle` — Animated sparkle dot decorations
- `shine-overlay` — Animated diagonal light sweep effect

### Glow Map (Command Center)
17 predefined glow colors used for card hover effects:
```typescript
const GLOW_MAP = {
  "shadow-cyan-500/30": "0 0 25px rgba(6,182,212,0.3)",
  "shadow-green-500/30": "0 0 25px rgba(34,197,94,0.3)",
  "shadow-purple-500/30": "0 0 25px rgba(168,85,247,0.3)",
  // ... 14 more colors
};
```

### Animation Patterns (Framer Motion)
- **Staggered Entry:** `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ delay: index * 0.05 }}`
- **Hover Scale:** `whileHover={{ scale: 1.03 }}` on cards
- **Card Press:** `whileTap={{ scale: 0.97 }}` on interactive elements
- **Loading States:** `SkeletonCard` and `SkeletonSection` with `animate-pulse`

### Carousel Implementations
1. **Command Center:** shadcn/ui `Carousel` (Embla under the hood) with `dragFree: true`, spacious 320-340px photorealistic image cards with 24px gaps, left/right nav arrows hidden on mobile
2. **FeaturedCarousel:** Embla Carousel React for deals with auto-scroll
3. **VehicleShowcase:** Custom auto-scrolling with `requestAnimationFrame`, doubled vehicle array for infinite loop effect
4. **CategoryGrid:** Native scroll with manual left/right buttons and pagination dots
5. **BentoGrid:** CSS Grid layout with `BentoCell` components supporting glass, glow, sparkle, and depth props

### Mobile Responsiveness
- **Breakpoints:** Mobile-first, `sm:`, `md:`, `lg:`, `xl:`, `2xl:` via Tailwind
- **Home Page:** Separate desktop Bento layout (`hidden lg:block`) and mobile layout (`lg:hidden`)
- **Command Center:** Carousel cards use `basis-[320px]` (mobile) and `basis-[340px]` (sm+) with `pl-6` spacing for spacious scrolling
- **Navigation:** Collapsible mobile nav with hamburger menu

---

## 8. DATABASE SCHEMA (Key Tables)

### Analytics Tables
```sql
analytics_sessions (id, visitorId, userAgent, referrer, landingPage, device, browser, os, country, city, utmSource, utmMedium, utmCampaign, startedAt, endedAt)
analytics_page_views (id, sessionId, visitorId, route, title, referrer, timeSpent, viewedAt)
analytics_events (id, sessionId, visitorId, eventName, eventCategory, eventLabel, eventValue, route, metadata, createdAt)
```

### SEO Tables
```sql
seo_pages (id, route, title, description, keywords, ogTitle, ogDescription, ogImage, twitterTitle, twitterDescription, twitterImage, canonicalUrl, robots, isActive, createdAt, updatedAt)
```

### Marketing Tables
```sql
marketing_posts (id, tenantId, content, platform, hashtags[], targetSite, category, tone, cta, season, isActive, usageCount, lastUsedAt, createdAt)
marketing_images (id, tenantId, filename, filePath, category, subject, style, season, quality, altText, isActive, usageCount, lastUsedAt, createdAt)
social_integrations (id, tenantId, facebookPageId, facebookPageAccessToken, facebookConnected, facebookPageName, instagramAccountId, instagramConnected, instagramUsername, twitterConnected, updatedAt)
scheduled_posts (id, tenantId, platform, content, status, externalPostId, error, marketingPostId, postedAt, impressions, reach, clicks, likes, comments, shares, createdAt)
content_bundles (id, tenantId, imageId, messageId, imageUrl, message, platform, status, postType, targetAudience, budgetRange, ctaButton, scheduledDate, postedAt, impressions, reach, clicks, likes, comments, shares, saves, leads, conversions, spend, revenue, createdAt)
ad_campaigns (id, tenantId, name, objective, status, dailyBudget, totalBudget, targeting, creativeImageUrl, creativeText, headline, ctaType, metaCampaignId, metaAdSetId, metaAdId, impressions, reach, clicks, spend, conversions, startDate, endDate, createdAt, updatedAt)
```

---

## 9. ENVIRONMENT VARIABLES & SECRETS

### Required for Marketing Auto-Posting
| Variable | Description |
|----------|-------------|
| `META_PAGE_ACCESS_TOKEN` | Facebook User Access Token (stored as secret) |
| `META_PAGE_ID` | Facebook Page ID — `900725646468208` |
| `META_INSTAGRAM_ACCOUNT_ID` | Instagram Business Account ID — `17841480455608384` |
| `META_INSTAGRAM_USERNAME` | Instagram username — `garagebot.io` |

### Required for X/Twitter Posting
| Variable | Description |
|----------|-------------|
| `TWITTER_API_KEY` | Twitter/X API key (OAuth 1.0a consumer key) |
| `TWITTER_API_SECRET` | Twitter/X API secret |
| `TWITTER_ACCESS_TOKEN` | Twitter/X user access token |
| `TWITTER_ACCESS_TOKEN_SECRET` | Twitter/X user access token secret |

### Required for Meta Ads
| Variable | Description |
|----------|-------------|
| `META_AD_ACCOUNT_ID` | Meta Ads Account ID — `751302398036834` |
| `META_PAGE_ACCESS_TOKEN` | Same token, but must have `ads_management` permission |

### Token Permissions Needed (Meta)
Current: `publish_video`, `pages_show_list`, `business_management`, `pages_read_engagement`, `pages_read_user_content`, `pages_manage_posts`, `public_profile`, `read_insights`, `catalog_management`, `pages_manage_engagement`, `pages_manage_metadata`

**Missing for Ads:** `ads_management` — Add "Marketing API" product in Meta App Dashboard, then regenerate token with this permission

---

## 10. API ENDPOINTS REFERENCE

### Marketing Content
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/marketing/status` | Yes | Current scheduler status |
| GET | `/api/marketing/posts` | Yes | List all marketing posts |
| POST | `/api/marketing/posts` | Yes | Create new post |
| PUT | `/api/marketing/posts/:id` | Yes | Update post |
| DELETE | `/api/marketing/posts/:id` | Yes | Delete post |
| GET | `/api/marketing/images` | Yes | List marketing images |
| GET | `/api/marketing/history` | Yes | Post history with metrics |
| GET | `/api/marketing/integrations` | Yes | Social platform connections |
| POST | `/api/marketing/post-now` | Yes | Immediately post to platforms |
| POST | `/api/marketing/seed` | Yes | Re-seed content library |
| GET | `/api/marketing/bundles` | No | List content bundles |
| POST | `/api/marketing/bundles` | Yes | Create content bundle |
| POST | `/api/marketing/generate` | Yes | AI-generate new post content |

### Marketing Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/marketing/analytics/top-content` | Yes | Top performing posts |
| GET | `/api/marketing/analytics/top-images` | Yes | Top performing images |
| GET | `/api/marketing/analytics/top-bundles` | Yes | Top performing bundles |
| GET | `/api/marketing/analytics/time-slots` | Yes | Best posting times |

---

## 11. FILE MAP

```
client/
├── index.html                              # Global SEO meta tags, structured data, AdSense
├── src/
│   ├── App.tsx                             # Route registration, analytics hook
│   ├── index.css                           # Custom CSS: glassmorphism, glow, neon, sparkle
│   ├── hooks/
│   │   └── useAnalytics.ts                 # Client-side analytics tracking (186 lines)
│   ├── components/
│   │   ├── AnalyticsDashboard.tsx           # Analytics + SEO dashboard (622 lines)
│   │   ├── BentoGrid.tsx                   # Reusable glass grid system (220 lines)
│   │   ├── FeaturedCarousel.tsx             # Deals carousel with Embla (256 lines)
│   │   ├── VehicleShowcase.tsx              # Auto-scrolling vehicle strip (142 lines)
│   │   ├── CategoryGrid.tsx                # Parts category carousel (159 lines)
│   │   └── Footer.tsx                      # Social links (Facebook, X, Instagram, YouTube, TikTok)
│   ├── pages/
│   │   ├── CommandCenter.tsx               # Admin command center (557 lines)
│   │   └── MarketingHub.tsx                # Marketing management (1,928 lines)
│   └── assets/images/cc/                   # 46 unique photorealistic card images (PNGs, one per card)
│
server/
├── routes.ts                               # All API routes (analytics, marketing, SEO, ads)
├── marketing-scheduler.ts                  # Auto-posting scheduler (526 lines)
├── social-connectors.ts                    # Facebook, Instagram, Twitter connectors (211 lines)
├── meta-ads-service.ts                     # Meta Marketing API integration (532 lines)
├── seeds/
│   └── marketingContent.ts                 # 103+ seed posts and images
│
shared/
└── schema.ts                               # Drizzle ORM schema (all tables)
```

---

## 12. SETUP & CONFIGURATION GUIDE

### Step 1: Database
Ensure PostgreSQL is running with all tables migrated. The analytics, marketing, and SEO tables must exist. Run `npm run db:push` or the Drizzle migration command to sync schema.

### Step 2: Seed Marketing Content
On first startup, the server auto-seeds 103+ marketing posts and images if the `marketingPosts` table is empty. Check logs for:
```
[Marketing Seed] Already has 103 categorized posts, skipping seed.
```
To force re-seed, call `POST /api/marketing/seed` (requires auth).

### Step 3: Configure Meta (Facebook/Instagram)
1. Create a Meta App at https://developers.facebook.com
2. Add "Pages" and "Instagram Graph API" products
3. Generate a Page Access Token with permissions: `pages_manage_posts`, `pages_read_engagement`, `read_insights`, `publish_video`
4. Set environment variables: `META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `META_INSTAGRAM_ACCOUNT_ID`
5. Verify in logs: `[Marketing] Obtained Page Access Token for "GarageBot.io"`

### Step 4: Configure X/Twitter (Optional)
1. Create a Twitter Developer App at https://developer.twitter.com
2. Generate OAuth 1.0a credentials (consumer key/secret + access token/secret)
3. Set environment variables: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`

### Step 5: Configure Meta Ads (Optional)
1. In Meta App Dashboard, add "Marketing API" product
2. Regenerate token with `ads_management` permission
3. Set `META_AD_ACCOUNT_ID` environment variable
4. Verify in logs: ads_management permission should no longer show as missing

### Step 6: Verify Auto-Posting
Check server logs for:
```
[Marketing] Starting scheduler...
[Marketing] Posts scheduled every 3 hours CST: 12am, 3am, 6am, 9am, 12pm, 3pm, 6pm, 9pm
```
Posts will automatically fire at the next scheduled hour.

### Step 7: Command Center Access
1. Create an admin user (or ensure existing user has `role: "admin"` in the `users` table)
2. Navigate to `/command-center`
3. Login with admin username and PIN
4. Browse all 8 categories and 46 feature cards

### Step 8: Adding New Command Center Cards
Each card requires a unique photorealistic image. To add new cards:
1. Generate or source a high-quality PNG image for the feature
2. Save it to `client/src/assets/images/cc/your-feature.png`
3. Import it at the top of `CommandCenter.tsx` and add a `LaunchCard` to the appropriate category's `cards` array
4. Every card must have its own unique image — no reusing images across cards

---

## NOTES FOR IMPLEMENTING AGENT

- **Do NOT redirect users to external login.** GarageBot uses its own auth system (WelcomeGate PIN-based), not redirect SSO.
- **Always confirm changes with Jason before implementing.** He reviews plans before work begins.
- **Never use question box UI.** Ask questions directly in chat as plain text.
- **Maintain the Deep Space theme** — all new UI should use glassmorphism, cyan accents, Framer Motion animations.
- **Test IDs required** — Add `data-testid` attributes to all interactive and meaningful display elements.
- **Password policy** — 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.
