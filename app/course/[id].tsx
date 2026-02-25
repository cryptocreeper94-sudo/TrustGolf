import React from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Linking, Platform,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { BentoRow, BentoCell } from "@/components/BentoGrid";
import { AccordionItem } from "@/components/AccordionItem";
import { PremiumText } from "@/components/PremiumText";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { getQueryFn } from "@/lib/query-client";

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: course, isLoading } = useQuery<any>({
    queryKey: ["/api/courses", id],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading || !course) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset }]}>
        <CardSkeleton />
        <CardSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: course.imageUrl }} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "transparent", isDark ? "#0A0F0A" : colors.background]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + webTopInset + 10 }]}
          >
            <Ionicons name="chevron-down" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <PremiumText variant="hero">{course.name}</PremiumText>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <PremiumText variant="body" color={colors.textSecondary}>
              {course.location}, {course.city}, {course.state}
            </PremiumText>
          </View>

          <BentoRow style={{ marginTop: 16 }}>
            <BentoCell>
              <GlassCard style={{ height: 72 }}>
                <View style={styles.stat}>
                  <PremiumText variant="label" color={colors.textMuted}>RATING</PremiumText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <PremiumText variant="title">{course.rating}</PremiumText>
                  </View>
                </View>
              </GlassCard>
            </BentoCell>
            <BentoCell>
              <GlassCard style={{ height: 72 }}>
                <View style={styles.stat}>
                  <PremiumText variant="label" color={colors.textMuted}>PAR</PremiumText>
                  <PremiumText variant="title">{course.par}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
            <BentoCell>
              <GlassCard style={{ height: 72 }}>
                <View style={styles.stat}>
                  <PremiumText variant="label" color={colors.textMuted}>YARDS</PremiumText>
                  <PremiumText variant="title">{(course.yardage || 0).toLocaleString()}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
          </BentoRow>

          <BentoRow style={{ marginTop: 12 }}>
            <BentoCell>
              <GlassCard style={{ height: 72 }}>
                <View style={styles.stat}>
                  <PremiumText variant="label" color={colors.textMuted}>SLOPE</PremiumText>
                  <PremiumText variant="title">{course.slope}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
            <BentoCell>
              <GlassCard style={{ height: 72 }}>
                <View style={styles.stat}>
                  <PremiumText variant="label" color={colors.textMuted}>HOLES</PremiumText>
                  <PremiumText variant="title">{course.holes}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
            <BentoCell>
              <GlassCard style={{ height: 72 }}>
                <View style={styles.stat}>
                  <PremiumText variant="label" color={colors.textMuted}>GREEN FEE</PremiumText>
                  <PremiumText variant="title" style={{ color: colors.success }}>${course.greenFee}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
          </BentoRow>

          <GlassCard style={{ marginTop: 16 }}>
            <AccordionItem title="About This Course" icon="information-circle-outline" defaultOpen>
              <PremiumText variant="body" color={colors.textSecondary}>
                {course.description || "No description available."}
              </PremiumText>
            </AccordionItem>
            {course.amenities && (
              <AccordionItem title="Amenities" icon="golf-outline">
                <View style={styles.amenitiesRow}>
                  {course.amenities.split(",").map((a: string, i: number) => (
                    <View key={i} style={[styles.amenityBadge, { backgroundColor: colors.primary + "12" }]}>
                      <PremiumText variant="caption" color={colors.primary}>{a.trim()}</PremiumText>
                    </View>
                  ))}
                </View>
              </AccordionItem>
            )}
            {course.phone && (
              <AccordionItem title="Contact" icon="call-outline">
                <Pressable onPress={() => Linking.openURL(`tel:${course.phone}`)}>
                  <PremiumText variant="body" color={colors.primary}>{course.phone}</PremiumText>
                </Pressable>
              </AccordionItem>
            )}
          </GlassCard>

          <Pressable
            onPress={() => {
              router.back();
              setTimeout(() => router.push("/new-round"), 100);
            }}
            style={[styles.playBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="golf" size={20} color="#fff" />
            <PremiumText variant="subtitle" color="#fff">Log a Round Here</PremiumText>
          </Pressable>

          <View style={{ height: 50 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  imageContainer: { height: 280 },
  heroImage: { ...StyleSheet.absoluteFillObject },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 16, marginTop: -20 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  stat: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  amenitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 20,
  },
});
