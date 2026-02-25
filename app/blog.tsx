import React, { useState, useCallback } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform, RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { PremiumText } from "@/components/PremiumText";
import { OrbEffect } from "@/components/OrbEffect";
import { getQueryFn } from "@/lib/query-client";

const CATEGORIES = ["All", "Tips", "Course Spotlights", "Equipment", "News", "Fitness", "Strategy"];

const CATEGORY_ICONS: Record<string, string> = {
  "All": "grid-outline",
  "Tips": "bulb-outline",
  "Course Spotlights": "flag-outline",
  "Equipment": "construct-outline",
  "News": "newspaper-outline",
  "Fitness": "fitness-outline",
  "Strategy": "map-outline",
};

const PLACEHOLDER_IMAGES = [
  "/course-images/golf_courses_1.jpg",
  "/course-images/golf_green_1.jpg",
  "/course-images/golf_aerial_1.jpg",
  "/course-images/golf_club_1.jpg",
  "/course-images/golf_morning_1.jpg",
];

export default function BlogScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: posts, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/blog"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filtered = (posts || []).filter(
    (p: any) => selectedCategory === "All" || p.category?.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + webTopInset + 10, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <PremiumText variant="label" color={colors.accent}>TRUST GOLF</PremiumText>
            <PremiumText variant="hero" style={{ fontSize: 28 }}>Blog</PremiumText>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginTop: 16, marginBottom: 16 }}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => { setSelectedCategory(cat); Haptics.selectionAsync(); }}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedCategory === cat ? colors.primary : colors.surfaceElevated,
                  borderColor: selectedCategory === cat ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons
                name={(CATEGORY_ICONS[cat] || "document-outline") as any}
                size={14}
                color={selectedCategory === cat ? "#fff" : colors.textSecondary}
              />
              <PremiumText
                variant="caption"
                color={selectedCategory === cat ? "#fff" : colors.textSecondary}
                style={{ fontSize: 12 }}
              >
                {cat}
              </PremiumText>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <PremiumText variant="caption" color={colors.textMuted}>Loading posts...</PremiumText>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
            <PremiumText variant="body" color={colors.textMuted} style={{ marginTop: 12 }}>
              No posts yet
            </PremiumText>
            <PremiumText variant="caption" color={colors.textSecondary} style={{ marginTop: 4, textAlign: "center", paddingHorizontal: 40 }}>
              Blog posts will appear here once published from the developer dashboard.
            </PremiumText>
          </View>
        ) : (
          <View style={{ gap: 16, paddingHorizontal: 16 }}>
            {filtered.map((post: any, index: number) => (
              <Animated.View key={post.id} entering={FadeInDown.delay(index * 80).duration(400)}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); router.push(`/blog-post?slug=${post.slug}`); }}
                >
                  <GlassCard style={{ overflow: "hidden", padding: 0 }}>
                    <OrbEffect color={colors.primary + "15"} size={120} />
                    {(post.coverImage || PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]) && (
                      <Image
                        source={{ uri: post.coverImage || PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length] }}
                        style={{ width: "100%", height: 160 } as any}
                        contentFit="cover"
                      />
                    )}
                    <View style={{ padding: 16, gap: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={[styles.catBadge, { backgroundColor: colors.primary + "20" }]}>
                          <PremiumText variant="caption" color={colors.primary} style={{ fontSize: 10, fontWeight: "700" }}>
                            {(post.category || "general").toUpperCase()}
                          </PremiumText>
                        </View>
                        <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </PremiumText>
                      </View>
                      <PremiumText variant="title" style={{ fontSize: 18, lineHeight: 24 }}>{post.title}</PremiumText>
                      {post.excerpt && (
                        <PremiumText variant="caption" color={colors.textSecondary} style={{ lineHeight: 18 }} numberOfLines={2}>
                          {post.excerpt}
                        </PremiumText>
                      )}
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                        <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 11 }}>
                          By {post.authorName || "Trust Golf"}
                        </PremiumText>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <PremiumText variant="caption" color={colors.primary} style={{ fontSize: 12, fontWeight: "600" }}>Read</PremiumText>
                          <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
