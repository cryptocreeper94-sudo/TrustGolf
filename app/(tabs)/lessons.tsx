import React, { useState, useCallback } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform,
  Linking, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { PremiumText } from "@/components/PremiumText";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Lesson {
  id: string;
  title: string;
  channel: string;
  videoId: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  description: string;
}

const LESSON_CATEGORIES = [
  { id: "all", label: "All", icon: "grid-outline" as const },
  { id: "driving", label: "Driving", icon: "flash-outline" as const },
  { id: "iron", label: "Irons", icon: "golf-outline" as const },
  { id: "short", label: "Short Game", icon: "flag-outline" as const },
  { id: "putting", label: "Putting", icon: "ellipse-outline" as const },
  { id: "mental", label: "Mental Game", icon: "bulb-outline" as const },
  { id: "fitness", label: "Fitness", icon: "fitness-outline" as const },
];

const CURATED_LESSONS: Lesson[] = [
  // Driving
  { id: "1", title: "The Complete Driver Swing Guide", channel: "Rick Shiels Golf", videoId: "aOJA3oG8vZ8", duration: "18:22", level: "Beginner", category: "driving", description: "Master the fundamentals of driving with a step-by-step breakdown." },
  { id: "2", title: "How To Hit Driver STRAIGHT Every Time", channel: "Danny Maude", videoId: "9JLzSAvYz6A", duration: "15:47", level: "Intermediate", category: "driving", description: "Eliminate your slice and hit fairways consistently." },
  { id: "3", title: "Increase Driver Distance — 3 Simple Tips", channel: "Me and My Golf", videoId: "x4k5Hlt3mhA", duration: "11:33", level: "Intermediate", category: "driving", description: "Add 20+ yards to your drives with these proven techniques." },
  // Irons
  { id: "4", title: "How to Hit Irons Pure EVERY TIME", channel: "Rick Shiels Golf", videoId: "nKhYP3g2k2c", duration: "20:15", level: "Beginner", category: "iron", description: "Learn the correct iron swing mechanics for consistent ball striking." },
  { id: "5", title: "Iron Swing Made SIMPLE — Ball Striking Basics", channel: "ChrisRyanGolf", videoId: "iijVn-3yWw0", duration: "12:08", level: "Beginner", category: "iron", description: "Simplify your iron play with these fundamental drills." },
  { id: "6", title: "Hit Your Irons Like a Pro", channel: "Padraig Harrington", videoId: "HJcG5Azy0Uw", duration: "14:30", level: "Advanced", category: "iron", description: "Major champion Padraig Harrington shares his iron secrets." },
  // Short Game
  { id: "7", title: "Short Game MASTERCLASS — Chips, Pitches & Flops", channel: "Rick Shiels Golf", videoId: "WR6wpLqQ0xo", duration: "25:12", level: "Intermediate", category: "short", description: "Complete short game guide for every situation around the green." },
  { id: "8", title: "How to Chip Like a Pro", channel: "Golf Sidekick", videoId: "W1X6WSQJWBM", duration: "16:44", level: "Beginner", category: "short", description: "The simplest chipping technique that works for every golfer." },
  { id: "9", title: "Phil Mickelson's Flop Shot Secrets", channel: "Phil Mickelson", videoId: "4r8bstmxXM0", duration: "9:58", level: "Advanced", category: "short", description: "Learn the legendary flop shot from the master himself." },
  // Putting
  { id: "10", title: "Putting Fundamentals — Never 3-Putt Again", channel: "Me and My Golf", videoId: "UhPXAVb2yqA", duration: "14:20", level: "Beginner", category: "putting", description: "Master speed control and read greens like a pro." },
  { id: "11", title: "How to Read Greens — Simple Method", channel: "Danny Maude", videoId: "DByM11CZADM", duration: "11:55", level: "Intermediate", category: "putting", description: "A simple framework for reading any green accurately." },
  { id: "12", title: "Putting Drills That Actually Work", channel: "Titleist", videoId: "RY_Gg-hmXc0", duration: "8:30", level: "Intermediate", category: "putting", description: "Practice drills used by tour professionals." },
  // Mental Game
  { id: "13", title: "Golf Mental Game — Play Your Best Under Pressure", channel: "Golf Sidekick", videoId: "7jK7dZK3Zys", duration: "22:10", level: "Intermediate", category: "mental", description: "Course management and mental strategies for lower scores." },
  { id: "14", title: "Pre-Shot Routine That Lowers Your Score", channel: "ChrisRyanGolf", videoId: "ydpWQf0Rv2c", duration: "10:15", level: "Beginner", category: "mental", description: "Build a consistent pre-shot routine for every club." },
  // Fitness
  { id: "15", title: "Golf Fitness — Exercises for More Distance", channel: "Titleist Performance Institute", videoId: "5f-3gJjBEj0", duration: "16:40", level: "Intermediate", category: "fitness", description: "Strengthen your golf muscles for more power and consistency." },
  { id: "16", title: "10-Minute Golf Warm Up Routine", channel: "Me and My Golf", videoId: "3hCnizj_jl0", duration: "10:05", level: "Beginner", category: "fitness", description: "Essential warm-up to prevent injury and improve your first tee shot." },
];

