import React, { useState } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, TextInput, Platform, Alert, Linking,
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

  const { data: vendorApps } = useQuery<any[]>({
    queryKey: ["/api/vendor-applications"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: blogPostsData, refetch: refetchBlog } = useQuery<any[]>({
    queryKey: ["/api/blog?status=all"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [blogTopic, setBlogTopic] = useState("");
  const [blogCategory, setBlogCategory] = useState("tips");
  const [blogGenerating, setBlogGenerating] = useState(false);
  const [blogEditId, setBlogEditId] = useState<number | null>(null);
  const [blogEditTitle, setBlogEditTitle] = useState("");
  const [blogEditContent, setBlogEditContent] = useState("");
  const [blogEditExcerpt, setBlogEditExcerpt] = useState("");
  const [blogEditCategory, setBlogEditCategory] = useState("");
  const [blogEditTags, setBlogEditTags] = useState("");

  const [analyticsDays, setAnalyticsDays] = useState(7);

  const { data: analyticsSummary } = useQuery<any>({
    queryKey: ["/api/analytics/summary", `?days=${analyticsDays}`],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000,
  });

  const { data: realtimeData } = useQuery<any>({
    queryKey: ["/api/analytics/realtime"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 10000,
  });

  const { data: topPages } = useQuery<any[]>({
    queryKey: ["/api/analytics/pages", `?days=${analyticsDays}`],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000,
  });

  const { data: deviceData } = useQuery<any[]>({
    queryKey: ["/api/analytics/devices", `?days=${analyticsDays}`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: browserData } = useQuery<any[]>({
    queryKey: ["/api/analytics/browsers", `?days=${analyticsDays}`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: referrerData } = useQuery<any[]>({
    queryKey: ["/api/analytics/referrers", `?days=${analyticsDays}`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: trafficData } = useQuery<any[]>({
    queryKey: ["/api/analytics/traffic", `?days=${analyticsDays}`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: eventData } = useQuery<any[]>({
    queryKey: ["/api/analytics/events", `?days=${analyticsDays}`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const updateVendorStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/vendor-applications/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-applications"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const generateBlogPost = async () => {
    if (!blogTopic.trim()) return;
    setBlogGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/blog/generate", { topic: blogTopic, category: blogCategory });
      const generated = await res.json();
      const saveRes = await apiRequest("POST", "/api/blog", {
        ...generated,
        category: generated.category || blogCategory,
        status: "draft",
        authorName: "Trust Golf",
      });
      setBlogTopic("");
      refetchBlog();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Draft Created", "AI-generated blog post saved as draft. Review and publish from below.");
    } catch (err: any) {
      Alert.alert("Error", "Failed to generate blog post");
    } finally {
      setBlogGenerating(false);
    }
  };

  const publishBlogPost = async (id: number) => {
    await apiRequest("PATCH", `/api/blog/${id}`, { status: "published" });
    refetchBlog();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const unpublishBlogPost = async (id: number) => {
    await apiRequest("PATCH", `/api/blog/${id}`, { status: "draft" });
    refetchBlog();
  };

  const deleteBlogPost = async (id: number) => {
    Alert.alert("Delete Post", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await apiRequest("DELETE", `/api/blog/${id}`);
        refetchBlog();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }},
    ]);
  };

  const saveBlogEdit = async () => {
    if (blogEditId === null) return;
    await apiRequest("PATCH", `/api/blog/${blogEditId}`, {
      title: blogEditTitle, content: blogEditContent, excerpt: blogEditExcerpt,
      category: blogEditCategory, tags: blogEditTags,
    });
    setBlogEditId(null);
    refetchBlog();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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
          <Pressable onPress={() => router.replace("/(tabs)")} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, paddingLeft: 8 }}>
            <PremiumText variant="caption" color={colors.textSecondary} style={{ fontWeight: "600" }}>Close</PremiumText>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceElevated, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close" size={18} color={colors.text} />
            </View>
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
          <BentoCell>
            <GlassCard style={{ height: 90 }}>
              <OrbEffect color="#7C4DFF20" size={80} />
              <View style={styles.statItem}>
                <Ionicons name="handshake" size={22} color="#7C4DFF" />
                <PremiumText variant="title">{(vendorApps || []).length}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted}>Vendors</PremiumText>
              </View>
            </GlassCard>
          </BentoCell>
          <BentoCell>
            <GlassCard style={{ height: 90 }}>
              <OrbEffect color="#FF980020" size={80} />
              <View style={styles.statItem}>
                <Ionicons name="newspaper" size={22} color="#FF9800" />
                <PremiumText variant="title">{(blogPostsData || []).length}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted}>Blog Posts</PremiumText>
              </View>
            </GlassCard>
          </BentoCell>
        </BentoRow>

        <BentoRow style={{ marginTop: 8 }}>
          <BentoCell>
            <GlassCard style={{ height: 90 }}>
              <OrbEffect color="#00BCD420" size={80} />
              <View style={styles.statItem}>
                <View style={[styles.kpiDot, { backgroundColor: "#4CAF50" }]} />
                <PremiumText variant="title">{realtimeData?.active ?? 0}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted}>Active Now</PremiumText>
              </View>
            </GlassCard>
          </BentoCell>
          <BentoCell>
            <GlassCard style={{ height: 90 }}>
              <OrbEffect color="#2196F320" size={80} />
              <View style={styles.statItem}>
                <Ionicons name="eye" size={22} color="#2196F3" />
                <PremiumText variant="title">{analyticsSummary?.pageViews ?? 0}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted}>Views ({analyticsDays}d)</PremiumText>
              </View>
            </GlassCard>
          </BentoCell>
          <BentoCell>
            <GlassCard style={{ height: 90 }}>
              <OrbEffect color="#9C27B020" size={80} />
              <View style={styles.statItem}>
                <Ionicons name="people" size={22} color="#9C27B0" />
                <PremiumText variant="title">{analyticsSummary?.uniqueVisitors ?? 0}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted}>Visitors</PremiumText>
              </View>
            </GlassCard>
          </BentoCell>
          <BentoCell>
            <GlassCard style={{ height: 90 }}>
              <OrbEffect color="#FF980020" size={80} />
              <View style={styles.statItem}>
                <Ionicons name="layers" size={22} color="#FF9800" />
                <PremiumText variant="title">{analyticsSummary?.sessions ?? 0}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted}>Sessions</PremiumText>
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
          <AccordionItem title="Analytics Dashboard" icon="analytics-outline" defaultOpen>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 4 }}>
                {[7, 30, 90].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => { setAnalyticsDays(d); Haptics.selectionAsync(); }}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: analyticsDays === d ? colors.primary : colors.surfaceElevated,
                        borderColor: analyticsDays === d ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <PremiumText variant="caption" color={analyticsDays === d ? "#fff" : colors.textSecondary} style={{ fontSize: 11 }}>
                      {d}d
                    </PremiumText>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <View style={[styles.kpiCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={[styles.kpiDot, { backgroundColor: "#4CAF50" }]} />
                  <PremiumText variant="title" style={{ fontSize: 22 }}>{realtimeData?.active ?? 0}</PremiumText>
                  <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Active Now</PremiumText>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Ionicons name="eye-outline" size={16} color={colors.primary} />
                  <PremiumText variant="title" style={{ fontSize: 22 }}>{analyticsSummary?.pageViews ?? 0}</PremiumText>
                  <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Page Views</PremiumText>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Ionicons name="people-outline" size={16} color="#7C4DFF" />
                  <PremiumText variant="title" style={{ fontSize: 22 }}>{analyticsSummary?.uniqueVisitors ?? 0}</PremiumText>
                  <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Visitors</PremiumText>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Ionicons name="layers-outline" size={16} color={colors.accent} />
                  <PremiumText variant="title" style={{ fontSize: 22 }}>{analyticsSummary?.sessions ?? 0}</PremiumText>
                  <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Sessions</PremiumText>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Ionicons name="time-outline" size={16} color="#FF9800" />
                  <PremiumText variant="title" style={{ fontSize: 22 }}>{analyticsSummary?.avgDuration ?? 0}s</PremiumText>
                  <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Avg Duration</PremiumText>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Ionicons name="exit-outline" size={16} color="#B71C1C" />
                  <PremiumText variant="title" style={{ fontSize: 22 }}>{analyticsSummary?.bounceRate ?? 0}%</PremiumText>
                  <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Bounce Rate</PremiumText>
                </View>
              </View>

              {(trafficData || []).length > 0 && (
                <View style={[styles.pitchSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11 }}>DAILY TRAFFIC</PremiumText>
                  {(trafficData || []).slice(-7).map((day: any, i: number) => {
                    const maxViews = Math.max(...(trafficData || []).map((d: any) => Number(d.page_views) || 0), 1);
                    const barWidth = Math.max(((Number(day.page_views) || 0) / maxViews) * 100, 4);
                    return (
                      <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10, width: 46 }}>
                          {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </PremiumText>
                        <View style={{ flex: 1, height: 16, backgroundColor: colors.border + "40", borderRadius: 4, overflow: "hidden" }}>
                          <View style={{ width: `${barWidth}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 4 }} />
                        </View>
                        <PremiumText variant="caption" color={colors.text} style={{ fontSize: 10, width: 28, textAlign: "right" }}>
                          {day.page_views}
                        </PremiumText>
                      </View>
                    );
                  })}
                </View>
              )}

              {(topPages || []).length > 0 && (
                <View style={[styles.pitchSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11 }}>TOP PAGES</PremiumText>
                  {(topPages || []).slice(0, 8).map((page: any, i: number) => (
                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, borderBottomWidth: i < 7 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.border }}>
                      <PremiumText variant="caption" color={colors.text} numberOfLines={1} style={{ flex: 1, fontSize: 12 }}>
                        {page.path}
                      </PremiumText>
                      <PremiumText variant="caption" color={colors.accent} style={{ fontSize: 12, fontWeight: "700", marginLeft: 8 }}>
                        {page.views}
                      </PremiumText>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 8 }}>
                {(deviceData || []).length > 0 && (
                  <View style={[styles.pitchSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, flex: 1 }]}>
                    <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11 }}>DEVICES</PremiumText>
                    {(deviceData || []).map((d: any, i: number) => (
                      <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                        <PremiumText variant="caption" color={colors.text} style={{ fontSize: 11 }}>{d.device}</PremiumText>
                        <PremiumText variant="caption" color={colors.accent} style={{ fontSize: 11, fontWeight: "700" }}>{d.count}</PremiumText>
                      </View>
                    ))}
                  </View>
                )}
                {(browserData || []).length > 0 && (
                  <View style={[styles.pitchSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, flex: 1 }]}>
                    <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11 }}>BROWSERS</PremiumText>
                    {(browserData || []).map((b: any, i: number) => (
                      <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                        <PremiumText variant="caption" color={colors.text} style={{ fontSize: 11 }}>{b.browser}</PremiumText>
                        <PremiumText variant="caption" color={colors.accent} style={{ fontSize: 11, fontWeight: "700" }}>{b.count}</PremiumText>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {(referrerData || []).length > 0 && (
                <View style={[styles.pitchSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11 }}>TOP REFERRERS</PremiumText>
                  {(referrerData || []).map((r: any, i: number) => (
                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                      <PremiumText variant="caption" color={colors.text} numberOfLines={1} style={{ flex: 1, fontSize: 11 }}>{r.referrer}</PremiumText>
                      <PremiumText variant="caption" color={colors.accent} style={{ fontSize: 11, fontWeight: "700", marginLeft: 8 }}>{r.sessions}</PremiumText>
                    </View>
                  ))}
                </View>
              )}

              {(eventData || []).length > 0 && (
                <View style={[styles.pitchSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11 }}>TRACKED EVENTS</PremiumText>
                  {(eventData || []).slice(0, 10).map((e: any, i: number) => (
                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <View style={{ flex: 1 }}>
                        <PremiumText variant="caption" color={colors.text} style={{ fontSize: 11 }}>{e.event_name}</PremiumText>
                        {e.category && <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 9 }}>{e.category}</PremiumText>}
                      </View>
                      <PremiumText variant="caption" color={colors.accent} style={{ fontSize: 11, fontWeight: "700" }}>{e.count}</PremiumText>
                    </View>
                  ))}
                </View>
              )}

              {!(analyticsSummary?.pageViews > 0) && (
                <View style={{ paddingVertical: 12, alignItems: "center" }}>
                  <Ionicons name="pulse-outline" size={28} color={colors.textMuted} />
                  <PremiumText variant="caption" color={colors.textMuted} style={{ marginTop: 6, textAlign: "center" }}>
                    Analytics tracking is active. Data will appear as visitors browse the app.
                  </PremiumText>
                </View>
              )}
            </View>
          </AccordionItem>
        </GlassCard>

        <GlassCard style={{ marginTop: 14 }}>
          <AccordionItem title={`Vendor Applications (${(vendorApps || []).length})`} icon="handshake-outline" defaultOpen>
            {(vendorApps || []).length === 0 ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <Ionicons name="folder-open-outline" size={32} color={colors.textMuted} />
                <PremiumText variant="caption" color={colors.textMuted} style={{ marginTop: 8 }}>
                  No vendor applications yet
                </PremiumText>
                <PremiumText variant="caption" color={colors.textSecondary} style={{ marginTop: 4, textAlign: "center", lineHeight: 16 }}>
                  Share the "Partner With Us" page to start receiving applications
                </PremiumText>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {(vendorApps || []).map((app: any) => {
                  const statusColors: Record<string, string> = { pending: "#FF9800", approved: "#4CAF50", rejected: "#B71C1C" };
                  const tierLabels: Record<string, string> = { free_listing: "Free", featured: "Featured", premium: "Premium" };
                  const typeLabels: Record<string, string> = { course: "Course", pro_shop: "Pro Shop", driving_range: "Range", retail: "Retail", other: "Other" };
                  return (
                    <View key={app.id} style={[styles.vendorCard, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1 }}>
                          <PremiumText variant="body" style={{ fontWeight: "700", fontSize: 14 }}>{app.businessName}</PremiumText>
                          <PremiumText variant="caption" color={colors.textSecondary}>
                            {app.contactName} — {app.email}
                          </PremiumText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: (statusColors[app.status] || "#999") + "20" }]}>
                          <PremiumText variant="caption" color={statusColors[app.status] || "#999"} style={{ fontSize: 10, fontWeight: "700" }}>
                            {app.status.toUpperCase()}
                          </PremiumText>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                        <View style={[styles.tagPill, { backgroundColor: colors.primary + "15" }]}>
                          <PremiumText variant="caption" color={colors.primary} style={{ fontSize: 10 }}>{typeLabels[app.businessType] || app.businessType}</PremiumText>
                        </View>
                        <View style={[styles.tagPill, { backgroundColor: colors.accent + "15" }]}>
                          <PremiumText variant="caption" color={colors.accent} style={{ fontSize: 10 }}>{tierLabels[app.partnershipTier] || app.partnershipTier}</PremiumText>
                        </View>
                        {app.location && (
                          <View style={[styles.tagPill, { backgroundColor: colors.textMuted + "15" }]}>
                            <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>{app.location}</PremiumText>
                          </View>
                        )}
                      </View>
                      {app.phone && (
                        <PremiumText variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                          {app.phone}
                        </PremiumText>
                      )}
                      {app.message && (
                        <PremiumText variant="caption" color={colors.textSecondary} style={{ marginTop: 6, lineHeight: 16, fontStyle: "italic" }}>
                          "{app.message}"
                        </PremiumText>
                      )}
                      <PremiumText variant="caption" color={colors.textMuted} style={{ marginTop: 4, fontSize: 10 }}>
                        {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </PremiumText>
                      {app.status === "pending" && (
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                          <Pressable
                            onPress={() => updateVendorStatus.mutate({ id: app.id, status: "approved" })}
                            style={[styles.actionBtn, { backgroundColor: "#4CAF5015", borderColor: "#4CAF50" }]}
                          >
                            <Ionicons name="checkmark" size={14} color="#4CAF50" />
                            <PremiumText variant="caption" color="#4CAF50" style={{ fontWeight: "700" }}>Approve</PremiumText>
                          </Pressable>
                          <Pressable
                            onPress={() => updateVendorStatus.mutate({ id: app.id, status: "rejected" })}
                            style={[styles.actionBtn, { backgroundColor: "#B71C1C10", borderColor: "#B71C1C" }]}
                          >
                            <Ionicons name="close" size={14} color="#B71C1C" />
                            <PremiumText variant="caption" color="#B71C1C" style={{ fontWeight: "700" }}>Reject</PremiumText>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </AccordionItem>
        </GlassCard>

        <GlassCard style={{ marginTop: 14 }}>
          <AccordionItem title={`Blog Management (${(blogPostsData || []).length})`} icon="newspaper-outline" defaultOpen>
            <View style={{ gap: 12 }}>
              <PremiumText variant="caption" color={colors.textSecondary} style={{ lineHeight: 18 }}>
                Generate SEO-optimized blog posts with AI or create them manually. Posts appear on the public Blog page.
              </PremiumText>

              <View style={[styles.genBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <PremiumText variant="body" style={{ fontWeight: "700", fontSize: 13, marginBottom: 8 }}>AI Blog Generator</PremiumText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={blogTopic}
                  onChangeText={setBlogTopic}
                  placeholder="Topic (e.g., 'Best putting drills for beginners')"
                  placeholderTextColor={colors.textMuted}
                />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  {["tips", "course spotlights", "equipment", "news", "fitness", "strategy"].map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setBlogCategory(cat)}
                      style={[styles.catChip, {
                        backgroundColor: blogCategory === cat ? colors.primary : "transparent",
                        borderColor: blogCategory === cat ? colors.primary : colors.border,
                      }]}
                    >
                      <PremiumText variant="caption" color={blogCategory === cat ? "#fff" : colors.textSecondary} style={{ fontSize: 10 }}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </PremiumText>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={generateBlogPost}
                  disabled={blogGenerating || !blogTopic.trim()}
                  style={[styles.genBtn, { backgroundColor: blogGenerating ? colors.textMuted : colors.primary, opacity: !blogTopic.trim() ? 0.5 : 1 }]}
                >
                  <Ionicons name={blogGenerating ? "hourglass" : "sparkles"} size={16} color="#fff" />
                  <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 13 }}>
                    {blogGenerating ? "Generating..." : "Generate Draft"}
                  </PremiumText>
                </Pressable>
              </View>

              {blogEditId !== null && (
                <View style={[styles.genBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <PremiumText variant="body" style={{ fontWeight: "700", fontSize: 13 }}>Editing Post</PremiumText>
                    <Pressable onPress={() => setBlogEditId(null)}>
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                  <FieldInput label="Title" value={blogEditTitle} onChangeText={setBlogEditTitle} colors={colors} />
                  <FieldInput label="Excerpt" value={blogEditExcerpt} onChangeText={setBlogEditExcerpt} colors={colors} style={{ marginTop: 8 }} />
                  <FieldInput label="Category" value={blogEditCategory} onChangeText={setBlogEditCategory} colors={colors} style={{ marginTop: 8 }} />
                  <FieldInput label="Tags (comma-separated)" value={blogEditTags} onChangeText={setBlogEditTags} colors={colors} style={{ marginTop: 8 }} />
                  <FieldInput label="Content (Markdown)" value={blogEditContent} onChangeText={setBlogEditContent} colors={colors} multiline style={{ marginTop: 8 }} />
                  <Pressable onPress={saveBlogEdit} style={[styles.genBtn, { backgroundColor: colors.accent, marginTop: 8 }]}>
                    <Ionicons name="save" size={16} color="#fff" />
                    <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 13 }}>Save Changes</PremiumText>
                  </Pressable>
                </View>
              )}

              {(blogPostsData || []).length === 0 ? (
                <View style={{ paddingVertical: 16, alignItems: "center" }}>
                  <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
                  <PremiumText variant="caption" color={colors.textMuted} style={{ marginTop: 8 }}>No blog posts yet</PremiumText>
                  <PremiumText variant="caption" color={colors.textSecondary} style={{ marginTop: 4, textAlign: "center", lineHeight: 16 }}>
                    Use the AI generator above to create your first post
                  </PremiumText>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {(blogPostsData || []).map((post: any) => {
                    const isPublished = post.status === "published";
                    return (
                      <View key={post.id} style={[styles.vendorCard, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <View style={{ flex: 1 }}>
                            <PremiumText variant="body" style={{ fontWeight: "700", fontSize: 14 }} numberOfLines={2}>{post.title}</PremiumText>
                            {post.excerpt && (
                              <PremiumText variant="caption" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
                                {post.excerpt}
                              </PremiumText>
                            )}
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: isPublished ? "#4CAF5020" : "#FF980020" }]}>
                            <PremiumText variant="caption" color={isPublished ? "#4CAF50" : "#FF9800"} style={{ fontSize: 10, fontWeight: "700" }}>
                              {post.status.toUpperCase()}
                            </PremiumText>
                          </View>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                          <View style={[styles.tagPill, { backgroundColor: colors.primary + "15" }]}>
                            <PremiumText variant="caption" color={colors.primary} style={{ fontSize: 10 }}>{post.category}</PremiumText>
                          </View>
                          <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>
                            {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </PremiumText>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                          <Pressable
                            onPress={() => {
                              setBlogEditId(post.id);
                              setBlogEditTitle(post.title);
                              setBlogEditContent(post.content);
                              setBlogEditExcerpt(post.excerpt || "");
                              setBlogEditCategory(post.category || "");
                              setBlogEditTags(post.tags || "");
                            }}
                            style={[styles.actionBtn, { backgroundColor: "#2196F310", borderColor: "#2196F3" }]}
                          >
                            <Ionicons name="create" size={14} color="#2196F3" />
                            <PremiumText variant="caption" color="#2196F3" style={{ fontWeight: "700" }}>Edit</PremiumText>
                          </Pressable>
                          {isPublished ? (
                            <Pressable
                              onPress={() => unpublishBlogPost(post.id)}
                              style={[styles.actionBtn, { backgroundColor: "#FF980010", borderColor: "#FF9800" }]}
                            >
                              <Ionicons name="eye-off" size={14} color="#FF9800" />
                              <PremiumText variant="caption" color="#FF9800" style={{ fontWeight: "700" }}>Unpublish</PremiumText>
                            </Pressable>
                          ) : (
                            <Pressable
                              onPress={() => publishBlogPost(post.id)}
                              style={[styles.actionBtn, { backgroundColor: "#4CAF5015", borderColor: "#4CAF50" }]}
                            >
                              <Ionicons name="globe" size={14} color="#4CAF50" />
                              <PremiumText variant="caption" color="#4CAF50" style={{ fontWeight: "700" }}>Publish</PremiumText>
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() => deleteBlogPost(post.id)}
                            style={[styles.actionBtn, { backgroundColor: "#B71C1C10", borderColor: "#B71C1C" }]}
                          >
                            <Ionicons name="trash" size={14} color="#B71C1C" />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </AccordionItem>
        </GlassCard>

        <GlassCard style={{ marginTop: 14 }}>
          <AccordionItem title="Golf Affiliate Programs" icon="link-outline">
            <View style={{ gap: 12 }}>
              <PremiumText variant="caption" color={colors.textSecondary} style={{ lineHeight: 18 }}>
                Register for these affiliate programs to monetize Trust Golf through commissions on equipment, tee times, and memberships.
              </PremiumText>
              {[
                { name: "Golf Galaxy / Dick's Sporting Goods", url: "https://www.dickssportinggoods.com/s/affiliate-program", category: "Equipment & Gear", commission: "5-7% per sale" },
                { name: "TaylorMade Golf", url: "https://www.taylormadegolf.com/affiliate-program.html", category: "Clubs & Equipment", commission: "5-8% per sale" },
                { name: "Callaway Golf", url: "https://www.callawaygolf.com/affiliate", category: "Clubs & Equipment", commission: "6-8% per sale" },
                { name: "GlobalGolf / 3Balls", url: "https://www.globalgolf.com/affiliate/", category: "Used Clubs & Deals", commission: "5-9% per sale" },
                { name: "Rain or Shine Golf", url: "https://www.rainorshinegolf.com/affiliate", category: "Golf Simulators", commission: "3-5% per sale" },
                { name: "GolfNow / NBC Sports", url: "https://www.golfnow.com/affiliates", category: "Tee Time Booking", commission: "$1-3 per booking" },
                { name: "Ship Sticks", url: "https://www.shipsticks.com/affiliates", category: "Club Shipping", commission: "10-15% per order" },
                { name: "Titleist / Acushnet", url: "https://www.titleist.com", category: "Premium Equipment", commission: "Apply via CJ Affiliate" },
                { name: "PGA Tour Superstore", url: "https://www.pgatoursuperstore.com/affiliate-program.html", category: "Full-Service Retail", commission: "4-6% per sale" },
                { name: "Golfbreaks", url: "https://www.golfbreaks.com/affiliates/", category: "Golf Travel & Trips", commission: "3-5% per booking" },
                { name: "Sunday Golf", url: "https://www.sundaygolf.com/affiliate", category: "Lightweight Bags", commission: "8-10% per sale" },
                { name: "Vice Golf", url: "https://www.vicegolf.com", category: "Golf Balls", commission: "Apply via Impact" },
                { name: "Arccos Golf", url: "https://www.arccosgolf.com", category: "Smart Sensors & Analytics", commission: "Apply direct" },
                { name: "Amazon Associates", url: "https://affiliate-program.amazon.com", category: "Everything Golf", commission: "1-4% per sale" },
              ].map((aff, i) => (
                <Pressable
                  key={i}
                  onPress={() => Linking.openURL(aff.url)}
                  style={[styles.listItem, { borderBottomColor: colors.border }]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="open-outline" size={14} color={colors.primary} />
                    <PremiumText variant="body" numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>{aff.name}</PremiumText>
                  </View>
                  <PremiumText variant="caption" color={colors.textMuted}>
                    {aff.category} | {aff.commission}
                  </PremiumText>
                </Pressable>
              ))}
            </View>
          </AccordionItem>

          <AccordionItem title="Course Partnership Pitch Guide" icon="business-outline">
            <View style={{ gap: 14 }}>
              <PremiumText variant="caption" color={colors.textSecondary} style={{ lineHeight: 18 }}>
                Use this guide when approaching golf courses about partnering with Trust Golf.
              </PremiumText>

              <View style={[styles.pitchSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11 }}>ELEVATOR PITCH</PremiumText>
                <PremiumText variant="caption" color={colors.text} style={{ lineHeight: 18 }}>
                  Trust Golf is a premium mobile app connecting golfers with courses through AI-powered swing analysis, score tracking, and exclusive deals. We drive new players to your course through featured listings, promotional deals, and our growing user base — at zero upfront cost.
                </PremiumText>
              </View>

              <View style={[styles.pitchSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11 }}>WHAT YOU OFFER COURSES</PremiumText>
                {[
                  "Featured course listing with photos, details, and amenities",
                  "Promotional deals that drive bookings during slow periods",
                  "AI swing analysis tied to their course — players come back to improve",
                  "Handicap tracking that references course slope/rating — brand presence",
                  "Future tee time booking integration — direct revenue channel",
                  "Analytics dashboard showing impressions, clicks, and bookings (coming)",
                ].map((item, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                    <PremiumText variant="caption" color={colors.text} style={{ flex: 1, lineHeight: 18 }}>{item}</PremiumText>
                  </View>
                ))}
              </View>

              <View style={[styles.pitchSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11 }}>PARTNERSHIP TIERS</PremiumText>
                {[
                  { tier: "Free Listing", desc: "Basic course profile with contact info and photos" },
                  { tier: "Featured Partner", desc: "Priority placement, promotional deal slots, branded AI tips" },
                  { tier: "Premium Partner", desc: "Tee time booking integration, analytics, dedicated support, co-branded experiences" },
                ].map((t, i) => (
                  <View key={i} style={{ marginTop: 8 }}>
                    <PremiumText variant="body" style={{ fontSize: 13, fontWeight: "700" }}>{t.tier}</PremiumText>
                    <PremiumText variant="caption" color={colors.textSecondary} style={{ lineHeight: 16 }}>{t.desc}</PremiumText>
                  </View>
                ))}
              </View>

              <View style={[styles.pitchSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <PremiumText variant="label" color={colors.primary} style={{ fontSize: 11 }}>TALKING POINTS</PremiumText>
                {[
                  "No upfront cost — we grow together",
                  "Part of the DarkWave Trust Layer ecosystem (30+ connected apps)",
                  "Cross-platform: iOS, Android, and Web (PWA)",
                  "AI-powered — not just another booking app",
                  "Local focus: Middle TN courses get priority featuring",
                  "Built-in handicap system drives repeat engagement",
                ].map((point, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                    <Ionicons name="arrow-forward-circle" size={14} color={colors.accent} style={{ marginTop: 2 }} />
                    <PremiumText variant="caption" color={colors.text} style={{ flex: 1, lineHeight: 18 }}>{point}</PremiumText>
                  </View>
                ))}
              </View>
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
  pitchSection: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  kpiCard: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  kpiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vendorCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  genBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  genBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 10,
    marginTop: 12,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
});
