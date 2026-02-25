import React from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform, Linking,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { OrbEffect } from "@/components/OrbEffect";
import { AccordionItem } from "@/components/AccordionItem";
import { PremiumText } from "@/components/PremiumText";

const ROADMAP_PHASES = [
  {
    phase: "Phase 1 — Foundation",
    status: "complete" as const,
    items: [
      "45-course catalog (World-Class, Upstate SC, Middle TN/Nashville)",
      "AI Swing Analyzer (photo + video with slow-mo frame capture)",
      "Score tracking with round history",
      "Exclusive deals and promotions engine",
      "Cinematic video hero slideshow (3 AI-generated golf videos)",
      "Dark/light theme with system detection",
      "TrustVault media integration (upload, edit, webhook callbacks)",
      "Developer dashboard with course & deal management",
      "Vendor/partner signup system with Resend email confirmation",
      "Self-hosted analytics (sessions, page views, events, KPI dashboard)",
      "PWA install banner for web",
    ],
  },
  {
    phase: "Phase 2 — Handicap & Intelligence",
    status: "active" as const,
    items: [
      "USGA Handicap Index calculation (live, updates per round)",
      "Club-specific swing analysis (Driver, Woods, Irons, Wedges, Putter)",
      "YouTube instructional video library (curated how-to content)",
      "Course Handicap per-course adjustments",
      "Handicap trend tracking and visualization",
      "Smart course recommendations based on skill level",
      "Golf affiliate program integrations",
    ],
  },
  {
    phase: "Phase 3 — GPS Course Navigator & Distance Finder",
    status: "planned" as const,
    items: [
      "GPS distance-to-tap: satellite map view, tap any point for distance from your location",
      "Visual hole layouts: draw tee boxes, fairways, greens, bunkers, water hazards",
      "Pin placement with front/middle/back green distances",
      "Shot tracking: log shot locations on map, auto-calculate carry and total distances",
      "Crowdsourced course mapping: users contribute hole data, reviewed in developer dashboard",
      "Offline map caching for on-course use without cell service",
      "Interactive golf simulation game with physics-based swing mechanics",
    ],
  },
  {
    phase: "Phase 4 — Marketing & Social",
    status: "planned" as const,
    items: [
      "Marketing Hub: auto-posting to Facebook/Instagram on 3-hour schedule",
      "Meta Ads campaign management from within Trust Golf",
      "SEO management system with per-route meta tags",
      "Player profiles and social feeds",
      "Group creation and team tournaments",
      "Course reviews and photo sharing",
      "Live scoring for group rounds",
      "Push notifications for deals, events, and game invites",
    ],
  },
  {
    phase: "Phase 5 — Marketplace & Premium",
    status: "planned" as const,
    items: [
      "Admin Command Center with categorized card grid dashboard",
      "Pro subscription tier with advanced analytics",
      "Tee time booking engine (GolfNow/TeeOff API integration)",
      "Equipment marketplace integration",
      "Lesson booking with local pros",
      "Trust Golf Rewards loyalty program",
      "Brand sponsorship and advertising platform",
      "Course partnership pitch tools and onboarding",
    ],
  },
];

