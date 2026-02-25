import React, { useState, useRef } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Linking, Platform,
  Dimensions, FlatList, Share,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { BentoRow, BentoCell } from "@/components/BentoGrid";
import { AccordionItem } from "@/components/AccordionItem";
import { PremiumText } from "@/components/PremiumText";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { getQueryFn } from "@/lib/query-client";

const { width: SCREEN_W } = Dimensions.get("window");
const GALLERY_H = 220;

const AMENITY_ICONS: Record<string, string> = {
  "pro shop": "cart-outline",
  "restaurant": "restaurant-outline",
  "dining": "restaurant-outline",
  "formal dining": "restaurant-outline",
  "grillroom": "restaurant-outline",
  "spa": "flower-outline",
  "caddie": "people-outline",
  "caddie service": "people-outline",
  "caddie program": "people-outline",
  "practice range": "fitness-outline",
  "practice facility": "fitness-outline",
  "practice center": "fitness-outline",
  "practice": "fitness-outline",
  "resort": "bed-outline",
  "hotel": "bed-outline",
  "lodge": "bed-outline",
  "resort hotel": "bed-outline",
  "pool": "water-outline",
  "swimming": "water-outline",
  "swimming pool": "water-outline",
  "infinity pool": "water-outline",
  "tennis": "tennisball-outline",
  "locker room": "lock-closed-outline",
  "locker rooms": "lock-closed-outline",
  "clubhouse": "home-outline",
  "bar": "wine-outline",
  "pub": "beer-outline",
  "fishing": "fish-outline",
  "bass fishing": "fish-outline",
  "hiking": "walk-outline",
  "hiking trails": "walk-outline",
  "walking paths": "walk-outline",
};

