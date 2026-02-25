import React, { useState, useMemo } from "react";
import {
  View, StyleSheet, Pressable, TextInput, Platform, SectionList,
  ScrollView,
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

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", NS: "Nova Scotia",
};

function getStateName(abbr: string): string {
  return STATE_NAMES[abbr] || abbr;
}

export default function CoursesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: courses, isLoading } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const states = useMemo(() => {
    if (!courses) return [];
    const stateSet = new Map<string, number>();
    courses.forEach((c: any) => {
      stateSet.set(c.state, (stateSet.get(c.state) || 0) + 1);
    });
    return Array.from(stateSet.entries())
      .sort((a, b) => getStateName(a[0]).localeCompare(getStateName(b[0])))
      .map(([abbr, count]) => ({ abbr, name: getStateName(abbr), count }));
  }, [courses]);

  const filtered = useMemo(() => {
    let list = courses || [];
    if (selectedState) {
      list = list.filter((c: any) => c.state === selectedState);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c: any) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        getStateName(c.state).toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, selectedState, search]);

  const sections = useMemo(() => {
    const grouped = new Map<string, any[]>();
    filtered.forEach((c: any) => {
      const key = c.state;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(c);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => getStateName(a[0]).localeCompare(getStateName(b[0])))
      .map(([state, data]) => ({
        title: getStateName(state),
        abbr: state,
        data,
      }));
  }, [filtered]);

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

  const renderSectionHeader = ({ section }: { section: { title: string; abbr: string; data: any[] } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <View style={[styles.stateBadge, { backgroundColor: colors.primary + "18" }]}>
        <Ionicons name="flag" size={14} color={colors.primary} />
        <PremiumText variant="subtitle" style={{ color: colors.primary }}>{section.title}</PremiumText>
      </View>
      <PremiumText variant="caption" color={colors.textMuted}>
        {section.data.length} {section.data.length === 1 ? "course" : "courses"}
      </PremiumText>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
        <PremiumText variant="hero">Courses</PremiumText>
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, city, or state..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={(t) => { setSearch(t); if (t) setSelectedState(null); }}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Pressable
            style={[
              styles.chip,
              {
                backgroundColor: !selectedState ? colors.primary : colors.surfaceElevated,
                borderColor: !selectedState ? colors.primary : colors.border,
              },
            ]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedState(null); }}
          >
            <PremiumText
              variant="caption"
              style={{ fontWeight: "700" }}
              color={!selectedState ? "#fff" : colors.text}
            >
              All ({courses?.length || 0})
            </PremiumText>
          </Pressable>
          {states.map((st) => (
            <Pressable
              key={st.abbr}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedState === st.abbr ? colors.primary : colors.surfaceElevated,
                  borderColor: selectedState === st.abbr ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedState(selectedState === st.abbr ? null : st.abbr);
                setSearch("");
              }}
            >
              <PremiumText
                variant="caption"
                style={{ fontWeight: "600" }}
                color={selectedState === st.abbr ? "#fff" : colors.text}
              >
                {st.name} ({st.count})
              </PremiumText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ padding: 16 }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderCourse}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
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
  header: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
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
  chipRow: { gap: 8, paddingVertical: 4, paddingRight: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  stateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 100 },
  courseCard: { overflow: "hidden" },
  courseImage: { width: "100%", height: 140, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  courseInfo: { padding: 14, gap: 6 },
  courseRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
});
