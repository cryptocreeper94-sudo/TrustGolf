import React from "react";
import {
  View, StyleSheet, FlatList, Pressable, Platform,
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
import { PremiumText } from "@/components/PremiumText";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { getQueryFn } from "@/lib/query-client";

export default function ScoresScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const isLoggedIn = !!user;

  const { data: rounds, isLoading } = useQuery<any[]>({
    queryKey: ["/api/rounds", user?.id || "none"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats", user?.id || "none"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user?.id,
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getScoreColor = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= 0) return colors.success;
    if (diff <= 5) return colors.accent;
    if (diff <= 10) return colors.warning;
    return colors.error;
  };

  const renderRound = ({ item }: { item: any }) => {
    const diff = item.totalScore - item.par;
    const diffText = diff === 0 ? "E" : diff > 0 ? `+${diff}` : `${diff}`;

    return (
      <GlassCard style={styles.roundCard}>
        <View style={styles.roundHeader}>
          <View style={{ flex: 1 }}>
            <PremiumText variant="subtitle" numberOfLines={1}>{item.courseName}</PremiumText>
            <PremiumText variant="caption" color={colors.textMuted}>{formatDate(item.date)}</PremiumText>
          </View>
          <View style={styles.scoreBox}>
            <PremiumText variant="title" style={{ color: getScoreColor(item.totalScore, item.par) }}>
              {item.totalScore}
            </PremiumText>
            <PremiumText variant="caption" color={colors.textMuted}>{diffText}</PremiumText>
          </View>
        </View>
        <View style={styles.roundStats}>
          {item.putts != null && (
            <View style={styles.roundStat}>
              <PremiumText variant="caption" color={colors.textMuted}>Putts</PremiumText>
              <PremiumText variant="body">{item.putts}</PremiumText>
            </View>
          )}
          {item.fairwaysHit != null && (
            <View style={styles.roundStat}>
              <PremiumText variant="caption" color={colors.textMuted}>FIR</PremiumText>
              <PremiumText variant="body">{item.fairwaysHit}/14</PremiumText>
            </View>
          )}
          {item.greensInRegulation != null && (
            <View style={styles.roundStat}>
              <PremiumText variant="caption" color={colors.textMuted}>GIR</PremiumText>
              <PremiumText variant="body">{item.greensInRegulation}/18</PremiumText>
            </View>
          )}
          <View style={styles.roundStat}>
            <PremiumText variant="caption" color={colors.textMuted}>Par</PremiumText>
            <PremiumText variant="body">{item.par}</PremiumText>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
        <PremiumText variant="hero">Scores</PremiumText>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (!isLoggedIn) {
              router.push({ pathname: "/login", params: { reason: "Sign in to log a round", redirect: "/new-round" } });
            } else {
              router.push("/new-round");
            }
          }}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {stats && stats.totalRounds > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 12, gap: 10 }}>
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
                <View style={{ flex: 1 }} />
                <PremiumText variant="caption" color={colors.textMuted} style={{ textAlign: "right" }}>
                  USGA{"\n"}Formula
                </PremiumText>
              </View>
            </GlassCard>
          )}
          <BentoRow>
            <BentoCell>
              <GlassCard style={{ height: 72 }}>
                <View style={styles.statItem}>
                  <PremiumText variant="label" color={colors.textMuted}>ROUNDS</PremiumText>
                  <PremiumText variant="title" accent>{stats.totalRounds}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
            <BentoCell>
              <GlassCard style={{ height: 72 }}>
                <View style={styles.statItem}>
                  <PremiumText variant="label" color={colors.textMuted}>AVG</PremiumText>
                  <PremiumText variant="title">{stats.averageScore}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
            <BentoCell>
              <GlassCard style={{ height: 72 }}>
                <View style={styles.statItem}>
                  <PremiumText variant="label" color={colors.textMuted}>BEST</PremiumText>
                  <PremiumText variant="title" style={{ color: colors.success }}>{stats.bestScore}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
          </BentoRow>
        </View>
      )}

      {isLoading ? (
        <View style={{ padding: 16 }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={rounds || []}
          renderItem={renderRound}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={(rounds || []).length > 0}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flag-outline" size={48} color={colors.textMuted} />
              <PremiumText variant="body" color={colors.textMuted}>
                {isLoggedIn ? "No rounds yet" : "Sign in to track your scores"}
              </PremiumText>
              <Pressable
                onPress={() => {
                  if (!isLoggedIn) {
                    router.push({ pathname: "/login", params: { reason: "Sign in to log a round", redirect: "/new-round" } });
                  } else {
                    router.push("/new-round");
                  }
                }}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <PremiumText variant="body" color="#fff">
                  {isLoggedIn ? "Log Your First Round" : "Sign In"}
                </PremiumText>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  handicapRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  handicapIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 100 },
  roundCard: {},
  roundHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  scoreBox: { alignItems: "center" },
  roundStats: { flexDirection: "row", marginTop: 12, gap: 16 },
  roundStat: { alignItems: "center", gap: 2 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
});
