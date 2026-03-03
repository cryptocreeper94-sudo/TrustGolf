import React, { useState } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform, ActivityIndicator,
  Share, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { PremiumText } from "@/components/PremiumText";
import { GlassCard } from "@/components/GlassCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, getApiUrl, getQueryFn } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import { useAuth } from "@/contexts/AuthContext";

const TIER_COLORS: Record<string, string> = {
  base: "#9CA3AF",
  silver: "#94A3B8",
  gold: "#F59E0B",
  platinum: "#8B5CF6",
  diamond: "#06B6D4",
};

export default function AffiliateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["/api/affiliate/dashboard", user?.id],
    queryFn: async () => {
      const url = new URL("/api/affiliate/dashboard", getApiUrl());
      url.searchParams.set("userId", user!.id);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: linkData } = useQuery({
    queryKey: ["/api/affiliate/link", user?.id],
    queryFn: async () => {
      const url = new URL("/api/affiliate/link", getApiUrl());
      url.searchParams.set("userId", user!.id);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load link");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const payoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/affiliate/request-payout", { userId: user?.id });
    },
  });

  const handleCopyLink = async () => {
    if (linkData?.primaryLink) {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(linkData.primaryLink);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!linkData?.primaryLink) return;
    try {
      await Share.share({
        message: `Join me on Trust Golf — part of the Trust Layer ecosystem!\n${linkData.primaryLink}`,
      });
    } catch (e) {}
  };

  const handleRequestPayout = () => {
    const pendingAmount = parseFloat(dashboard?.pendingEarnings || "0");
    if (pendingAmount < 10) {
      Alert.alert("Minimum Not Met", "You need at least 10 SIG in pending earnings to request a payout.");
      return;
    }
    payoutMutation.mutate();
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.centerContent}>
          <Ionicons name="person-circle-outline" size={64} color={colors.textSecondary} />
          <PremiumText variant="subtitle" color={colors.textSecondary} style={styles.loginText}>
            Log in to access the Affiliate Program
          </PremiumText>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const tierColor = TIER_COLORS[dashboard?.tier || "base"] || colors.accent;
  const pendingAmount = parseFloat(dashboard?.pendingEarnings || "0");
  const paidAmount = parseFloat(dashboard?.paidEarnings || "0");
  const nextTier = dashboard?.nextTier;
  const convertedCount = dashboard?.convertedReferrals || 0;
  const progressToNext = nextTier ? (convertedCount / nextTier.requiredReferrals) * 100 : 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + webTopInset + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.headerSection}>
          <PremiumText variant="title" style={styles.title}>Share & Earn</PremiumText>
          <PremiumText variant="caption" color={colors.textSecondary}>
            Earn SIG across all 32 Trust Layer apps with one link
          </PremiumText>
        </View>

        <GlassCard style={styles.tierCard}>
          <View style={styles.tierRow}>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + "20" }]}>
              <Ionicons name="diamond" size={24} color={tierColor} />
            </View>
            <View style={styles.tierInfo}>
              <PremiumText variant="subtitle" style={{ textTransform: "capitalize" as const }}>
                {dashboard?.tier || "Base"} Tier
              </PremiumText>
              <PremiumText variant="caption" color={colors.accent}>
                {(dashboard?.commissionRate * 100 || 10)}% Commission Rate
              </PremiumText>
            </View>
          </View>
          {nextTier && (
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <PremiumText variant="caption" color={colors.textSecondary}>
                  Progress to {nextTier.name}
                </PremiumText>
                <PremiumText variant="caption" color={colors.textSecondary}>
                  {convertedCount}/{nextTier.requiredReferrals}
                </PremiumText>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.card }]}>
                <View
                  style={[styles.progressFill, { width: `${Math.min(progressToNext, 100)}%`, backgroundColor: tierColor }]}
                />
              </View>
            </View>
          )}
        </GlassCard>

        <GlassCard style={styles.linkCard}>
          <PremiumText variant="subtitle" style={styles.linkLabel}>Your Referral Link</PremiumText>
          <View style={[styles.linkBox, { backgroundColor: colors.card }]}>
            <PremiumText variant="caption" color={colors.accent} style={styles.linkText} numberOfLines={1}>
              {linkData?.primaryLink || "Loading..."}
            </PremiumText>
          </View>
          <View style={styles.linkActions}>
            <Pressable onPress={handleCopyLink} style={[styles.linkButton, { backgroundColor: colors.accent }]}>
              <Ionicons name={copied ? "checkmark" : "copy"} size={18} color="#fff" />
              <PremiumText variant="body" color="#fff" style={styles.buttonLabel}>
                {copied ? "Copied!" : "Copy"}
              </PremiumText>
            </Pressable>
            <Pressable onPress={handleShare} style={[styles.linkButton, { backgroundColor: "#8B5CF6" }]}>
              <Ionicons name="share-social" size={18} color="#fff" />
              <PremiumText variant="body" color="#fff" style={styles.buttonLabel}>Share</PremiumText>
            </Pressable>
          </View>
        </GlassCard>

        <View style={styles.statsGrid}>
          <StatCard label="Total Referrals" value={String(dashboard?.totalReferrals || 0)} icon="people" color="#3B82F6" colors={colors} />
          <StatCard label="Converted" value={String(dashboard?.convertedReferrals || 0)} icon="checkmark-circle" color="#10B981" colors={colors} />
          <StatCard label="Pending" value={`${pendingAmount.toFixed(2)} SIG`} icon="time" color="#F59E0B" colors={colors} />
          <StatCard label="Paid" value={`${paidAmount.toFixed(2)} SIG`} icon="wallet" color="#8B5CF6" colors={colors} />
        </View>

        <GlassCard style={styles.section}>
          <PremiumText variant="subtitle" style={styles.sectionTitle}>Commission Tiers</PremiumText>
          {(dashboard?.tiers || []).map((tier: any) => (
            <View key={tier.name} style={[styles.tierRow2, tier.current && { backgroundColor: (TIER_COLORS[tier.name] || colors.accent) + "10", borderRadius: 8 }]}>
              <View style={styles.tierNameRow}>
                <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[tier.name] || colors.textSecondary }]} />
                <PremiumText variant="body" style={{ textTransform: "capitalize" as const, fontWeight: tier.current ? ("700" as const) : ("400" as const) }}>
                  {tier.name}
                </PremiumText>
                {tier.current && (
                  <View style={[styles.currentBadge, { backgroundColor: colors.accent }]}>
                    <PremiumText variant="caption" color="#fff" style={styles.currentText}>Current</PremiumText>
                  </View>
                )}
              </View>
              <View style={styles.tierDetails}>
                <PremiumText variant="caption" color={colors.textSecondary}>
                  {tier.minReferrals}+ referrals
                </PremiumText>
                <PremiumText variant="body" color={colors.accent} style={styles.tierRate}>
                  {tier.rate}
                </PremiumText>
              </View>
            </View>
          ))}
        </GlassCard>

        {(dashboard?.recentReferrals?.length > 0) && (
          <GlassCard style={styles.section}>
            <PremiumText variant="subtitle" style={styles.sectionTitle}>Recent Referrals</PremiumText>
            {dashboard.recentReferrals.map((ref: any) => (
              <View key={ref.id} style={styles.listItem}>
                <View style={[styles.statusDot, { backgroundColor: ref.status === "converted" ? "#10B981" : "#F59E0B" }]} />
                <View style={styles.listItemInfo}>
                  <PremiumText variant="body">{ref.platform}</PremiumText>
                  <PremiumText variant="caption" color={colors.textSecondary}>
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </PremiumText>
                </View>
                <PremiumText variant="caption" color={ref.status === "converted" ? "#10B981" : "#F59E0B"} style={{ textTransform: "capitalize" as const }}>
                  {ref.status}
                </PremiumText>
              </View>
            ))}
          </GlassCard>
        )}

        <Pressable
          onPress={handleRequestPayout}
          disabled={pendingAmount < 10 || payoutMutation.isPending}
          style={[
            styles.payoutButton,
            { backgroundColor: pendingAmount >= 10 ? colors.accent : colors.card },
          ]}
        >
          <Ionicons name="cash" size={20} color={pendingAmount >= 10 ? "#fff" : colors.textSecondary} />
          <PremiumText
            variant="body"
            color={pendingAmount >= 10 ? "#fff" : colors.textSecondary}
            style={styles.payoutLabel}
          >
            {payoutMutation.isPending ? "Processing..." : `Request Payout (${pendingAmount.toFixed(2)} SIG)`}
          </PremiumText>
        </Pressable>
        {pendingAmount < 10 && (
          <PremiumText variant="caption" color={colors.textSecondary} style={styles.payoutNote}>
            Minimum payout: 10 SIG
          </PremiumText>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color, colors }: { label: string; value: string; icon: string; color: string; colors: any }) {
  return (
    <GlassCard style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <PremiumText variant="subtitle" style={styles.statValue}>{value}</PremiumText>
      <PremiumText variant="caption" color={colors.textSecondary}>{label}</PremiumText>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  backButton: { marginBottom: 16 },
  headerSection: { marginBottom: 20 },
  title: { fontSize: 28, marginBottom: 4 },
  loginText: { marginTop: 16, textAlign: "center" as const },
  tierCard: { padding: 16, marginBottom: 16 },
  tierRow: { flexDirection: "row" as const, alignItems: "center" as const },
  tierBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  tierInfo: { flex: 1 },
  progressSection: { marginTop: 12 },
  progressLabelRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, marginBottom: 6 },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" as const },
  progressFill: { height: "100%" as const, borderRadius: 4 },
  linkCard: { padding: 16, marginBottom: 16 },
  linkLabel: { marginBottom: 8 },
  linkBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  linkText: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  linkActions: { flexDirection: "row" as const, gap: 12 },
  linkButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  buttonLabel: { fontWeight: "600" as const },
  statsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: "47%" as any,
    padding: 16,
    alignItems: "center" as const,
  },
  statValue: { fontSize: 18, marginVertical: 4 },
  section: { padding: 16, marginBottom: 16 },
  sectionTitle: { marginBottom: 12 },
  tierRow2: { paddingVertical: 10, paddingHorizontal: 8 },
  tierNameRow: { flexDirection: "row" as const, alignItems: "center" as const, marginBottom: 4 },
  tierDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  currentBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  currentText: { fontSize: 10 },
  tierDetails: { flexDirection: "row" as const, justifyContent: "space-between" as const, paddingLeft: 18 },
  tierRate: { fontWeight: "700" as const },
  listItem: { flexDirection: "row" as const, alignItems: "center" as const, paddingVertical: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  listItemInfo: { flex: 1 },
  payoutButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  payoutLabel: { fontWeight: "600" as const },
  payoutNote: { textAlign: "center" as const, marginTop: 8 },
});