const LEVEL_COLORS = {
  Beginner: "#4CAF50",
  Intermediate: "#FF9800",
  Advanced: "#F44336",
};

export default function LessonsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredLessons = activeCategory === "all"
    ? CURATED_LESSONS
    : CURATED_LESSONS.filter(l => l.category === activeCategory);

  const handleCategoryPress = (catId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(catId);
  };

  const handleLessonPress = (lesson: Lesson) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://www.youtube.com/watch?v=${lesson.videoId}`);
  };

  const thumbnailUrl = (videoId: string) => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const isWideScreen = SCREEN_WIDTH > 768;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: Platform.OS === "web" ? 6 : insets.top + 6 }]}>
        <View style={styles.headerRow}>
          <Ionicons name="play-circle" size={18} color="#fff" />
          <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 16 }}>Golf Lessons</PremiumText>
        </View>
        <PremiumText variant="caption" color="rgba(255,255,255,0.7)" style={{ marginTop: 2, fontSize: 11 }}>
          Curated YouTube instruction from top coaches
        </PremiumText>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {LESSON_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => handleCategoryPress(cat.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: activeCategory === cat.id ? colors.primary : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                  borderColor: activeCategory === cat.id ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={activeCategory === cat.id ? "#fff" : colors.textSecondary}
              />
              <PremiumText
                variant="caption"
                color={activeCategory === cat.id ? "#fff" : colors.text}
                style={{ fontSize: 12, fontWeight: "700" }}
              >
                {cat.label}
              </PremiumText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Results count */}
        <View style={styles.resultsBar}>
          <PremiumText variant="caption" color={colors.textSecondary} style={{ fontSize: 12 }}>
            {filteredLessons.length} lesson{filteredLessons.length !== 1 ? "s" : ""}
          </PremiumText>
        </View>

        {/* Lesson Cards */}
        <View style={[styles.lessonsContainer, isWideScreen && styles.lessonsGrid]}>
          {filteredLessons.map((lesson, index) => (
            <Animated.View
              key={lesson.id}
              entering={FadeInDown.delay(index * 50).duration(350)}
              style={isWideScreen ? styles.gridItem : undefined}
            >
              <GlassCard
                noPadding
                style={styles.lessonCard}
                onPress={() => handleLessonPress(lesson)}
              >
                {/* Thumbnail */}
                <View style={styles.thumbnailWrap}>
                  <View style={[styles.thumbnail, { backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0" }]}>
                    {Platform.OS === "web" ? (
                      <img
                        src={thumbnailUrl(lesson.videoId)}
                        alt={lesson.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderTopLeftRadius: 12, borderTopRightRadius: 12 } as any}
                      />
                    ) : (
                      <View style={{ flex: 1, backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="play-circle" size={48} color={colors.primary} />
                      </View>
                    )}
                  </View>
                  {/* Play button overlay */}
                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={24} color="#fff" />
                    </View>
                  </View>
                  {/* Duration badge */}
                  <View style={styles.durationBadge}>
                    <PremiumText variant="caption" color="#fff" style={{ fontSize: 10, fontWeight: "700" }}>
                      {lesson.duration}
                    </PremiumText>
                  </View>
                </View>

                {/* Info */}
                <View style={styles.lessonInfo}>
                  <PremiumText variant="body" numberOfLines={2} style={{ fontSize: 14, lineHeight: 19, fontWeight: "600" }}>
                    {lesson.title}
                  </PremiumText>
                  <View style={styles.lessonMeta}>
                    <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                    <PremiumText variant="caption" color={colors.textSecondary} style={{ fontSize: 11 }} numberOfLines={1}>
                      {lesson.channel}
                    </PremiumText>
                  </View>
                  <PremiumText variant="caption" color={colors.textMuted} numberOfLines={2} style={{ fontSize: 11, lineHeight: 16, marginTop: 2 }}>
                    {lesson.description}
                  </PremiumText>
                  <View style={styles.lessonTags}>
                    <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[lesson.level] + "18" }]}>
                      <PremiumText variant="caption" color={LEVEL_COLORS[lesson.level]} style={{ fontSize: 9, fontWeight: "800" }}>
                        {lesson.level.toUpperCase()}
                      </PremiumText>
                    </View>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "12" }]}>
                      <PremiumText variant="caption" color={colors.primary} style={{ fontSize: 9, fontWeight: "700" }}>
                        {LESSON_CATEGORIES.find(c => c.id === lesson.category)?.label || lesson.category}
                      </PremiumText>
                    </View>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          ))}
        </View>

        <View style={styles.attribution}>
          <Ionicons name="logo-youtube" size={14} color="#FF0000" />
          <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>
            All lessons link to YouTube • Curated by Trust Golf
          </PremiumText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  resultsBar: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  lessonsContainer: {
    paddingHorizontal: 14,
  },
  lessonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "48%",
  },
  lessonCard: {
    marginBottom: 14,
    overflow: "hidden",
  },
  thumbnailWrap: {
    position: "relative",
    width: "100%",
    height: 190,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lessonInfo: {
    padding: 12,
    gap: 4,
  },
  lessonMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  lessonTags: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  attribution: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 20,
  },
});
