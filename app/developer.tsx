import React, { useState } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, TextInput, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { BentoRow, BentoCell } from "@/components/BentoGrid";
import { AccordionItem } from "@/components/AccordionItem";
import { PremiumText } from "@/components/PremiumText";
import { OrbEffect } from "@/components/OrbEffect";
import { apiRequest, getQueryFn } from "@/lib/query-client";

export default function DeveloperDashboard() {
  const { colors } = useTheme();
  const { isDeveloper } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCity, setNewCourseCity] = useState("");
  const [newCourseState, setNewCourseState] = useState("");
  const [newCourseFee, setNewCourseFee] = useState("");

  const [newDealCourse, setNewDealCourse] = useState("");
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealDesc, setNewDealDesc] = useState("");
  const [newDealOriginal, setNewDealOriginal] = useState("");
  const [newDealPrice, setNewDealPrice] = useState("");

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: deals } = useQuery<any[]>({
    queryKey: ["/api/deals"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const addCourse = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/courses", {
        name: newCourseName.trim(),
        location: "",
        city: newCourseCity.trim(),
        state: newCourseState.trim(),
        greenFee: parseInt(newCourseFee) || 50,
        holes: 18,
        par: 72,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setNewCourseName("");
      setNewCourseCity("");
      setNewCourseState("");
      setNewCourseFee("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const addDeal = useMutation({
    mutationFn: async () => {
      const orig = parseInt(newDealOriginal) || 100;
      const price = parseInt(newDealPrice) || 50;
      const discount = Math.round(((orig - price) / orig) * 100);
      await apiRequest("POST", "/api/deals", {
        courseName: newDealCourse.trim(),
        title: newDealTitle.trim(),
        description: newDealDesc.trim(),
        originalPrice: orig,
        dealPrice: price,
        discountPercent: discount,
        isHot: discount > 30,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setNewDealCourse("");
      setNewDealTitle("");
      setNewDealDesc("");
      setNewDealOriginal("");
      setNewDealPrice("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  if (!isDeveloper) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="lock-closed" size={48} color={colors.textMuted} />
        <PremiumText variant="body" color={colors.textMuted} style={{ marginTop: 12 }}>Developer access required</PremiumText>
        <Pressable onPress={() => router.replace("/")} style={[styles.backLink, { marginTop: 20 }]}>
          <PremiumText variant="body" color={colors.primary}>Go Back</PremiumText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + webTopInset + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <PremiumText variant="label" color={colors.accent}>DEVELOPER</PremiumText>
            <PremiumText variant="hero">Dashboard</PremiumText>
          </View>
          <Pressable onPress={() => router.replace("/(tabs)")}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <BentoRow style={{ marginTop: 16 }}>
          <BentoCell>
            <GlassCard style={{ height: 90 }}>
              <OrbEffect color={colors.primary + "20"} size={80} />
              <View style={styles.statItem}>
                <Ionicons name="golf" size={22} color={colors.primary} />
                <PremiumText variant="title">{(courses || []).length}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted}>Courses</PremiumText>
              </View>
            </GlassCard>
          </BentoCell>
          <BentoCell>
            <GlassCard style={{ height: 90 }}>
              <OrbEffect color={colors.accent + "20"} size={80} />
              <View style={styles.statItem}>
                <Ionicons name="pricetag" size={22} color={colors.accent} />
                <PremiumText variant="title">{(deals || []).length}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted}>Deals</PremiumText>
              </View>
            </GlassCard>
          </BentoCell>
          <BentoCell>
            <GlassCard style={{ height: 90 }}>
              <OrbEffect color={colors.success + "20"} size={80} />
              <View style={styles.statItem}>
                <Ionicons name="flame" size={22} color={colors.error} />
                <PremiumText variant="title">{(deals || []).filter((d: any) => d.isHot).length}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted}>Hot Deals</PremiumText>
              </View>
            </GlassCard>
          </BentoCell>
        </BentoRow>

        <GlassCard style={{ marginTop: 16 }}>
          <AccordionItem title="Add Course" icon="add-circle-outline" defaultOpen>
            <View style={{ gap: 8 }}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={newCourseName}
                onChangeText={setNewCourseName}
                placeholder="Course Name"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={newCourseCity}
                  onChangeText={setNewCourseCity}
                  placeholder="City"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[styles.input, { width: 60, backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={newCourseState}
                  onChangeText={setNewCourseState}
                  placeholder="ST"
                  placeholderTextColor={colors.textMuted}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={newCourseFee}
                onChangeText={setNewCourseFee}
                placeholder="Green Fee ($)"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
              <Pressable
                onPress={() => addCourse.mutate()}
                disabled={!newCourseName.trim() || addCourse.isPending}
                style={[styles.addBtn, { backgroundColor: colors.primary, opacity: newCourseName.trim() ? 1 : 0.4 }]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <PremiumText variant="body" color="#fff">
                  {addCourse.isPending ? "Adding..." : "Add Course"}
                </PremiumText>
              </Pressable>
            </View>
          </AccordionItem>

          <AccordionItem title="Add Deal" icon="pricetag-outline">
            <View style={{ gap: 8 }}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={newDealCourse}
                onChangeText={setNewDealCourse}
                placeholder="Course Name"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={newDealTitle}
                onChangeText={setNewDealTitle}
                placeholder="Deal Title"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={newDealDesc}
                onChangeText={setNewDealDesc}
                placeholder="Description"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={newDealOriginal}
                  onChangeText={setNewDealOriginal}
                  placeholder="Original $"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={newDealPrice}
                  onChangeText={setNewDealPrice}
                  placeholder="Deal $"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
              <Pressable
                onPress={() => addDeal.mutate()}
                disabled={!newDealCourse.trim() || !newDealTitle.trim() || addDeal.isPending}
                style={[styles.addBtn, { backgroundColor: colors.accent, opacity: newDealCourse.trim() && newDealTitle.trim() ? 1 : 0.4 }]}
              >
                <Ionicons name="add" size={18} color="#1A1A1A" />
                <PremiumText variant="body" color="#1A1A1A">
                  {addDeal.isPending ? "Adding..." : "Add Deal"}
                </PremiumText>
              </Pressable>
            </View>
          </AccordionItem>
        </GlassCard>

        <GlassCard style={{ marginTop: 14 }}>
          <AccordionItem title={`Existing Courses (${(courses || []).length})`} icon="list-outline">
            {(courses || []).map((c: any) => (
              <View key={c.id} style={[styles.listItem, { borderBottomColor: colors.border }]}>
                <PremiumText variant="body" numberOfLines={1}>{c.name}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted}>{c.city}, {c.state} | ${c.greenFee}</PremiumText>
              </View>
            ))}
          </AccordionItem>

          <AccordionItem title={`Existing Deals (${(deals || []).length})`} icon="list-outline">
            {(deals || []).map((d: any) => (
              <View key={d.id} style={[styles.listItem, { borderBottomColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {d.isHot && <Ionicons name="flame" size={14} color={colors.error} />}
                  <PremiumText variant="body" numberOfLines={1}>{d.title}</PremiumText>
                </View>
                <PremiumText variant="caption" color={colors.textMuted}>
                  {d.courseName} | ${d.dealPrice} ({d.discountPercent}% off)
                </PremiumText>
              </View>
            ))}
          </AccordionItem>
        </GlassCard>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  row: { flexDirection: "row", gap: 8 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 10,
    marginTop: 4,
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  backLink: {},
});
