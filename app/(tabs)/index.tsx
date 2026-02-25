import React, { useCallback } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Dimensions, Platform, RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { BentoRow, BentoCell } from "@/components/BentoGrid";
import { Carousel } from "@/components/Carousel";
import { OrbEffect } from "@/components/OrbEffect";
import { PremiumText } from "@/components/PremiumText";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { getQueryFn } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ExploreScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: coursesData, isLoading: coursesLoading, refetch: refetchCourses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: dealsData, isLoading: dealsLoading, refetch: refetchDeals } = useQuery<any[]>({
    queryKey: ["/api/deals"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: statsData } = useQuery<any>({
    queryKey: ["/api/stats", user?.id || "none"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user?.id,
  });

  const courses = coursesData || [];
  const deals = dealsData || [];
  const hotDeals = deals.filter((d: any) => d.isHot);

  const onRefresh = useCallback(() => {
    refetchCourses();
    refetchDeals();
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + webTopInset + 10 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <PremiumText variant="caption" color={colors.textMuted}>
              WELCOME BACK
            </PremiumText>
            <PremiumText variant="hero" style={{ marginTop: 2 }}>
              {user?.username || "Golfer"}
            </PremiumText>
          </View>
          <Pressable onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name={isDark ? "sunny" : "moon"} size={20} color={colors.text} />
          </Pressable>
        </View>

        <BentoRow style={{ marginTop: 20 }}>
          <BentoCell flex={2}>
            <GlassCard onPress={() => router.push("/swing-analyzer")} style={{ height: 140 }}>
              <OrbEffect color={colors.primary + "30"} size={120} />
              <View style={styles.quickActionContent}>
                <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Ionicons name="videocam" size={24} color={colors.primary} />
                </View>
                <PremiumText variant="subtitle">AI Swing Analysis</PremiumText>
                <PremiumText variant="caption" color={colors.textSecondary}>Upload your swing for pro feedback</PremiumText>
              </View>
            </GlassCard>
          </BentoCell>
          <BentoCell flex={1}>
            <View style={{ gap: 12 }}>
              <GlassCard onPress={() => router.push("/new-round")} style={{ height: 64 }}>
                <View style={styles.miniAction}>
                  <Ionicons name="add-circle" size={22} color={colors.primary} />
                  <PremiumText variant="caption">New Round</PremiumText>
                </View>
              </GlassCard>
              <GlassCard onPress={() => router.push("/(tabs)/scores")} style={{ height: 64 }}>
                <View style={styles.miniAction}>
                  <Ionicons name="stats-chart" size={22} color={colors.accent} />
                  <PremiumText variant="caption">My Stats</PremiumText>
                </View>
              </GlassCard>
            </View>
          </BentoCell>
        </BentoRow>

        {statsData && statsData.totalRounds > 0 && (
          <BentoRow style={{ marginTop: 16 }}>
            <BentoCell>
              <GlassCard style={{ height: 80 }}>
                <View style={styles.statItem}>
                  <PremiumText variant="caption" color={colors.textMuted}>ROUNDS</PremiumText>
                  <PremiumText variant="title" accent>{statsData.totalRounds}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
            <BentoCell>
              <GlassCard style={{ height: 80 }}>
                <View style={styles.statItem}>
                  <PremiumText variant="caption" color={colors.textMuted}>AVG SCORE</PremiumText>
                  <PremiumText variant="title">{statsData.averageScore}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
            <BentoCell>
              <GlassCard style={{ height: 80 }}>
                <View style={styles.statItem}>
                  <PremiumText variant="caption" color={colors.textMuted}>BEST</PremiumText>
                  <PremiumText variant="title" style={{ color: colors.success }}>{statsData.bestScore}</PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
          </BentoRow>
        )}

        {hotDeals.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.sectionHeader}>
              <PremiumText variant="subtitle">Hot Deals</PremiumText>
              <Pressable onPress={() => router.push("/(tabs)/deals")}>
                <PremiumText variant="caption" color={colors.primary}>See All</PremiumText>
              </Pressable>
            </View>
            <Carousel
              data={hotDeals}
              itemWidth={SCREEN_WIDTH * 0.7}
              renderItem={(deal: any) => (
                <GlassCard noPadding style={{ height: 180 }}>
                  <Image source={{ uri: deal.imageUrl }} style={styles.dealImage} contentFit="cover" />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.dealGradient}
                  />
                  <View style={styles.dealContent}>
                    <View style={[styles.hotBadge, { backgroundColor: colors.error }]}>
                      <Ionicons name="flame" size={12} color="#fff" />
                      <PremiumText variant="caption" color="#fff">{deal.discountPercent}% OFF</PremiumText>
                    </View>
                    <PremiumText variant="subtitle" color="#fff" shadow numberOfLines={1}>{deal.courseName}</PremiumText>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.8)" numberOfLines={1}>{deal.title}</PremiumText>
                  </View>
                </GlassCard>
              )}
            />
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <View style={styles.sectionHeader}>
            <PremiumText variant="subtitle">Top Courses</PremiumText>
            <Pressable onPress={() => router.push("/(tabs)/courses")}>
              <PremiumText variant="caption" color={colors.primary}>See All</PremiumText>
            </Pressable>
          </View>
          {coursesLoading ? (
            <BentoRow>
              <BentoCell><CardSkeleton /></BentoCell>
              <BentoCell><CardSkeleton /></BentoCell>
            </BentoRow>
          ) : (
            <Carousel
              data={courses.slice(0, 5)}
              itemWidth={SCREEN_WIDTH * 0.6}
              renderItem={(course: any) => (
                <GlassCard
                  noPadding
                  style={{ height: 200 }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/course/[id]", params: { id: String(course.id) } });
                  }}
                >
                  <Image source={{ uri: course.imageUrl }} style={styles.courseImage} contentFit="cover" />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.75)"]}
                    style={styles.courseGradient}
                  />
                  <View style={styles.courseContent}>
                    <PremiumText variant="subtitle" color="#fff" shadow numberOfLines={1}>{course.name}</PremiumText>
                    <View style={styles.courseInfo}>
                      <Ionicons name="location" size={12} color="rgba(255,255,255,0.7)" />
                      <PremiumText variant="caption" color="rgba(255,255,255,0.7)">{course.city}, {course.state}</PremiumText>
                    </View>
                    <View style={styles.courseInfo}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <PremiumText variant="caption" color="rgba(255,255,255,0.9)">{course.rating}</PremiumText>
                      <PremiumText variant="caption" color="rgba(255,255,255,0.6)">  |  ${course.greenFee}</PremiumText>
                    </View>
                  </View>
                </GlassCard>
              )}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionContent: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  miniAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dealImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  dealGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  dealContent: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    gap: 2,
  },
  hotBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginBottom: 4,
  },
  courseImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  courseGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  courseContent: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    gap: 3,
  },
  courseInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
