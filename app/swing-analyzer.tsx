import React, { useState } from "react";
import {
  View, StyleSheet, Pressable, Platform, ActivityIndicator,
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

export default function SwingAnalyzerScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

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
        router.push({ pathname: "/swing-video", params: { uri: result.assets[0].uri } });
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
        router.push({ pathname: "/swing-video", params: { uri: result.assets[0].uri } });
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
        <PremiumText variant="subtitle">AI Swing Analysis</PremiumText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {analyzing ? (
          <GlassCard style={styles.analyzeCard}>
            <OrbEffect color={colors.primary + "30"} size={180} />
            <View style={styles.analyzingContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <PremiumText variant="title" style={{ textAlign: "center", marginTop: 20 }}>
                Analyzing Your Swing
              </PremiumText>
              <PremiumText variant="body" color={colors.textSecondary} style={{ textAlign: "center", marginTop: 8 }}>
                Our AI is evaluating your grip, stance, backswing, impact, and follow-through...
              </PremiumText>
            </View>
          </GlassCard>
        ) : imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.preview} contentFit="contain" />
          </View>
        ) : (
          <View style={styles.uploadArea}>
            <GlassCard style={styles.uploadCard}>
              <OrbEffect color={colors.primary + "20"} size={150} />
              <View style={styles.uploadContent}>
                <View style={[styles.uploadIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name="scan" size={40} color={colors.primary} />
                </View>
                <PremiumText variant="title" style={{ textAlign: "center" }}>
                  Analyze Your Swing
                </PremiumText>
                <PremiumText variant="body" color={colors.textSecondary} style={{ textAlign: "center" }}>
                  Take a photo, record a video, or upload from your gallery for AI-powered analysis
                </PremiumText>
              </View>
            </GlassCard>

            <PremiumText variant="label" color={colors.textMuted} style={{ marginTop: 4 }}>
              PHOTO ANALYSIS
            </PremiumText>
            <View style={styles.btnRow}>
              <Pressable
                onPress={() => pickImage("camera")}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                testID="photo-camera-btn"
              >
                <Ionicons name="camera" size={20} color="#fff" />
                <PremiumText variant="body" color="#fff">Camera</PremiumText>
              </Pressable>
              <Pressable
                onPress={() => pickImage("library")}
                style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
                testID="photo-gallery-btn"
              >
                <Ionicons name="images" size={20} color={colors.primary} />
                <PremiumText variant="body" color={colors.text}>Gallery</PremiumText>
              </Pressable>
            </View>

            <PremiumText variant="label" color={colors.textMuted} style={{ marginTop: 16 }}>
              VIDEO ANALYSIS
            </PremiumText>
            <View style={styles.btnRow}>
              <Pressable
                onPress={recordVideo}
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                testID="video-record-btn"
              >
                <Ionicons name="videocam" size={20} color="#fff" />
                <PremiumText variant="body" color="#fff">Record</PremiumText>
              </Pressable>
              <Pressable
                onPress={pickVideo}
                style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
                testID="video-gallery-btn"
              >
                <Ionicons name="film" size={20} color={colors.accent} />
                <PremiumText variant="body" color={colors.text}>Video Library</PremiumText>
              </Pressable>
            </View>
          </View>
        )}

        {!!error && (
          <PremiumText variant="body" color={colors.error} style={{ textAlign: "center", marginTop: 16 }}>
            {error}
          </PremiumText>
        )}
      </View>
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
  content: { flex: 1, paddingHorizontal: 16, justifyContent: "center" },
  uploadArea: { flex: 1, justifyContent: "center" },
  uploadCard: { height: 240, justifyContent: "center" },
  uploadContent: { alignItems: "center", gap: 10, padding: 20 },
  uploadIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  previewContainer: { flex: 1, justifyContent: "center" },
  preview: { width: "100%", height: 400, borderRadius: 20 },
  analyzeCard: { height: 300, justifyContent: "center" },
  analyzingContent: { alignItems: "center", padding: 20 },
});