const BUSINESS_SECTIONS = [
  {
    title: "Revenue Model",
    icon: "cash-outline" as const,
    content: "Trust Golf operates on a freemium model. Core features — course discovery, score tracking, and deals — remain free forever. Revenue is generated through premium AI analysis subscriptions, in-app game purchases, tee time booking commissions, marketplace transaction fees, and enterprise partnerships with courses and brands.",
  },
  {
    title: "Market Opportunity",
    icon: "trending-up-outline" as const,
    content: "The global golf market is projected to exceed $100B by 2028. With 25M+ active golfers in the US alone, the intersection of golf, AI, and gaming represents a massive greenfield opportunity. Trust Golf targets the modern golfer who expects mobile-first, data-driven experiences — a segment growing 15% YoY among 18-45 year olds.",
  },
  {
    title: "Competitive Advantage",
    icon: "shield-checkmark-outline" as const,
    content: "Trust Golf is the only platform combining AI swing analysis, a golf simulation game, media creation tools (via TrustVault), and real course deals in a single premium app. Built on the DarkWave Trust Layer ecosystem, users benefit from unified identity, secure media vaults, and cross-platform capabilities no competitor offers.",
  },
  {
    title: "Technology Stack",
    icon: "code-slash-outline" as const,
    content: "React Native + Expo for true cross-platform deployment (iOS, Android, Web). Express + PostgreSQL backend with Drizzle ORM. OpenAI GPT-4 Vision for swing analysis. TrustVault for professional media editing. Trust Layer SSO for ecosystem-wide authentication. Designed for scale from day one.",
  },
];

