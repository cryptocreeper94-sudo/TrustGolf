import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Dimensions, Platform,
  RefreshControl, StatusBar, Linking, Modal,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withRepeat, withSequence, Easing, FadeIn, FadeInDown,
  interpolate, runOnJS,
} from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { Carousel } from "@/components/Carousel";
import { PremiumText } from "@/components/PremiumText";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { BentoRow, BentoCell } from "@/components/BentoGrid";
import { OrbEffect } from "@/components/OrbEffect";
import { getQueryFn } from "@/lib/query-client";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = Math.min(SCREEN_HEIGHT * 0.52, 420);

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&q=80",
  "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&q=80",
  "https://images.unsplash.com/photo-1592919505780-303950717480?w=1200&q=80",
  "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=1200&q=80",
];

const HERO_CAPTIONS = [
  { title: "Championship Fairways", sub: "Experience world-class courses" },
  { title: "Golden Hour Greens", sub: "Tee off at sunset" },
  { title: "Aerial Views", sub: "Discover stunning landscapes" },
  { title: "The Perfect Round", sub: "Track every shot, every hole" },
];

const CATEGORIES = [
  {
    key: "courses",
    title: "Courses",
    subtitle: "Discover top-rated courses nearby",
    icon: "golf-outline" as const,
    color: "#1B5E20",
    image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&q=80",
    route: "/(tabs)/courses",
  },
  {
    key: "deals",
    title: "Exclusive Deals",
    subtitle: "Save up to 60% on tee times",
    icon: "pricetag-outline" as const,
    color: "#C5A55A",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&q=80",
    route: "/(tabs)/deals",
  },
  {
    key: "swing",
    title: "AI Swing Analyzer",
    subtitle: "Get pro feedback on your swing",
    icon: "videocam-outline" as const,
    color: "#0D47A1",
    image: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600&q=80",
    route: "/swing-analyzer",
    gated: true,
  },
  {
    key: "scores",
    title: "Score Tracker",
    subtitle: "Log rounds & track your handicap",
    icon: "flag-outline" as const,
    color: "#4E342E",
    image: "https://images.unsplash.com/photo-1592919505780-303950717480?w=600&q=80",
    route: "/(tabs)/scores",
    gated: false,
  },
];

