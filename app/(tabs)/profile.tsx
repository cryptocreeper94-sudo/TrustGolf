import React from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { BentoRow, BentoCell } from "@/components/BentoGrid";
import { AccordionItem } from "@/components/AccordionItem";
import { PremiumText } from "@/components/PremiumText";
import { getQueryFn } from "@/lib/query-client";

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme, themeMode, setThemeMode } = useTheme();
  const { user, logout, isDeveloper } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats", user?.id || "none"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user?.id,
  });

  const { data: analyses } = useQuery<any[]>({
    queryKey: ["/api/swing-analyses", user?.id || "none"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user?.id,
  });

  const { isLoggedIn } = useAuth();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + webTopInset + 10 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <PremiumText variant="hero">Profile</PremiumText>
          {isDeveloper && (
            <Pressable
              onPress={() => router.push("/developer")}
              style={[styles.devBtn, { backgroundColor: colors.accent + "20" }]}
            >
              <Ionicons name="code-slash" size={16} color={colors.accent} />
            </Pressable>
          )}
        </View>

        <GlassCard style={{ marginTop: 16 }}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
              <PremiumText variant="hero" style={{ color: colors.primary }}>
                {(user?.username || "G").charAt(0).toUpperCase()}
              </PremiumText>
            </View>
            <View style={{ flex: 1 }}>
              <PremiumText variant="title">{user?.username || "Guest"}</PremiumText>
              <PremiumText variant="caption" color={colors.textMuted}>
                Member since {new Date().getFullYear()}
              </PremiumText>
            </View>
          </View>
        </GlassCard>

        {stats && stats.totalRounds > 0 && (
          <View style={{ marginTop: 14, gap: 10 }}>
            {stats.handicapIndex != null && (
              <GlassCard style={{ height: 72 }}>
                <View style={styles.handicapRow}>
                  <View style={[styles.handicapIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name="analytics" size={22} color={colors.primary} />
                  </View>
                  <View>
                    <PremiumText variant="label" color={colors.textMuted}>HANDICAP INDEX</PremiumText>
                    <PremiumText variant="title" accent style={{ fontSize: 24 }}>{stats.handicapIndex}</PremiumText>
                  </View>
                </View>
              </GlassCard>
            )}
            <BentoRow>
              <BentoCell>
                <GlassCard style={{ height: 80 }}>
                  <View style={styles.statItem}>
                    <PremiumText variant="label" color={colors.textMuted}>ROUNDS</PremiumText>
                    <PremiumText variant="title" accent>{stats.totalRounds}</PremiumText>
                  </View>
                </GlassCard>
              </BentoCell>
              <BentoCell>
                <GlassCard style={{ height: 80 }}>
                  <View style={styles.statItem}>
                    <PremiumText variant="label" color={colors.textMuted}>AVG</PremiumText>
                    <PremiumText variant="title">{stats.averageScore}</PremiumText>
                  </View>
                </GlassCard>
              </BentoCell>
              <BentoCell>
                <GlassCard style={{ height: 80 }}>
                  <View style={styles.statItem}>
                    <PremiumText variant="label" color={colors.textMuted}>ANALYSES</PremiumText>
                    <PremiumText variant="title">{(analyses || []).length}</PremiumText>
                  </View>
                </GlassCard>
              </BentoCell>
            </BentoRow>
          </View>
        )}

        <GlassCard style={{ marginTop: 14 }}>
          <AccordionItem title="Appearance" icon="color-palette-outline" defaultOpen>
            <View style={styles.themeOptions}>
              {(["light", "dark", "system"] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => {
                    setThemeMode(mode);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: themeMode === mode ? colors.primary + "15" : "transparent",
                      borderColor: themeMode === mode ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={mode === "light" ? "sunny" : mode === "dark" ? "moon" : "phone-portrait"}
                    size={18}
                    color={themeMode === mode ? colors.primary : colors.textMuted}
                  />
                  <PremiumText
                    variant="caption"
                    color={themeMode === mode ? colors.primary : colors.textSecondary}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </PremiumText>
                </Pressable>
              ))}
            </View>
          </AccordionItem>
          <AccordionItem title="About Trust Golf" icon="information-circle-outline">
            <PremiumText variant="body" color={colors.textSecondary}>
              Trust Golf is your premium golf companion for score tracking, course discovery, AI-powered swing analysis, and exclusive deals.
            </PremiumText>
          </AccordionItem>
        </GlassCard>

        {isLoggedIn ? (
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutBtn, { borderColor: colors.error }]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <PremiumText variant="body" color={colors.error}>Sign Out</PremiumText>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/login")}
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="person-outline" size={18} color="#fff" />
            <PremiumText variant="body" color="#fff">Sign In</PremiumText>
          </Pressable>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  devBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  handicapRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  handicapIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  themeOptions: { flexDirection: "row", gap: 10 },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
});