export default function AboutScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const getStatusColor = (status: string) => {
    if (status === "complete") return colors.success;
    if (status === "active") return colors.primary;
    return colors.textMuted;
  };

  const getStatusLabel = (status: string) => {
    if (status === "complete") return "COMPLETE";
    if (status === "active") return "IN PROGRESS";
    return "PLANNED";
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, paddingRight: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceElevated, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </View>
          <PremiumText variant="caption" color={colors.textSecondary} style={{ fontWeight: "600" }}>Back</PremiumText>
        </Pressable>
        <PremiumText variant="subtitle">About Trust Golf</PremiumText>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + webBottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.missionCard}>
          <OrbEffect color={colors.primary + "20"} size={180} />
          <View style={styles.missionContent}>
            <View style={[styles.missionIcon, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="golf" size={32} color={colors.primary} />
            </View>
            <PremiumText variant="hero" style={{ textAlign: "center", fontSize: 22 }}>
              Trust Golf
            </PremiumText>
            <PremiumText variant="caption" color={colors.accent} style={{ textAlign: "center", letterSpacing: 2 }}>
              BY DARKWAVE STUDIOS
            </PremiumText>
          </View>
        </GlassCard>

        <GlassCard style={{ marginTop: 16 }}>
          <PremiumText variant="label" color={colors.textMuted} style={{ marginBottom: 8 }}>MISSION STATEMENT</PremiumText>
          <PremiumText variant="body" color={colors.textSecondary} style={{ lineHeight: 24 }}>
            Trust Golf exists to elevate every golfer's experience — from the first tee to the final putt. We combine cutting-edge AI technology, immersive gaming, and a curated network of premier courses to create the most complete golf companion ever built. Whether you're tracking your handicap, analyzing your swing frame-by-frame, or competing in virtual rounds on legendary courses, Trust Golf puts the power of a pro caddie, a personal coach, and a world-class clubhouse in your pocket.
          </PremiumText>
        </GlassCard>

        <GlassCard style={{ marginTop: 16 }}>
          <PremiumText variant="label" color={colors.textMuted} style={{ marginBottom: 8 }}>EXECUTIVE SUMMARY</PremiumText>
          <PremiumText variant="body" color={colors.textSecondary} style={{ lineHeight: 24 }}>
            Trust Golf is a premium mobile-first golf platform developed by DarkWave Studios LLC, targeting the $100B+ global golf market. The platform serves as a unified hub for course discovery, AI-powered swing analysis, real-time handicap tracking, exclusive tee time deals, and an upcoming interactive golf simulation game.
          </PremiumText>
          <PremiumText variant="body" color={colors.textSecondary} style={{ lineHeight: 24, marginTop: 12 }}>
            Launching with a catalog of 45 curated courses across world-class destinations and the Nashville/Middle Tennessee region, Trust Golf is designed for the modern golfer who demands data-driven insights and premium digital experiences. Our integration with TrustVault provides professional-grade media tools, while Trust Layer SSO enables seamless cross-ecosystem authentication.
          </PremiumText>
          <PremiumText variant="body" color={colors.textSecondary} style={{ lineHeight: 24, marginTop: 12 }}>
            The platform operates on a freemium model with monetization through premium subscriptions, in-game purchases, booking commissions, and enterprise partnerships. Trust Golf is positioned to become the definitive digital companion for golfers worldwide.
          </PremiumText>
        </GlassCard>

        <View style={{ marginTop: 24 }}>
          <PremiumText variant="subtitle" style={{ marginBottom: 14, paddingHorizontal: 4 }}>Business Plan</PremiumText>
          <GlassCard>
            {BUSINESS_SECTIONS.map((section, i) => (
              <AccordionItem key={section.title} title={section.title} icon={section.icon} defaultOpen={i === 0}>
                <PremiumText variant="body" color={colors.textSecondary} style={{ lineHeight: 22 }}>
                  {section.content}
                </PremiumText>
              </AccordionItem>
            ))}
          </GlassCard>
        </View>

        <View style={{ marginTop: 24 }}>
          <PremiumText variant="subtitle" style={{ marginBottom: 14, paddingHorizontal: 4 }}>Product Roadmap</PremiumText>
          {ROADMAP_PHASES.map((phase) => (
            <GlassCard key={phase.phase} style={{ marginBottom: 12 }}>
              <View style={styles.phaseHeader}>
                <View style={{ flex: 1 }}>
                  <PremiumText variant="subtitle" style={{ fontSize: 15 }}>{phase.phase}</PremiumText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(phase.status) + "20" }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(phase.status) }]} />
                  <PremiumText variant="caption" style={{ color: getStatusColor(phase.status), fontSize: 10 }}>
                    {getStatusLabel(phase.status)}
                  </PremiumText>
                </View>
              </View>
              <View style={styles.phaseItems}>
                {phase.items.map((item, idx) => (
                  <View key={idx} style={styles.phaseItem}>
                    <Ionicons
                      name={phase.status === "complete" ? "checkmark-circle" : phase.status === "active" ? "ellipse-outline" : "time-outline"}
                      size={16}
                      color={getStatusColor(phase.status)}
                    />
                    <PremiumText variant="caption" color={colors.textSecondary} style={{ flex: 1, lineHeight: 20 }}>
                      {item}
                    </PremiumText>
                  </View>
                ))}
              </View>
            </GlassCard>
          ))}
        </View>

        <GlassCard style={{ marginTop: 12 }}>
          <PremiumText variant="label" color={colors.textMuted} style={{ marginBottom: 12 }}>COMPANY</PremiumText>
          <View style={styles.companyRow}>
            <PremiumText variant="body" color={colors.textSecondary}>DarkWave Studios LLC</PremiumText>
            <PremiumText variant="caption" color={colors.textMuted}>{"\u00A9"} 2026</PremiumText>
          </View>
          <View style={{ gap: 8, marginTop: 12 }}>
            <Pressable onPress={() => Linking.openURL("https://darkwavestudios.io")} style={styles.linkRow}>
              <Ionicons name="globe-outline" size={16} color={colors.primary} />
              <PremiumText variant="body" color={colors.primary}>darkwavestudios.io</PremiumText>
            </Pressable>
            <Pressable onPress={() => Linking.openURL("https://dwtl.io")} style={styles.linkRow}>
              <Ionicons name="shield-outline" size={16} color={colors.primary} />
              <PremiumText variant="body" color={colors.primary}>Trust Layer — dwtl.io</PremiumText>
            </Pressable>
            <Pressable onPress={() => Linking.openURL("https://trustshield.tech")} style={styles.linkRow}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
              <PremiumText variant="body" color={colors.primary}>TrustShield — trustshield.tech</PremiumText>
            </Pressable>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  scrollContent: { paddingHorizontal: 16 },
  missionCard: { height: 180, justifyContent: "center" },
  missionContent: { alignItems: "center", gap: 6, padding: 20 },
  missionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  phaseItems: { gap: 8 },
  phaseItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  companyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
