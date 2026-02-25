import React, { useState } from "react";
import {
  View, StyleSheet, Pressable, Platform, ActivityIndicator, ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { OrbEffect } from "@/components/OrbEffect";
import { PremiumText } from "@/components/PremiumText";
import { apiRequest } from "@/lib/query-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Mode = "photo" | "video";

const CLUB_CATEGORIES = [
  {
    id: "driver",
    label: "Driver",
    icon: "rocket-outline" as const,
    color: "#E53935",
    desc: "Full swing, wide arc, upward attack angle",
  },
  {
    id: "fairway-wood",
    label: "Fairway Wood",
    icon: "trending-up-outline" as const,
    color: "#1E88E5",
    desc: "3W, 5W, 7W — sweeping contact off deck or tee",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    icon: "swap-horizontal-outline" as const,
    color: "#7B1FA2",
    desc: "Versatile replacement for long irons",
  },
  {
    id: "long-iron",
    label: "Long Iron",
    icon: "arrow-forward-outline" as const,
    color: "#00897B",
    desc: "3–5 iron — flatter plane, distance focus",
  },
  {
    id: "mid-iron",
    label: "Mid Iron",
    icon: "navigate-outline" as const,
    color: "#2E7D32",
    desc: "6–7 iron — the bread and butter",
  },
  {
    id: "short-iron",
    label: "Short Iron",
    icon: "flag-outline" as const,
    color: "#F57C00",
    desc: "8–9 iron — precision, attacking pins",
  },
  {
    id: "pitching-wedge",
    label: "Pitching Wedge",
    icon: "cellular-outline" as const,
    color: "#C5A55A",
    desc: "Controlled approach shots, 100-130 yards",
  },
  {
    id: "sand-lob-wedge",
    label: "Sand / Lob Wedge",
    icon: "disc-outline" as const,
    color: "#8D6E63",
    desc: "Bunkers, flop shots, finesse around the green",
  },
  {
    id: "putter",
    label: "Putter",
    icon: "ellipse-outline" as const,
    color: "#546E7A",
    desc: "Stroke path, face angle, tempo, distance control",
  },
];

export default function SwingAnalyzerScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("photo");
  const [selectedClub, setSelectedClub] = useState<string | null>(null);

  const pickImage = async (source: "camera" | "library") => {
    try {
      let result;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          setError("Camera permission required");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.7,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setError("");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (result.assets[0].base64) {
          await analyzeSwing(result.assets[0].base64);
        }
      }
    } catch (err: any) {
      setError("Failed to pick image");
    }
  };

  const recordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setError("Camera permission required");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["videos"],
        videoMaxDuration: 15,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({ pathname: "/swing-video", params: { uri: result.assets[0].uri, clubType: selectedClub || "" } });
      }
    } catch (err: any) {
      setError("Failed to record video");
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({ pathname: "/swing-video", params: { uri: result.assets[0].uri, clubType: selectedClub || "" } });
      }
    } catch (err: any) {
      setError("Failed to pick video");
    }
  };

  const analyzeSwing = async (base64: string) => {
    setAnalyzing(true);
    setError("");
    try {
      const res = await apiRequest("POST", "/api/swing-analyze", {
        userId: user?.id || "guest",
        imageBase64: base64,
        clubType: selectedClub || undefined,
      });
      const analysis = await res.json();
      await AsyncStorage.setItem("last_swing_analysis", JSON.stringify(analysis));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/swing-result");
    } catch (err: any) {
      setError("Analysis failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <PremiumText variant="subtitle">Swing Analyzer</PremiumText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + webBottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {analyzing ? (
          <GlassCard style={styles.analyzeCard}>
            <OrbEffect color={colors.primary + "30"} size={180} />
            <View style={styles.analyzingContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <PremiumText variant="title" style={{ textAlign: "center", marginTop: 20 }}>
                Analyzing Your Swing
              </PremiumText>
              <PremiumText variant="body" color={colors.textSecondary} style={{ textAlign: "center", marginTop: 8 }}>
                AI is evaluating your grip, stance, backswing, impact, and follow-through...
              </PremiumText>
            </View>
          </GlassCard>
        ) : imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.preview} contentFit="contain" />
          </View>
        ) : (
          <>
            <GlassCard style={styles.heroCard}>
              <OrbEffect color={colors.primary + "20"} size={150} />
              <View style={styles.heroContent}>
                <View style={[styles.heroIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name="scan" size={36} color={colors.primary} />
                </View>
                <PremiumText variant="title" style={{ textAlign: "center" }}>
                  AI Swing Analysis
                </PremiumText>
                <PremiumText variant="caption" color={colors.textSecondary} style={{ textAlign: "center" }}>
                  Get instant pro-level feedback on your golf swing
                </PremiumText>
              </View>
            </GlassCard>

            <View style={styles.modeToggle}>
              <Pressable
                onPress={() => setMode("photo")}
                style={[
                  styles.modeBtn,
                  mode === "photo" && { backgroundColor: colors.primary },
                  mode !== "photo" && { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
                ]}
              >
                <Ionicons name="camera" size={18} color={mode === "photo" ? "#fff" : colors.text} />
                <PremiumText variant="body" color={mode === "photo" ? "#fff" : colors.text}>Photo</PremiumText>
              </Pressable>
              <Pressable
                onPress={() => setMode("video")}
                style={[
                  styles.modeBtn,
                  mode === "video" && { backgroundColor: colors.primary },
                  mode !== "video" && { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
                ]}
              >
                <Ionicons name="videocam" size={18} color={mode === "video" ? "#fff" : colors.text} />
                <PremiumText variant="body" color={mode === "video" ? "#fff" : colors.text}>Video</PremiumText>
              </Pressable>
            </View>

            <View style={{ marginBottom: 16 }}>
              <PremiumText variant="label" color={colors.textMuted} style={{ fontSize: 11, marginBottom: 8 }}>
                SELECT CLUB TYPE
              </PremiumText>
              <View style={styles.clubGrid}>
                {CLUB_CATEGORIES.map((club) => {
                  const isActive = selectedClub === club.id;
                  return (
                    <Pressable
                      key={club.id}
                      onPress={() => {
                        setSelectedClub(isActive ? null : club.id);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.clubChip,
                        {
                          backgroundColor: isActive ? club.color + "18" : colors.surfaceElevated,
                          borderColor: isActive ? club.color : colors.border,
                        },
                      ]}
                    >
                      <Ionicons name={club.icon} size={16} color={isActive ? club.color : colors.textMuted} />
                      <View style={{ flex: 1 }}>
                        <PremiumText variant="caption" color={isActive ? club.color : colors.text} style={{ fontSize: 12, fontWeight: isActive ? "700" : "500" }}>
                          {club.label}
                        </PremiumText>
                      </View>
                      {isActive && <Ionicons name="checkmark-circle" size={16} color={club.color} />}
                    </Pressable>
                  );
                })}
              </View>
              {!selectedClub && (
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 11, marginTop: 6, textAlign: "center" }}>
                  Optional — select a club for tailored analysis
                </PremiumText>
              )}
            </View>

            {mode === "photo" ? (
              <View style={styles.optionsArea}>
                <Pressable
                  onPress={() => pickImage("camera")}
                  style={[styles.optionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  testID="photo-camera-btn"
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name="camera" size={28} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PremiumText variant="subtitle" style={{ fontSize: 15 }}>Take Photo</PremiumText>
                    <PremiumText variant="caption" color={colors.textSecondary}>
                      Capture your swing position with camera
                    </PremiumText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>

                <Pressable
                  onPress={() => pickImage("library")}
                  style={[styles.optionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  testID="photo-gallery-btn"
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.accent + "15" }]}>
                    <Ionicons name="images" size={28} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PremiumText variant="subtitle" style={{ fontSize: 15 }}>From Gallery</PremiumText>
                    <PremiumText variant="caption" color={colors.textSecondary}>
                      Upload an existing swing photo
                    </PremiumText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>

                <GlassCard style={styles.tipCard}>
                  <Ionicons name="bulb-outline" size={16} color={colors.accent} />
                  <PremiumText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                    For best results, capture from a side angle showing your full body and club
                  </PremiumText>
                </GlassCard>
              </View>
            ) : (
              <View style={styles.optionsArea}>
                <Pressable
                  onPress={recordVideo}
                  style={[styles.optionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  testID="video-record-btn"
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.error + "15" }]}>
                    <Ionicons name="radio-button-on" size={28} color={colors.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PremiumText variant="subtitle" style={{ fontSize: 15 }}>Record Swing</PremiumText>
                    <PremiumText variant="caption" color={colors.textSecondary}>
                      Record up to 15 seconds of your swing
                    </PremiumText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>

                <Pressable
                  onPress={pickVideo}
                  style={[styles.optionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  testID="video-gallery-btn"
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.accent + "15" }]}>
                    <Ionicons name="film" size={28} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PremiumText variant="subtitle" style={{ fontSize: 15 }}>From Library</PremiumText>
                    <PremiumText variant="caption" color={colors.textSecondary}>
                      Pick an existing swing video to review
                    </PremiumText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>

                <GlassCard style={styles.tipCard}>
                  <Ionicons name="bulb-outline" size={16} color={colors.accent} />
                  <PremiumText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                    Record your swing, then review in slow motion and capture the perfect frame for AI analysis
                  </PremiumText>
                </GlassCard>
              </View>
            )}
          </>
        )}

        {!!error && (
          <PremiumText variant="body" color={colors.error} style={{ textAlign: "center", marginTop: 16 }}>
            {error}
          </PremiumText>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  scrollContent: { paddingHorizontal: 16 },
  heroCard: { height: 200, justifyContent: "center" },
  heroContent: { alignItems: "center", gap: 8, padding: 20 },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modeToggle: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 13,
  },
  optionsArea: { gap: 10 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  previewContainer: { flex: 1, justifyContent: "center" },
  preview: { width: "100%", height: 400, borderRadius: 20 },
  analyzeCard: { height: 300, justifyContent: "center" },
  analyzingContent: { alignItems: "center", padding: 20 },
  clubGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  clubChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    width: "48%" as any,
    flexGrow: 1,
    flexBasis: "45%" as any,
  },
});
