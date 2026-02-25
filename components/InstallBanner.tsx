import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { PremiumText } from "@/components/PremiumText";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DISMISSED_KEY = "pwa_install_dismissed_v2";

export function InstallBanner() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    AsyncStorage.getItem(DISMISSED_KEY).then((val) => {
      if (val) {
        const dismissed = parseInt(val, 10);
        if (Date.now() - dismissed < 4 * 60 * 60 * 1000) return;
      }
      setTimeout(() => setVisible(true), 3000);
    }).catch(() => {
      setTimeout(() => setVisible(true), 3000);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        dismiss();
      }
      setDeferredPrompt(null);
    } else {
      dismiss();
    }
  };

  if (!visible || Platform.OS !== "web") return null;

  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.primary + "40",
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
        <Ionicons name="golf" size={22} color="#fff" />
      </View>

      <View style={styles.textArea}>
        <PremiumText variant="subtitle" style={{ fontSize: 15 }}>
          Install Trust Golf
        </PremiumText>
        {isIOS ? (
          <PremiumText variant="caption" color={colors.textSecondary} style={{ fontSize: 12, lineHeight: 16 }}>
            Tap share, then "Add to Home Screen"
          </PremiumText>
        ) : (
          <PremiumText variant="caption" color={colors.textSecondary} style={{ fontSize: 12, lineHeight: 16 }}>
            Add to your home screen for the full experience
          </PremiumText>
        )}
      </View>

      <View style={styles.actions}>
        {!isIOS && deferredPrompt ? (
          <Pressable onPress={handleInstall} style={[styles.installBtn, { backgroundColor: colors.primary }]}>
            <PremiumText variant="caption" color="#fff" style={{ fontSize: 12, fontWeight: "700" }}>INSTALL</PremiumText>
          </Pressable>
        ) : (
          <Pressable onPress={dismiss} style={[styles.gotItBtn, { borderColor: colors.primary }]}>
            <PremiumText variant="caption" color={colors.primary} style={{ fontSize: 12, fontWeight: "700" }}>GOT IT</PremiumText>
          </Pressable>
        )}
        <Pressable onPress={dismiss} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  installBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  gotItBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
