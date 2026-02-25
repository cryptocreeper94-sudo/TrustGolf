import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Platform, Dimensions } from "react-native";
import { Image } from "expo-image";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface AppSplashProps {
  onFinish: () => void;
}

export function AppSplash({ onFinish }: AppSplashProps) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.delay(600),
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <Animated.View
        style={[
          styles.glowRing,
          {
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <Image
          source={require("@/assets/images/splash-icon.png")}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, marginTop: 20 }}>
        <Animated.Text style={styles.title}>Trust Golf</Animated.Text>
        <Animated.Text style={styles.subtitle}>by DarkWave Studios LLC</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1B5E20",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  glowRing: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(197, 165, 90, 0.08)",
  },
  logo: {
    width: 160,
    height: 160,
  },
  title: {
    color: "#C5A55A",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
  },
});
