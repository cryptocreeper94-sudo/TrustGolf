import React, { useState, useRef, useCallback } from "react";
import {
  View, StyleSheet, Pressable, Platform, Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { PremiumText } from "@/components/PremiumText";
import { apiRequest } from "@/lib/query-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PLAYBACK_RATES = [0.25, 0.5, 1.0];

export default function SwingVideoScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const [rateIndex, setRateIndex] = useState(2);
  const [error, setError] = useState("");
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

  const captureStillForAnalysis = useCallback(async () => {
    try {
      if (player) player.pause();
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const res = await apiRequest("POST", "/api/swing-analyze", {
          userId: user?.id || "guest",
          imageBase64: result.assets[0].base64,
        });
        const analysis = await res.json();
        await AsyncStorage.setItem("last_swing_analysis", JSON.stringify(analysis));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push("/swing-result");
      }
    } catch (err: any) {
      setError("Could not capture frame for analysis");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [user, player]);

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

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
        <Pressable onPress={() => router.back()} testID="close-video">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <PremiumText variant="subtitle">Swing Playback</PremiumText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.videoContainer}>
        <VideoView
          ref={videoRef}
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
        />

        <View style={[styles.rateOverlay, { backgroundColor: colors.surface + "CC" }]}>
          <Pressable onPress={cycleRate} style={[styles.rateBadge, { backgroundColor: colors.primary }]} testID="speed-toggle">
            <Ionicons name="speedometer-outline" size={14} color="#fff" />
            <PremiumText variant="caption" color="#fff">{PLAYBACK_RATES[rateIndex]}x</PremiumText>
          </Pressable>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => { player?.pause(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.controlBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
          testID="pause-btn"
        >
          <Ionicons name="pause" size={20} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => { player?.play(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.controlBtn, { backgroundColor: colors.primary }]}
          testID="play-btn"
        >
          <Ionicons name="play" size={20} color="#fff" />
        </Pressable>
        <Pressable
          onPress={cycleRate}
          style={[styles.controlBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
          testID="rate-btn"
        >
          <PremiumText variant="caption" color={colors.primary}>{PLAYBACK_RATES[rateIndex]}x</PremiumText>
        </Pressable>
      </View>

      <View style={styles.actionArea}>
        <GlassCard style={styles.tipCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
          <PremiumText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
            Review your swing in slow motion, then capture a still photo at the key position for AI analysis
          </PremiumText>
        </GlassCard>

        <Pressable
          onPress={captureStillForAnalysis}
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          testID="capture-analyze-btn"
        >
          <Ionicons name="camera" size={20} color="#fff" />
          <PremiumText variant="body" color="#fff">Capture Frame for Analysis</PremiumText>
        </Pressable>

        <Pressable
          onPress={openInTrustVault}
          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
          testID="edit-vault-btn"
        >
          <Ionicons name="color-wand" size={20} color="#fff" />
          <PremiumText variant="body" color="#fff">Edit in Studio</PremiumText>
        </Pressable>
      </View>

      {!!error && (
        <PremiumText variant="body" color={colors.error} style={{ textAlign: "center", marginTop: 12, paddingHorizontal: 16 }}>
          {error}
        </PremiumText>
      )}

      <View style={{ height: insets.bottom + 20 }} />
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
    gap: 16,
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
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
});
