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

function FieldInput({
  label, value, onChangeText, placeholder, colors, multiline, keyboardType, maxLength, autoCapitalize, style,
}: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  colors: any; multiline?: boolean; keyboardType?: any; maxLength?: number; autoCapitalize?: any; style?: any;
}) {
  return (
    <View style={style}>
      <PremiumText variant="caption" color={colors.textMuted} style={{ marginBottom: 4, fontSize: 11 }}>{label}</PremiumText>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border },
          multiline && { height: 100, textAlignVertical: "top", paddingTop: 10 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const COURSE_TYPES = ["Public", "Private", "Resort", "Municipal"];

export default function DeveloperDashboard() {
  const { colors, isDark } = useTheme();
  const { isDeveloper } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [cName, setCName] = useState("");
  const [cLocation, setCLocation] = useState("");
  const [cCity, setCCity] = useState("");
  const [cState, setCState] = useState("");
  const [cFee, setCFee] = useState("");
  const [cPar, setCPar] = useState("72");
  const [cHoles, setCHoles] = useState("18");
  const [cYardage, setCYardage] = useState("");
  const [cSlope, setCSlope] = useState("");
  const [cRating, setCRating] = useState("");
  const [cType, setCType] = useState("Public");
  const [cDesigner, setCDesigner] = useState("");
  const [cYearBuilt, setCYearBuilt] = useState("");
  const [cDescription, setCDescription] = useState("");
  const [cAmenities, setCAmenities] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cWebsite, setCWebsite] = useState("");
  const [cImageUrl, setCImageUrl] = useState("");

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

  const resetCourseForm = () => {
    setCName(""); setCLocation(""); setCCity(""); setCState(""); setCFee("");
    setCPar("72"); setCHoles("18"); setCYardage(""); setCSlope(""); setCRating("");
    setCType("Public"); setCDesigner(""); setCYearBuilt(""); setCDescription("");
    setCAmenities(""); setCPhone(""); setCWebsite(""); setCImageUrl("");
  };

  const addCourse = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/courses", {
        name: cName.trim(),
        location: cLocation.trim() || cCity.trim(),
        city: cCity.trim(),
        state: cState.trim().toUpperCase(),
        greenFee: parseInt(cFee) || 50,
        holes: parseInt(cHoles) || 18,
        par: parseInt(cPar) || 72,
        yardage: parseInt(cYardage) || 6500,
        slope: parseInt(cSlope) || 113,
        rating: parseFloat(cRating) || 4.0,
        courseType: cType,
        designer: cDesigner.trim() || null,
        yearBuilt: parseInt(cYearBuilt) || null,
        description: cDescription.trim() || null,
        amenities: cAmenities.trim() || null,
        phone: cPhone.trim() || null,
        website: cWebsite.trim() || null,
        imageUrl: cImageUrl.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      resetCourseForm();
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
      setNewDealCourse(""); setNewDealTitle(""); setNewDealDesc("");
      setNewDealOriginal(""); setNewDealPrice("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  if (!isDeveloper) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="lock-closed" size={48} color={colors.textMuted} />
        <PremiumText variant="body" color={colors.textMuted} style={{ marginTop: 12 }}>Developer access required</PremiumText>
        <Pressable onPress={() => router.replace("/")} style={{ marginTop: 20 }}>
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
        keyboardShouldPersistTaps="handled"
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
            <View style={{ gap: 10 }}>
              <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11, marginBottom: -4 }}>BASIC INFO</PremiumText>
              <FieldInput label="Course Name *" value={cName} onChangeText={setCName} colors={colors} />
              <FieldInput label="Street Address" value={cLocation} onChangeText={setCLocation} placeholder="123 Fairway Dr" colors={colors} />
              <View style={styles.row}>
                <FieldInput label="City *" value={cCity} onChangeText={setCCity} colors={colors} style={{ flex: 1 }} />
                <FieldInput label="State *" value={cState} onChangeText={setCState} placeholder="GA" colors={colors} maxLength={2} autoCapitalize="characters" style={{ width: 70 }} />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <PremiumText variant="caption" color={colors.textMuted} style={{ marginBottom: 4, fontSize: 11 }}>Course Type</PremiumText>
                  <View style={styles.typeRow}>
                    {COURSE_TYPES.map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => { setCType(t); Haptics.selectionAsync(); }}
                        style={[
                          styles.typeChip,
                          {
                            backgroundColor: cType === t ? colors.primary : colors.surfaceElevated,
                            borderColor: cType === t ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <PremiumText variant="caption" color={cType === t ? "#fff" : colors.textSecondary} style={{ fontSize: 11 }}>
                          {t}
                        </PremiumText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11, marginBottom: -4 }}>COURSE DETAILS</PremiumText>

              <View style={styles.row}>
                <FieldInput label="Par" value={cPar} onChangeText={setCPar} colors={colors} keyboardType="number-pad" style={{ flex: 1 }} />
                <FieldInput label="Holes" value={cHoles} onChangeText={setCHoles} colors={colors} keyboardType="number-pad" style={{ flex: 1 }} />
                <FieldInput label="Yardage" value={cYardage} onChangeText={setCYardage} placeholder="6500" colors={colors} keyboardType="number-pad" style={{ flex: 1 }} />
              </View>
              <View style={styles.row}>
                <FieldInput label="Slope" value={cSlope} onChangeText={setCSlope} placeholder="113" colors={colors} keyboardType="number-pad" style={{ flex: 1 }} />
                <FieldInput label="Rating (1-5)" value={cRating} onChangeText={setCRating} placeholder="4.0" colors={colors} keyboardType="decimal-pad" style={{ flex: 1 }} />
                <FieldInput label="Green Fee ($)" value={cFee} onChangeText={setCFee} placeholder="50" colors={colors} keyboardType="number-pad" style={{ flex: 1 }} />
              </View>

              <View style={styles.row}>
                <FieldInput label="Designer" value={cDesigner} onChangeText={setCDesigner} placeholder="Pete Dye" colors={colors} style={{ flex: 1 }} />
                <FieldInput label="Year Built" value={cYearBuilt} onChangeText={setCYearBuilt} placeholder="1990" colors={colors} keyboardType="number-pad" style={{ width: 90 }} />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11, marginBottom: -4 }}>DESCRIPTION & AMENITIES</PremiumText>

              <FieldInput
                label="Description"
                value={cDescription}
                onChangeText={setCDescription}
                placeholder="Write a detailed description of the course — history, notable holes, what makes it special..."
                colors={colors}
                multiline
              />
              <FieldInput
                label="Amenities (comma separated)"
                value={cAmenities}
                onChangeText={setCAmenities}
                placeholder="Pro Shop, Restaurant, Practice Range, Clubhouse"
                colors={colors}
              />

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11, marginBottom: -4 }}>CONTACT & MEDIA</PremiumText>

              <View style={styles.row}>
                <FieldInput label="Phone" value={cPhone} onChangeText={setCPhone} placeholder="(555) 123-4567" colors={colors} keyboardType="phone-pad" style={{ flex: 1 }} />
              </View>
              <FieldInput label="Website" value={cWebsite} onChangeText={setCWebsite} placeholder="https://..." colors={colors} />
              <FieldInput label="Image URL" value={cImageUrl} onChangeText={setCImageUrl} placeholder="https://images.unsplash.com/..." colors={colors} />
              <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10, marginTop: -4 }}>
                Tip: Use Unsplash URLs for high-quality golf course photos
              </PremiumText>

              <Pressable
                onPress={() => addCourse.mutate()}
                disabled={!cName.trim() || !cCity.trim() || !cState.trim() || addCourse.isPending}
                style={[
                  styles.addBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: cName.trim() && cCity.trim() && cState.trim() ? 1 : 0.4,
                  },
                ]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <PremiumText variant="body" color="#fff">
                  {addCourse.isPending ? "Adding Course..." : "Add Course to Catalog"}
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
          <AccordionItem title={`Course Catalog (${(courses || []).length})`} icon="list-outline">
            {(courses || []).map((c: any) => (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/course/${c.id}`)}
                style={[styles.listItem, { borderBottomColor: colors.border }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {c.courseType && (
                    <View style={[
                      styles.miniTypeBadge,
                      {
                        backgroundColor:
                          c.courseType === "Private" ? "#B71C1C20" :
                          c.courseType === "Resort" ? "#1565C020" : "#1B5E2020",
                      },
                    ]}>
                      <PremiumText variant="caption" style={{ fontSize: 9 }} color={
                        c.courseType === "Private" ? "#B71C1C" :
                        c.courseType === "Resort" ? "#1565C0" : "#1B5E20"
                      }>
                        {c.courseType.toUpperCase()}
                      </PremiumText>
                    </View>
                  )}
                  <PremiumText variant="body" numberOfLines={1} style={{ flex: 1 }}>{c.name}</PremiumText>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </View>
                <PremiumText variant="caption" color={colors.textMuted}>
                  {c.city}, {c.state} {c.greenFee > 0 ? `| $${c.greenFee}` : "| Private"} {c.designer ? `| ${c.designer}` : ""}
                </PremiumText>
              </Pressable>
            ))}
          </AccordionItem>

          <AccordionItem title={`Active Deals (${(deals || []).length})`} icon="list-outline">
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
  typeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  divider: { height: 1, marginVertical: 6 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 12,
    marginTop: 6,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  miniTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