function getAmenityIcon(amenity: string): string {
  const lower = amenity.toLowerCase().trim();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "checkmark-circle-outline";
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryRef = useRef<FlatList>(null);

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

  const allImages: string[] = [
    course.imageUrl,
    ...((course.galleryImages as string[]) || []),
  ].filter(Boolean);

  const courseTypeBadgeColor =
    course.courseType === "Private" ? "#B71C1C" :
    course.courseType === "Public" || course.courseType === "Municipal" ? "#1B5E20" :
    "#1565C0";

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Check out ${course.name} on Trust Golf! ${course.city}, ${course.state} — ${course.holes} holes, par ${course.par}.`,
      });
    } catch (_) {}
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.galleryContainer}>
          <FlatList
            ref={galleryRef}
            data={allImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setGalleryIndex(idx);
            }}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width: SCREEN_W, height: 320 }} contentFit="cover" />
            )}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "transparent", isDark ? "#0A0F0A" : colors.background]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
            <Pressable onPress={() => router.back()} style={styles.topBtn}>
              <Ionicons name="chevron-down" size={22} color="#fff" />
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={handleShare} style={styles.topBtn}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {allImages.length > 1 && (
            <View style={styles.galleryDots}>
              {allImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === galleryIndex ? "#fff" : "rgba(255,255,255,0.4)" },
                  ]}
                />
              ))}
            </View>
          )}

          <View style={styles.imageCount}>
            <Ionicons name="images-outline" size={12} color="#fff" />
            <PremiumText variant="caption" color="#fff" style={{ fontSize: 11 }}>
              {galleryIndex + 1}/{allImages.length}
            </PremiumText>
          </View>
        </View>

        <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {course.courseType && (
              <View style={[styles.typeBadge, { backgroundColor: courseTypeBadgeColor }]}>
                <PremiumText variant="caption" color="#fff" style={{ fontSize: 11, fontWeight: "700" }}>
                  {course.courseType.toUpperCase()}
                </PremiumText>
              </View>
            )}
            {course.yearBuilt && (
              <View style={[styles.typeBadge, { backgroundColor: colors.textMuted + "30" }]}>
                <PremiumText variant="caption" color={colors.textSecondary} style={{ fontSize: 11 }}>
                  EST. {course.yearBuilt}
                </PremiumText>
              </View>
            )}
          </View>

          <PremiumText variant="hero" style={{ fontSize: 26, marginTop: 8 }}>{course.name}</PremiumText>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <PremiumText variant="body" color={colors.textSecondary} style={{ fontSize: 14, flex: 1 }}>
              {course.location}, {course.city}, {course.state}
            </PremiumText>
          </View>

          {course.designer && (
            <View style={[styles.locationRow, { marginTop: 2 }]}>
              <Ionicons name="construct-outline" size={14} color={colors.accent} />
              <PremiumText variant="body" color={colors.textSecondary} style={{ fontSize: 14, flex: 1 }}>
                Designed by {course.designer}
              </PremiumText>
            </View>
          )}

          <BentoRow style={{ marginTop: 16 }}>
            <BentoCell>
              <GlassCard style={{ height: 72 }}>
                <View style={styles.stat}>
                  <PremiumText variant="label" color={colors.textMuted}>RATING</PremiumText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="star" size={14} color="#FFD700" />
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

          <BentoRow style={{ marginTop: 10 }}>
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
                  <PremiumText variant="title" style={{ color: course.greenFee === 0 ? colors.textMuted : colors.success }}>
                    {course.greenFee === 0 ? "Private" : `$${course.greenFee}`}
                  </PremiumText>
                </View>
              </GlassCard>
            </BentoCell>
          </BentoRow>

          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <GlassCard style={{ marginTop: 16 }}>
              <AccordionItem title="About This Course" icon="information-circle-outline" defaultOpen>
                <PremiumText variant="body" color={colors.textSecondary} style={{ lineHeight: 22 }}>
                  {course.description || "No description available."}
                </PremiumText>
              </AccordionItem>
            </GlassCard>

            {course.amenities && (
              <GlassCard style={{ marginTop: 12 }}>
                <AccordionItem title="Amenities & Facilities" icon="golf-outline" defaultOpen>
                  <View style={styles.amenitiesGrid}>
                    {course.amenities.split(",").map((a: string, i: number) => (
                      <View key={i} style={[styles.amenityItem, { backgroundColor: colors.surfaceElevated }]}>
                        <Ionicons
                          name={getAmenityIcon(a) as any}
                          size={18}
                          color={colors.primary}
                        />
                        <PremiumText variant="caption" color={colors.text} style={{ fontSize: 12, flex: 1 }}>
                          {a.trim()}
                        </PremiumText>
                      </View>
                    ))}
                  </View>
                </AccordionItem>
              </GlassCard>
            )}

            <GlassCard style={{ marginTop: 12 }}>
              <AccordionItem title="Contact & Info" icon="call-outline" defaultOpen>
                <View style={{ gap: 12 }}>
                  {course.phone && (
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${course.phone}`)}
                      style={[styles.contactRow, { backgroundColor: colors.surfaceElevated }]}
                    >
                      <Ionicons name="call" size={18} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <PremiumText variant="caption" color={colors.textMuted}>Phone</PremiumText>
                        <PremiumText variant="body" color={colors.primary}>{course.phone}</PremiumText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </Pressable>
                  )}
                  {course.website && (
                    <Pressable
                      onPress={() => Linking.openURL(course.website)}
                      style={[styles.contactRow, { backgroundColor: colors.surfaceElevated }]}
                    >
                      <Ionicons name="globe" size={18} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <PremiumText variant="caption" color={colors.textMuted}>Website</PremiumText>
                        <PremiumText variant="body" color={colors.primary} style={{ fontSize: 13 }}>
                          {course.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </PremiumText>
                      </View>
                      <Ionicons name="open-outline" size={16} color={colors.textMuted} />
                    </Pressable>
                  )}
                  <View style={[styles.contactRow, { backgroundColor: colors.surfaceElevated }]}>
                    <Ionicons name="navigate" size={18} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <PremiumText variant="caption" color={colors.textMuted}>Address</PremiumText>
                      <PremiumText variant="body" color={colors.text} style={{ fontSize: 13 }}>
                        {course.location}, {course.city}, {course.state}
                      </PremiumText>
                    </View>
                  </View>
                </View>
              </AccordionItem>
            </GlassCard>
          </Animated.View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
              setTimeout(() => router.push("/new-round"), 100);
            }}
            style={[styles.playBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="golf" size={20} color="#fff" />
            <PremiumText variant="subtitle" color="#fff">Log a Round Here</PremiumText>
          </Pressable>

          <View style={{ height: 60 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  galleryContainer: { height: 320, position: "relative" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryDots: {
    position: "absolute",
    bottom: 36,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  imageCount: {
    position: "absolute",
    bottom: 34,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  content: { paddingHorizontal: 16, marginTop: -16 },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  stat: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: "45%",
    flex: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
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
