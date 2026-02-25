import React, { useState, useRef, useCallback } from "react";
import {
  View, StyleSheet, Pressable, Platform, Linking, ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { OrbEffect } from "@/components/OrbEffect";
import { PremiumText } from "@/components/PremiumText";
import { apiRequest } from "@/lib/query-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const PLAYBACK_RATES = [0.25, 0.5, 1.0];
const RATE_LABELS = ["0.25x", "0.5x", "1x"];

export default function SwingVideoScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const [rateIndex, setRateIndex] = useState(2);
  const [error, setError] = useState("");
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<any>(null);

  const player = useVideoPlayer(uri || "", (p) => {
    p.loop = true;
    p.playbackRate = 1.0;
  });

  const cycleRate = useCallback(() => {
    const next = (rateIndex + 1) % PLAYBACK_RATES.length;
    setRateIndex(next);
    if (player) {
      player.playbackRate = PLAYBACK_RATES[next];
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [rateIndex, player]);

  const togglePlayPause = useCallback(() => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [player, isPlaying]);

  const captureFrameFromVideo = useCallback(async () => {
    if (!uri) return;
    try {
      if (player) {
        player.pause();
        setIsPlaying(false);
      }

      const currentTimeMs = (player?.currentTime || 0) * 1000;
      const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, {
        time: Math.max(0, currentTimeMs),
        quality: 0.85,
      });

      setCapturedFrame(thumbnailUri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err: any) {
      setError("Could not capture frame. Try pausing at the desired position first.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [uri, player]);

  const analyzeFrame = useCallback(async () => {
    if (!capturedFrame) return;
    setAnalyzing(true);
    setError("");
    try {
      let base64Data: string;
      if (Platform.OS === "web") {
        const response = await fetch(capturedFrame);
        const blob = await response.blob();
        base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        base64Data = await FileSystem.readAsStringAsync(capturedFrame, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const res = await apiRequest("POST", "/api/swing-analyze", {
        userId: user?.id || "guest",
        imageBase64: base64Data,
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
  }, [capturedFrame, user]);

  const openInTrustVault = useCallback(async () => {
    try {
      const vaultUrl = "https://trustvault.replit.app/video-editor";
      if (Platform.OS === "web") {
        window.open(vaultUrl, "_blank");
      } else {
        await Linking.openURL(vaultUrl);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      setError("Could not open TrustVault editor");
    }
  }, []);

  if (!uri) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <PremiumText variant="body" color={colors.textMuted}>No video selected</PremiumText>
      </View>
    );
  }

  if (analyzing) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
          <View style={{ width: 24 }} />
          <PremiumText variant="subtitle">Analyzing Frame</PremiumText>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16 }}>
          <GlassCard style={{ height: 300, justifyContent: "center" }}>
            <OrbEffect color={colors.primary + "30"} size={180} />
            <View style={{ alignItems: "center", padding: 20 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <PremiumText variant="title" style={{ textAlign: "center", marginTop: 20 }}>
                Analyzing Your Swing
              </PremiumText>
              <PremiumText variant="body" color={colors.textSecondary} style={{ textAlign: "center", marginTop: 8 }}>
                AI is evaluating your grip, stance, backswing, impact, and follow-through...
              </PremiumText>
            </View>
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
        <Pressable onPress={() => router.back()} testID="close-video">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <PremiumText variant="subtitle">Swing Playback</PremiumText>
        <Pressable onPress={openInTrustVault} testID="edit-vault-btn">
          <Ionicons name="color-wand" size={22} color={colors.accent} />
        </Pressable>
      </View>

      {capturedFrame ? (
        <View style={styles.framePreview}>
          <View style={styles.frameImageContainer}>
            <Image source={{ uri: capturedFrame }} style={styles.frameImage} contentFit="contain" />
            <View style={[styles.frameBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark-circle" size={14} color="#fff" />
              <PremiumText variant="caption" color="#fff">Frame Captured</PremiumText>
            </View>
          </View>

          <View style={styles.frameActions}>
            <Pressable
              onPress={analyzeFrame}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              testID="analyze-frame-btn"
            >
              <Ionicons name="scan" size={20} color="#fff" />
              <PremiumText variant="body" color="#fff">Analyze This Frame</PremiumText>
            </Pressable>
            <Pressable
              onPress={() => setCapturedFrame(null)}
              style={[styles.secondaryBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
            >
              <Ionicons name="refresh" size={18} color={colors.text} />
              <PremiumText variant="body">Recapture</PremiumText>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.videoContainer}>
            <VideoView
              ref={videoRef}
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls={false}
            />

            <Pressable
              onPress={togglePlayPause}
              style={styles.videoOverlayBtn}
              testID="play-pause-overlay"
            >
              {!isPlaying && (
                <View style={[styles.bigPlayBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                  <Ionicons name="play" size={36} color="#fff" />
                </View>
              )}
            </Pressable>

            <View style={[styles.rateOverlay, { backgroundColor: colors.surface + "CC" }]}>
              <Pressable onPress={cycleRate} style={[styles.rateBadge, { backgroundColor: colors.primary }]} testID="speed-toggle">
                <Ionicons name="speedometer-outline" size={14} color="#fff" />
                <PremiumText variant="caption" color="#fff">{RATE_LABELS[rateIndex]}</PremiumText>
              </Pressable>
            </View>
          </View>

          <View style={styles.controls}>
            <Pressable
              onPress={cycleRate}
              style={[styles.controlBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
              testID="rate-btn"
            >
              <PremiumText variant="caption" color={colors.primary}>{RATE_LABELS[rateIndex]}</PremiumText>
            </Pressable>
            <Pressable
              onPress={togglePlayPause}
              style={[styles.controlBtnLarge, { backgroundColor: colors.primary }]}
              testID="play-pause-btn"
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
            </Pressable>
            <Pressable
              onPress={captureFrameFromVideo}
              style={[styles.controlBtn, { backgroundColor: colors.accent }]}
              testID="capture-frame-btn"
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.actionArea}>
            <GlassCard style={styles.tipCard}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <PremiumText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                Play in slow motion, pause at the key position, then tap the camera button to capture that frame for AI analysis
              </PremiumText>
            </GlassCard>

            <Pressable
              onPress={captureFrameFromVideo}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              testID="capture-analyze-btn"
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <PremiumText variant="body" color="#fff">Capture Frame for Analysis</PremiumText>
            </Pressable>
          </View>
        </>
      )}

      {!!error && (
        <PremiumText variant="body" color={colors.error} style={{ textAlign: "center", marginTop: 12, paddingHorizontal: 16 }}>
          {error}
        </PremiumText>
      )}

      <View style={{ height: insets.bottom + webBottomInset + 20 }} />
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
  videoContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoOverlayBtn: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  bigPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  rateOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 12,
    padding: 4,
  },
  rateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actionArea: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  framePreview: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  frameImageContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  frameImage: {
    width: "100%",
    height: "100%",
  },
  frameBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  frameActions: {
    gap: 10,
  },
});
