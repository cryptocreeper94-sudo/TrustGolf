import React, { useState } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, TextInput, Platform, FlatList,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { PremiumText } from "@/components/PremiumText";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { getQueryFn } from "@/lib/query-client";

export default function CoursesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: courses, isLoading } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const filtered = (courses || []).filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  const renderCourse = ({ item: course }: { item: any }) => (
    <GlassCard
      noPadding
      style={styles.courseCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/course/[id]", params: { id: String(course.id) } });
      }}
    >
      <Image source={{ uri: course.imageUrl }} style={styles.courseImage} contentFit="cover" />
      <View style={styles.courseInfo}>
        <PremiumText variant="subtitle" numberOfLines={1}>{course.name}</PremiumText>
        <View style={styles.courseRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <PremiumText variant="caption" color={colors.textSecondary}>{course.city}, {course.state}</PremiumText>
        </View>
        <View style={styles.courseRow}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <PremiumText variant="caption">{course.rating}</PremiumText>
          </View>
          <PremiumText variant="caption" color={colors.textMuted}>{course.holes} holes  |  Par {course.par}</PremiumText>
          <View style={{ flex: 1 }} />
          <PremiumText variant="subtitle" style={{ color: colors.primary }}>${course.greenFee}</PremiumText>
        </View>
      </View>
    </GlassCard>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
        <PremiumText variant="hero">Courses</PremiumText>
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search courses..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ padding: 16 }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderCourse}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={filtered.length > 0}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="golf-outline" size={48} color={colors.textMuted} />
              <PremiumText variant="body" color={colors.textMuted}>No courses found</PremiumText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 100 },
  courseCard: { overflow: "hidden" },
  courseImage: { width: "100%", height: 140, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  courseInfo: { padding: 14, gap: 6 },
  courseRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
});
