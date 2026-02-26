import React, { useEffect, useRef } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform, Linking,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { OrbEffect } from "@/components/OrbEffect";
import { PremiumText } from "@/components/PremiumText";
import { LinearGradient } from "expo-linear-gradient";

const FEATURES = [
  {
    icon: "finger-print-outline" as const,
    title: "Single Sign-On",
    description: "One set of credentials across all DarkWave apps. No redirects — each app has its own login, synced behind the scenes.",
    color: "#22d3ee",
    bg: "rgba(6,182,212,0.1)",
    border: "rgba(6,182,212,0.2)",
  },
  {
    icon: "flash-outline" as const,
    title: "Blockchain Verified",
    description: "Identity and credentials anchored on Solana. Tamper-proof verification for users, organizations, and digital assets.",
    color: "#a78bfa",
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.2)",
  },
  {
    icon: "code-slash-outline" as const,
    title: "Open API",
    description: "Ecosystem API lets connected apps share data and alerts securely via JWT-authenticated endpoints.",
    color: "#34d399",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.2)",
  },
];

function EcosystemWidget() {
  const widgetRef = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const container = document.getElementById("dw-ecosystem-widget-container");
    if (!container) return;

    container.innerHTML = '<div id="dw-ecosystem-directory"></div>';

    const existing = document.querySelector(
      'script[src="https://dwsc.io/api/ecosystem/directory.js"]'
    );
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.src = "https://dwsc.io/api/ecosystem/directory.js";
    script.setAttribute("data-theme", "dark");
    script.async = true;
    container.appendChild(script);

    return () => {
      const s = document.querySelector(
        'script[src="https://dwsc.io/api/ecosystem/directory.js"]'
      );
      if (s) s.remove();
    };
  }, []);

  if (Platform.OS !== "web") {
    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <Ionicons name="globe-outline" size={40} color="#22d3ee" />
        <PremiumText variant="body" style={{ textAlign: "center", marginTop: 12, color: "#888" }}>
          Open this page on the web to view the full interactive ecosystem directory.
        </PremiumText>
        <Pressable
          onPress={() => Linking.openURL("https://dwsc.io")}
          style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: "rgba(6,182,212,0.15)", borderWidth: 1, borderColor: "rgba(6,182,212,0.3)" }}
        >
          <PremiumText variant="body" style={{ color: "#22d3ee" }}>Visit dwsc.io</PremiumText>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      ref={widgetRef}
      nativeID="dw-ecosystem-widget-container"
      style={{ minHeight: 200 }}
    />
  );
}

export default function EcosystemScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <OrbEffect />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + webTopInset + 12, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={18} color="#888" />
          <PremiumText variant="body" style={{ color: "#888", fontSize: 14 }}>Back to Trust Golf</PremiumText>
        </Pressable>

        <View style={styles.headerRow}>
          <LinearGradient
            colors={["rgba(6,182,212,0.2)", "rgba(139,92,246,0.2)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBadge}
          >
            <Ionicons name="shield-checkmark" size={28} color="#22d3ee" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <PremiumText variant="title" style={{ fontSize: 24 }}>
              <PremiumText variant="title" style={{ fontSize: 24, color: "#22d3ee" }}>Trust Layer</PremiumText>
              {"  "}Ecosystem
            </PremiumText>
            <PremiumText variant="caption" style={{ color: "#888", marginTop: 2 }}>Powered by DarkWave Studios</PremiumText>
          </View>
        </View>

        <PremiumText variant="body" style={styles.description}>
          Trust Golf is part of the Trust Layer ecosystem — a network of apps built on verified identity, shared credentials, and blockchain-backed trust. Your single login works across every connected platform.
        </PremiumText>

        <GlassCard style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
            <Ionicons name="globe-outline" size={16} color="#22d3ee" />
            <PremiumText variant="label" style={{ color: "#22d3ee", letterSpacing: 1 }}>Connected Apps</PremiumText>
          </View>
          <EcosystemWidget />
        </GlassCard>

        {FEATURES.map((feature) => (
          <GlassCard key={feature.title} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: feature.bg, borderColor: feature.border }]}>
              <Ionicons name={feature.icon} size={18} color={feature.color} />
            </View>
            <PremiumText variant="subtitle" style={{ fontSize: 15, marginBottom: 4 }}>{feature.title}</PremiumText>
            <PremiumText variant="body" style={{ color: "#888", fontSize: 13, lineHeight: 20 }}>{feature.description}</PremiumText>
          </GlassCard>
        ))}

        <View style={styles.footerLinks}>
          <Pressable onPress={() => Linking.openURL("https://dwsc.io")}>
            <PremiumText variant="caption" style={{ color: "rgba(255,255,255,0.3)" }}>dwsc.io</PremiumText>
          </Pressable>
          <PremiumText variant="caption" style={{ color: "rgba(255,255,255,0.15)", marginHorizontal: 8 }}>{"\u2022"}</PremiumText>
          <Pressable onPress={() => Linking.openURL("https://tlid.io")}>
            <PremiumText variant="caption" style={{ color: "rgba(255,255,255,0.3)" }}>tlid.io</PremiumText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    maxWidth: 640,
    alignSelf: "center",
    width: "100%",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 14,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.3)",
  },
  description: {
    color: "#888",
    lineHeight: 22,
    marginBottom: 20,
    fontSize: 14,
  },
  widgetCard: {
    marginBottom: 14,
    borderColor: "rgba(6,182,212,0.15)",
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  featureCard: {
    marginBottom: 10,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 10,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingBottom: 8,
  },
});
