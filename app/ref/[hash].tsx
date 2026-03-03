import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { PremiumText } from "@/components/PremiumText";
import { apiRequest } from "@/lib/query-client";

export default function ReferralScreen() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const { colors } = useTheme();

  useEffect(() => {
    if (hash) {
      apiRequest("POST", "/api/affiliate/track", { referralHash: hash, platform: "trustgolf" })
        .catch(() => {});

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("referralHash", hash);
        } catch {}
      }
    }

    const timer = setTimeout(() => {
      router.replace("/");
    }, 1500);

    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <PremiumText variant="body" color={colors.textSecondary} style={styles.text}>
        Welcome to Trust Golf
      </PremiumText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { marginTop: 16 },
});