function ImageHero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeOpacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.08, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fadeOpacity.value = withTiming(0.3, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(setCurrentIndex)((prev: number) => (prev + 1) % HERO_IMAGES.length);
        }
      });
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fadeOpacity.value = withTiming(1, { duration: 800 });
    scale.value = 1;
    scale.value = withRepeat(
      withTiming(1.08, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [currentIndex]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
      <Image
        source={{ uri: HERO_IMAGES[currentIndex] }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
    </Animated.View>
  );
}

export default function ExploreScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [heroIndex, setHeroIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: coursesData, isLoading: coursesLoading, refetch: refetchCourses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: dealsData, isLoading: dealsLoading, refetch: refetchDeals } = useQuery<any[]>({
    queryKey: ["/api/deals"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const courses = coursesData || [];
  const deals = dealsData || [];
  const hotDeals = deals.filter((d: any) => d.isHot);

  const onRefresh = useCallback(() => {
    refetchCourses();
    refetchDeals();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_CAPTIONS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryPress = (cat: typeof CATEGORIES[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (cat.gated && !isLoggedIn) {
      router.push({ pathname: "/login", params: { reason: `Sign in to use ${cat.title}`, redirect: cat.route } });
      return;
    }
    router.push(cat.route as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.headerBar, { paddingTop: insets.top + (Platform.OS === "web" ? 8 : 0), backgroundColor: colors.primary }]}>
        <View style={styles.heroLogo}>
          <Ionicons name="golf" size={18} color="#fff" />
          <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 16 }}>Trust Golf</PremiumText>
        </View>
        <Pressable
          onPress={() => { setMenuOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={styles.headerMenuBtn}
        >
          <Ionicons name="menu" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.heroContainer, { height: HERO_HEIGHT }]}>
          <ImageHero />

          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.65)", isDark ? "#0A0F0A" : colors.background]}
            locations={[0, 0.2, 0.75, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroCaptionArea}>
            <Animated.View key={heroIndex} entering={FadeInDown.duration(500)}>
              <PremiumText variant="hero" color="#fff" shadow style={{ fontSize: 28 }}>
                {HERO_CAPTIONS[heroIndex].title}
              </PremiumText>
              <PremiumText variant="body" color="rgba(255,255,255,0.85)" shadow style={{ marginTop: 4 }}>
                {HERO_CAPTIONS[heroIndex].sub}
              </PremiumText>
            </Animated.View>
            <View style={styles.heroDots}>
              {HERO_CAPTIONS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.heroDot,
                    {
                      backgroundColor: i === heroIndex ? "#fff" : "rgba(255,255,255,0.4)",
                      width: i === heroIndex ? 20 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={{ marginTop: 20 }}>
            <View style={styles.sectionHeader}>
              <PremiumText variant="subtitle">Explore</PremiumText>
            </View>
            <Carousel
              data={CATEGORIES}
              itemWidth={SCREEN_WIDTH * 0.72}
              renderItem={(cat) => (
                <Pressable onPress={() => handleCategoryPress(cat)} style={{ height: 190 }}>
                  <View style={[styles.categoryCard, { borderColor: colors.glassBorder }]}>
                    <Image
                      source={{ uri: cat.image }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={200}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.85)"]}
                      locations={[0, 0.4, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.categoryContent}>
                      <View style={[styles.categoryIconBadge, { backgroundColor: cat.color + "DD" }]}>
                        <Ionicons name={cat.icon} size={20} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <PremiumText variant="subtitle" color="#fff" shadow>{cat.title}</PremiumText>
                          {cat.gated && !isLoggedIn && (
                            <Ionicons name="lock-closed" size={13} color="rgba(255,255,255,0.6)" />
                          )}
                        </View>
                        <PremiumText variant="caption" color="rgba(255,255,255,0.8)">{cat.subtitle}</PremiumText>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </View>

          {hotDeals.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="flame" size={20} color={colors.error} />
                  <PremiumText variant="subtitle">Hot Deals</PremiumText>
                </View>
                <Pressable onPress={() => router.push("/(tabs)/deals")}>
                  <PremiumText variant="caption" color={colors.primary}>See All</PremiumText>
                </Pressable>
              </View>
              <Carousel
                data={hotDeals}
                itemWidth={SCREEN_WIDTH * 0.72}
                renderItem={(deal: any) => (
                  <GlassCard noPadding style={{ height: 200 }}>
                    <Image source={{ uri: deal.imageUrl }} style={styles.dealImage} contentFit="cover" />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.85)"]}
                      style={styles.dealGradient}
                    />
                    <View style={styles.dealContent}>
                      <View style={[styles.hotBadge, { backgroundColor: colors.error }]}>
                        <Ionicons name="flame" size={12} color="#fff" />
                        <PremiumText variant="caption" color="#fff">{deal.discountPercent}% OFF</PremiumText>
                      </View>
                      <PremiumText variant="subtitle" color="#fff" shadow numberOfLines={1}>{deal.courseName}</PremiumText>
                      <PremiumText variant="caption" color="rgba(255,255,255,0.8)" numberOfLines={1}>{deal.title}</PremiumText>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ textDecorationLine: "line-through" }}>
                          ${deal.originalPrice}
                        </PremiumText>
                        <PremiumText variant="title" color="#fff" style={{ fontSize: 18 }}>${deal.dealPrice}</PremiumText>
                      </View>
                    </View>
                  </GlassCard>
                )}
              />
            </View>
          )}

          <View style={{ marginTop: 28 }}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <PremiumText variant="subtitle">Top Courses</PremiumText>
              </View>
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
                data={courses.slice(0, 6)}
                itemWidth={SCREEN_WIDTH * 0.55}
                renderItem={(course: any) => (
                  <GlassCard
                    noPadding
                    style={{ height: 220 }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: "/course/[id]", params: { id: String(course.id) } });
                    }}
                  >
                    <Image source={{ uri: course.imageUrl }} style={styles.courseImage} contentFit="cover" />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.8)"]}
                      style={styles.courseGradient}
                    />
                    <View style={styles.courseContent}>
                      <PremiumText variant="subtitle" color="#fff" shadow numberOfLines={1} style={{ fontSize: 15 }}>
                        {course.name}
                      </PremiumText>
                      <View style={styles.courseInfo}>
                        <Ionicons name="location" size={11} color="rgba(255,255,255,0.7)" />
                        <PremiumText variant="caption" color="rgba(255,255,255,0.7)" style={{ fontSize: 11 }}>
                          {course.city}, {course.state}
                        </PremiumText>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                        <View style={styles.courseInfo}>
                          <Ionicons name="star" size={11} color="#FFD700" />
                          <PremiumText variant="caption" color="rgba(255,255,255,0.9)" style={{ fontSize: 11 }}>
                            {course.rating}
                          </PremiumText>
                        </View>
                        <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 11 }}>|</PremiumText>
                        <PremiumText variant="caption" color={colors.accent} style={{ fontSize: 12 }}>
                          ${course.greenFee}
                        </PremiumText>
                      </View>
                    </View>
                  </GlassCard>
                )}
              />
            )}
          </View>

          <View style={{ marginTop: 28, position: "relative" }}>
            <OrbEffect color={colors.primary + "12"} size={140} />
            <View style={styles.sectionHeader}>
              <PremiumText variant="subtitle">Quick Actions</PremiumText>
            </View>
            <BentoRow>
              <BentoCell flex={1}>
                <GlassCard
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (!isLoggedIn) {
                      router.push({ pathname: "/login", params: { reason: "Sign in to log a round", redirect: "/new-round" } });
                    } else {
                      router.push("/new-round");
                    }
                  }}
                  style={{ height: 90 }}
                >
                  <View style={styles.quickActionItem}>
                    <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + "18" }]}>
                      <Ionicons name="add-circle" size={26} color={colors.primary} />
                    </View>
                    <PremiumText variant="caption" style={{ fontSize: 12 }}>New Round</PremiumText>
                  </View>
                </GlassCard>
              </BentoCell>
              <BentoCell flex={1}>
                <GlassCard
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (!isLoggedIn) {
                      router.push({ pathname: "/login", params: { reason: "Sign in to analyze your swing", redirect: "/swing-analyzer" } });
                    } else {
                      router.push("/swing-analyzer");
                    }
                  }}
                  style={{ height: 90 }}
                >
                  <View style={styles.quickActionItem}>
                    <View style={[styles.quickActionIcon, { backgroundColor: "#0D47A1" + "18" }]}>
                      <Ionicons name="videocam" size={26} color="#0D47A1" />
                    </View>
                    <PremiumText variant="caption" style={{ fontSize: 12 }}>Swing AI</PremiumText>
                  </View>
                </GlassCard>
              </BentoCell>
              <BentoCell flex={1}>
                <GlassCard
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/(tabs)/courses");
                  }}
                  style={{ height: 90 }}
                >
                  <View style={styles.quickActionItem}>
                    <View style={[styles.quickActionIcon, { backgroundColor: colors.accent + "18" }]}>
                      <Ionicons name="search" size={26} color={colors.accent} />
                    </View>
                    <PremiumText variant="caption" style={{ fontSize: 12 }}>Find Course</PremiumText>
                  </View>
                </GlassCard>
              </BentoCell>
            </BentoRow>
          </View>

          {deals.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <View style={styles.sectionHeader}>
                <PremiumText variant="subtitle">All Deals</PremiumText>
                <Pressable onPress={() => router.push("/(tabs)/deals")}>
                  <PremiumText variant="caption" color={colors.primary}>Browse All</PremiumText>
                </Pressable>
              </View>
              <Carousel
                data={deals.slice(0, 5)}
                itemWidth={SCREEN_WIDTH * 0.65}
                renderItem={(deal: any) => (
                  <GlassCard noPadding style={{ height: 160 }}>
                    <Image source={{ uri: deal.imageUrl }} style={styles.dealImage} contentFit="cover" />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.75)"]}
                      style={styles.dealGradient}
                    />
                    <View style={styles.dealContent}>
                      {deal.isHot && (
                        <View style={[styles.hotBadge, { backgroundColor: colors.error }]}>
                          <Ionicons name="flame" size={10} color="#fff" />
                          <PremiumText variant="caption" color="#fff" style={{ fontSize: 10 }}>{deal.discountPercent}% OFF</PremiumText>
                        </View>
                      )}
                      <PremiumText variant="body" color="#fff" shadow numberOfLines={1}>{deal.title}</PremiumText>
                      <PremiumText variant="caption" color="rgba(255,255,255,0.7)" numberOfLines={1}>{deal.courseName}</PremiumText>
                    </View>
                  </GlassCard>
                )}
              />
            </View>
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.footerLogo}>
            <Ionicons name="golf" size={18} color={colors.primary} />
            <PremiumText variant="body" color={colors.text} style={{ fontSize: 14 }}>Trust Golf</PremiumText>
          </View>

          <View style={styles.footerDivider}>
            <View style={[styles.footerLine, { backgroundColor: colors.border }]} />
          </View>

          <Pressable onPress={() => Linking.openURL("https://darkwavestudios.io")}>
            <PremiumText variant="caption" color={colors.textSecondary} style={styles.footerLink}>
              DarkWave Studios LLC {"\u00A9"} 2026
            </PremiumText>
          </Pressable>

          <Pressable onPress={() => Linking.openURL("https://dwtl.io")}>
            <PremiumText variant="caption" color={colors.textSecondary} style={styles.footerLink}>
              Powered by <PremiumText variant="caption" color={colors.primary}>Trust Layer</PremiumText>
            </PremiumText>
          </Pressable>

          <Pressable onPress={() => Linking.openURL("https://trustshield.tech")}>
            <PremiumText variant="caption" color={colors.textSecondary} style={styles.footerLink}>
              Protected by <PremiumText variant="caption" color={colors.primary}>TrustShield</PremiumText>
            </PremiumText>
          </Pressable>

          <View style={[styles.footerDivider, { marginTop: 12 }]}>
            <View style={[styles.footerLine, { backgroundColor: colors.border }]} />
          </View>

          <Pressable
            onPress={() => router.push("/login")}
            style={styles.footerDevLink}
          >
            <Ionicons name="code-slash" size={13} color={colors.textMuted} />
            <PremiumText variant="caption" color={colors.textMuted}>Developer</PremiumText>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <Animated.View
            entering={FadeInDown.duration(200)}
            style={[styles.menuPanel, { backgroundColor: colors.card, borderColor: colors.glassBorder, marginTop: insets.top + (Platform.OS === "web" ? 8 : 0) + 44 }]}
          >
            <Pressable onPress={() => setMenuOpen(false)} style={styles.menuClose}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>

            {!isLoggedIn && (
              <Pressable
                onPress={() => { setMenuOpen(false); router.push("/login"); }}
                style={[styles.menuItem, { backgroundColor: colors.primary + "12" }]}
              >
                <Ionicons name="person-outline" size={20} color={colors.primary} />
                <PremiumText variant="body" color={colors.primary}>Sign In</PremiumText>
              </Pressable>
            )}

            {[
              { icon: "compass-outline" as const, label: "Explore", route: "/(tabs)" },
              { icon: "golf-outline" as const, label: "Courses", route: "/(tabs)/courses" },
              { icon: "pricetag-outline" as const, label: "Deals", route: "/(tabs)/deals" },
              { icon: "flag-outline" as const, label: "Scores", route: "/(tabs)/scores" },
              { icon: "person-outline" as const, label: "Profile", route: "/(tabs)/profile" },
            ].map((item) => (
              <Pressable
                key={item.route}
                onPress={() => { setMenuOpen(false); router.push(item.route as any); }}
                style={styles.menuItem}
              >
                <Ionicons name={item.icon} size={20} color={colors.text} />
                <PremiumText variant="body">{item.label}</PremiumText>
              </Pressable>
            ))}

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <Pressable onPress={toggleTheme} style={styles.menuItem}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={20} color={colors.text} />
              <PremiumText variant="body">{isDark ? "Light Mode" : "Dark Mode"}</PremiumText>
            </Pressable>

            {isLoggedIn && (
              <PremiumText variant="caption" color={colors.textMuted} style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                Signed in as {user?.username}
              </PremiumText>
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heroContainer: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 6,
    paddingTop: 6,
    height: "auto",
  },
  heroLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerMenuBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCaptionArea: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  heroDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 14,
  },
  heroDot: {
    height: 4,
    borderRadius: 2,
  },
  body: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  categoryContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  categoryIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
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
    height: 130,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  dealContent: {
    position: "absolute",
    bottom: 14,
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
    height: 130,
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
  quickActionItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  footerDivider: {
    width: "100%",
    alignItems: "center",
    marginVertical: 10,
  },
  footerLine: {
    width: 40,
    height: 1,
  },
  footerLink: {
    textAlign: "center",
    paddingVertical: 4,
    fontSize: 11,
  },
  footerDevLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 6,
    paddingVertical: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  menuPanel: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    overflow: "hidden",
  },
  menuClose: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 8,
    marginVertical: 1,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    marginVertical: 8,
  },
});
