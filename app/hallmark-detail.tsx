import React, { useEffect, useState } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { PremiumText } from "@/components/PremiumText";
import { GlassCard } from "@/components/GlassCard";
import { useQuery } from "@tanstack/react-query";

export default function HallmarkDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: genesis, isLoading } = useQuery({
    queryKey: ["/api/hallmark/genesis"],
  });

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const meta = genesis?.metadata || {};

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
          <View style={[styles.shieldContainer, { backgroundColor: colors.accent + "20" }]}>
            <Ionicons name="shield-checkmark" size={48} color={colors.accent} />
          </View>
          <PremiumText variant="title" style={styles.title}>Genesis Hallmark</PremiumText>
          <View style={[styles.hallmarkIdBadge, { backgroundColor: colors.accent }]}>
            <PremiumText variant="body" color="#fff" style={styles.hallmarkIdText}>
              {genesis?.thId || "TG-00000001"}
            </PremiumText>
          </View>
          <PremiumText variant="caption" color={colors.textSecondary} style={styles.subtitle}>
            Trust Layer Blockchain — Proof of Trust
          </PremiumText>
        </View>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={colors.accent} />
            <PremiumText variant="subtitle" style={styles.sectionTitle}>Application Info</PremiumText>
          </View>
          <InfoRow label="App Name" value={genesis?.appName || "Trust Golf"} colors={colors} />
          <InfoRow label="App ID" value={genesis?.appId || "trustgolf-genesis"} colors={colors} />
          <InfoRow label="Domain" value={meta.domain || "trustgolf.tlid.io"} colors={colors} />
          <InfoRow label="Operator" value={meta.operator || "DarkWave Studios LLC"} colors={colors} />
          <InfoRow label="Product" value={genesis?.productName || "Genesis Block"} colors={colors} />
          <InfoRow label="Release Type" value={genesis?.releaseType || "genesis"} colors={colors} />
          <InfoRow label="Version" value={meta.version || "1.0.0"} colors={colors} />
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={20} color="#8B5CF6" />
            <PremiumText variant="subtitle" style={styles.sectionTitle}>Blockchain Record</PremiumText>
          </View>
          <InfoRow label="Data Hash" value={truncateHash(genesis?.dataHash)} colors={colors} mono />
          <InfoRow label="Tx Hash" value={truncateHash(genesis?.txHash)} colors={colors} mono />
          <InfoRow label="Block Height" value={genesis?.blockHeight || "—"} colors={colors} mono />
          <InfoRow label="Created" value={genesis?.createdAt ? new Date(genesis.createdAt).toLocaleDateString() : "—"} colors={colors} />
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe" size={20} color="#10B981" />
            <PremiumText variant="subtitle" style={styles.sectionTitle}>Ecosystem Details</PremiumText>
          </View>
          <InfoRow label="Ecosystem" value={meta.ecosystem || "Trust Layer"} colors={colors} />
          <InfoRow label="Chain" value={meta.chain || "Trust Layer Blockchain"} colors={colors} />
          <InfoRow label="Consensus" value={meta.consensus || "Proof of Trust"} colors={colors} />
          <InfoRow label="Native Asset" value={meta.nativeAsset || "SIG"} colors={colors} />
          <InfoRow label="Utility Token" value={meta.utilityToken || "Shells"} colors={colors} />
          <InfoRow label="Launch Date" value="August 23, 2026" colors={colors} />
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            <PremiumText variant="subtitle" style={styles.sectionTitle}>Verification</PremiumText>
          </View>
          <PremiumText variant="caption" color={colors.textSecondary} style={styles.verifyText}>
            This hallmark can be independently verified via the public API endpoint.
          </PremiumText>
          <View style={[styles.verifyUrl, { backgroundColor: colors.card }]}>
            <PremiumText variant="caption" color={colors.accent} style={styles.monoText}>
              GET /api/hallmark/{genesis?.thId || "TG-00000001"}/verify
            </PremiumText>
          </View>
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link" size={20} color="#F59E0B" />
            <PremiumText variant="subtitle" style={styles.sectionTitle}>Parent Genesis</PremiumText>
          </View>
          <PremiumText variant="caption" color={colors.textSecondary} style={styles.parentText}>
            All ecosystem apps trace their provenance to the Trust Layer Hub genesis block.
          </PremiumText>
          <View style={[styles.parentBadge, { backgroundColor: "#F59E0B20" }]}>
            <Ionicons name="shield" size={16} color="#F59E0B" />
            <PremiumText variant="body" color="#F59E0B" style={styles.parentId}>
              TH-00000001
            </PremiumText>
          </View>
          <PremiumText variant="caption" color={colors.textSecondary}>
            Trust Layer Hub — trusthub.tlid.io
          </PremiumText>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

function truncateHash(hash?: string): string {
  if (!hash) return "—";
  if (hash.length <= 20) return hash;
  return hash.slice(0, 10) + "..." + hash.slice(-10);
}

function InfoRow({ label, value, colors, mono }: { label: string; value: string; colors: any; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <PremiumText variant="caption" color={colors.textSecondary} style={styles.infoLabel}>
        {label}
      </PremiumText>
      <PremiumText variant="body" color={colors.text} style={[styles.infoValue, mono && styles.monoText]}>
        {value}
      </PremiumText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  backButton: { marginBottom: 16 },
  headerSection: { alignItems: "center", marginBottom: 24 },
  shieldContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, marginBottom: 8 },
  hallmarkIdBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  hallmarkIdText: { fontSize: 16, fontWeight: "700" as const },
  subtitle: { textAlign: "center" as const },
  section: { marginBottom: 16, padding: 16 },
  sectionHeader: { flexDirection: "row" as const, alignItems: "center" as const, marginBottom: 12 },
  sectionTitle: { marginLeft: 8, fontSize: 16 },
  infoRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
  infoLabel: { flex: 1 },
  infoValue: { flex: 2, textAlign: "right" as const },
  monoText: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12 },
  verifyText: { marginBottom: 8 },
  verifyUrl: { padding: 12, borderRadius: 8 },
  parentText: { marginBottom: 12 },
  parentBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    alignSelf: "flex-start" as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  parentId: { marginLeft: 6, fontWeight: "600" as const },
});
