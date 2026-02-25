import React, { useState, useEffect } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { BentoRow, BentoCell } from "@/components/BentoGrid";
import { AccordionItem } from "@/components/AccordionItem";
import { PremiumText } from "@/components/PremiumText";
import { OrbEffect } from "@/components/OrbEffect";
import AsyncStorage from "@react-native-async-storage/async-storage";

function ScoreMeter({ score, label, color }: { score: number; label: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={meterStyles.container}>
      <View style={[meterStyles.track, { backgroundColor: colors.surfaceElevated }]}>
        <View style={[meterStyles.fill, { width: `${score * 10}%`, backgroundColor: color }]} />
      </View>
      <View style={meterStyles.labelRow}>
        <PremiumText variant="caption" color={colors.textSecondary}>{label}</PremiumText>
        <PremiumText variant="caption" style={{ color }}>{score}/10</PremiumText>
      </View>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  container: { gap: 4 },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  labelRow: { flexDirection: "row", justifyContent: "space-between" },
});

export default function SwingResultScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem("last_swing_analysis").then((data) => {
      if (data) {
        const parsed = JSON.parse(data);
        setAnalysis(parsed.analysisResult || parsed);
      }
    });
  }, []);

  if (!analysis) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <PremiumText variant="body" color={colors.textMuted}>No analysis data</PremiumText>
      </View>
    );
  }

  const overallScore = analysis.overallScore || 70;
  const scoreColor = overallScore >= 80 ? colors.success : overallScore >= 60 ? colors.accent : colors.warning;

  const categories = [
    { key: "grip", label: "Grip", icon: "hand-left-outline" },
    { key: "stance", label: "Stance", icon: "body-outline" },
    { key: "backswing", label: "Backswing", icon: "arrow-undo-outline" },
    { key: "downswing", label: "Downswing", icon: "arrow-redo-outline" },
    { key: "impact", label: "Impact", icon: "flash-outline" },
    { key: "followThrough", label: "Follow Through", icon: "trending-up-outline" },
    { key: "tempo", label: "Tempo", icon: "timer-outline" },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <PremiumText variant="subtitle">Analysis Results</PremiumText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.scoreCard}>
          <OrbEffect color={scoreColor + "25"} size={160} />
          <View style={styles.scoreContent}>
            <PremiumText variant="label" color={colors.textMuted}>OVERALL SCORE</PremiumText>
            <PremiumText variant="hero" style={{ fontSize: 48, color: scoreColor }}>{overallScore}</PremiumText>
            <PremiumText variant="caption" color={colors.textSecondary}>out of 100</PremiumText>
          </View>
        </GlassCard>

        {analysis.summary && (
          <GlassCard style={{ marginTop: 14 }}>
            <PremiumText variant="label" color={colors.textMuted} style={{ marginBottom: 8 }}>SUMMARY</PremiumText>
            <PremiumText variant="body" color={colors.textSecondary}>{analysis.summary}</PremiumText>
          </GlassCard>
        )}

        <GlassCard style={{ marginTop: 14 }}>
          <PremiumText variant="label" color={colors.textMuted} style={{ marginBottom: 12 }}>BREAKDOWN</PremiumText>
          <View style={{ gap: 14 }}>
            {categories.map(({ key, label }) => {
              const catData = analysis[key];
              if (!catData || !catData.score) return null;
              const catColor = catData.score >= 8 ? colors.success : catData.score >= 5 ? colors.accent : colors.warning;
              return <ScoreMeter key={key} score={catData.score} label={label} color={catColor} />;
            })}
          </View>
        </GlassCard>

        <GlassCard style={{ marginTop: 14 }}>
          {categories.map(({ key, label, icon }) => {
            const catData = analysis[key];
            if (!catData || !catData.feedback) return null;
            return (
              <AccordionItem key={key} title={label} icon={icon}>
                <PremiumText variant="body" color={colors.textSecondary}>{catData.feedback}</PremiumText>
              </AccordionItem>
            );
          })}
        </GlassCard>

        {analysis.topTips && analysis.topTips.length > 0 && (
          <GlassCard style={{ marginTop: 14 }}>
            <PremiumText variant="label" color={colors.textMuted} style={{ marginBottom: 10 }}>TOP TIPS</PremiumText>
            {analysis.topTips.map((tip: string, i: number) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <PremiumText variant="body" color={colors.textSecondary} style={{ flex: 1 }}>{tip}</PremiumText>
              </View>
            ))}
          </GlassCard>
        )}

        {analysis.drills && analysis.drills.length > 0 && (
          <GlassCard style={{ marginTop: 14 }}>
            <PremiumText variant="label" color={colors.textMuted} style={{ marginBottom: 10 }}>RECOMMENDED DRILLS</PremiumText>
            {analysis.drills.map((drill: string, i: number) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="fitness" size={18} color={colors.primary} />
                <PremiumText variant="body" color={colors.textSecondary} style={{ flex: 1 }}>{drill}</PremiumText>
              </View>
            ))}
          </GlassCard>
        )}

        <Pressable
          onPress={() => {
            router.back();
            setTimeout(() => router.push("/swing-analyzer"), 100);
          }}
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <PremiumText variant="body" color="#fff">Analyze Another Swing</PremiumText>
        </Pressable>

        <View style={{ height: 50 }} />
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
  content: { paddingHorizontal: 16 },
  scoreCard: { height: 180, justifyContent: "center" },
  scoreContent: { alignItems: "center", gap: 4 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 20,
  },
});
