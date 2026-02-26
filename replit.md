# Trust Golf - Premium Golf Companion App

## Overview
Trust Golf is a premium mobile-first golf platform built with React Native + Expo. It offers a cinematic landing page, AI-powered swing analysis, score tracking, course discovery, media integration via TrustVault, and exclusive deals. The platform aims to provide a comprehensive golf companion experience, allowing users to browse content without login and gating advanced features behind authentication. It is developed by DarkWave Studios LLC.

## User Preferences
No explicit user preferences were provided in the original document.

## System Architecture
Trust Golf is built on a modern full-stack architecture:
-   **Frontend**: React Native + Expo (SDK 54) utilizing file-based routing via Expo Router for a mobile-first experience.
-   **Backend**: An Express.js server handles API requests and business logic.
-   **Database**: PostgreSQL is used for data persistence, managed with Drizzle ORM.
-   **AI Integration**: OpenAI's vision model, accessed via Replit AI Integrations, powers the AI swing analysis feature.
-   **Object Storage**: Replit Object Storage is used for storing application assets.
-   **Media Platform**: TrustVault is integrated for advanced media storage, editing, and video processing, secured via HMAC authentication.
-   **UI/UX Design**: The app features a golf-green primary color scheme with a gold accent, a 3-column Bento grid layout, glass morphism cards, orb effects, and skeleton loaders. It uses the Inter font and supports light/dark mode toggling.
-   **Authentication**: The app allows free content browsing, with a login modal appearing only for gated features like AI Swing Analyzer and round tracking. A developer dashboard is accessible via a master PIN, and a whitelist system provides VIP access.
-   **Key Features**:
    *   **Cinematic Explorer Page**: A dynamic landing page with an image slideshow hero, category carousels, hot deals, and quick actions.
    *   **Course Catalog**: Comprehensive database of 45 golf courses, filterable by state, with detailed descriptions, amenities, and unique imagery.
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