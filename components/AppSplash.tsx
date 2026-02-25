import React, { useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Animated, Platform, Dimensions, Easing } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const USE_NATIVE = Platform.OS !== "web";
const NUM_PARTICLES = 14;

interface AppSplashProps {
  onFinish: () => void;
}

function Particle({ delay, angle, distance, size }: { delay: number; angle: number; distance: number; size: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const finalX = Math.cos((angle * Math.PI) / 180) * distance;
  const finalY = Math.sin((angle * Math.PI) / 180) * distance;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.9, duration: 400, useNativeDriver: USE_NATIVE }),
          Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: USE_NATIVE }),
        ]),
        Animated.timing(translateX, { toValue: finalX, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE }),
        Animated.timing(translateY, { toValue: finalY, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#C5A55A",
        opacity,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
}

export function AppSplash({ onFinish }: AppSplashProps) {
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.3)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const shimmerOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(24)).current;
  const lineScaleX = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(16)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const scaleOut = useRef(new Animated.Value(1)).current;

  const particles = useMemo(() =>
    Array.from({ length: NUM_PARTICLES }, (_, i) => ({
      angle: (360 / NUM_PARTICLES) * i + (Math.random() * 15 - 7.5),
      distance: 60 + Math.random() * 80,
      delay: 600 + Math.random() * 500,
      size: 2 + Math.random() * 3,
    })),
  []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bgOpacity, { toValue: 1, duration: 600, useNativeDriver: USE_NATIVE }),

      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 0.5, duration: 800, useNativeDriver: USE_NATIVE }),
        Animated.timing(glowScale, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: USE_NATIVE }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: USE_NATIVE }),
      ]),

      Animated.parallel([
        Animated.sequence([
          Animated.timing(shimmerOpacity, { toValue: 0.6, duration: 300, useNativeDriver: USE_NATIVE }),
          Animated.timing(shimmerOpacity, { toValue: 0, duration: 500, useNativeDriver: USE_NATIVE }),
        ]),
        Animated.timing(glowOpacity, { toValue: 0.2, duration: 800, useNativeDriver: USE_NATIVE }),
      ]),

      Animated.stagger(100, [
        Animated.parallel([
          Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: USE_NATIVE }),
          Animated.timing(titleTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        ]),
        Animated.timing(lineScaleX, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        Animated.parallel([
          Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: USE_NATIVE }),
          Animated.timing(subtitleTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        ]),
        Animated.timing(taglineOpacity, { toValue: 0.4, duration: 400, useNativeDriver: USE_NATIVE }),
      ]),

      Animated.delay(600),

      Animated.parallel([
        Animated.timing(fadeOut, { toValue: 0, duration: 450, easing: Easing.in(Easing.ease), useNativeDriver: USE_NATIVE }),
        Animated.timing(scaleOut, { toValue: 1.08, duration: 450, easing: Easing.in(Easing.ease), useNativeDriver: USE_NATIVE }),
      ]),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut, transform: [{ scale: scaleOut }] }]}>
      <LinearGradient
        colors={["#071A09", "#0D3B12", "#122E14", "#071A09"]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.glowOrb, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

      <View style={styles.centerContent}>
        <View style={styles.logoArea}>
          <View style={styles.particleAnchor}>
            {particles.map((p, i) => (
              <Particle key={i} {...p} />
            ))}
          </View>

          <Animated.View style={[styles.shimmerRing, { opacity: shimmerOpacity }]} />

          <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/splash-icon.png")}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
          </Animated.View>
        </View>

        <View style={styles.textArea}>
          <Animated.Text
            style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}
          >
            TRUST GOLF
          </Animated.Text>

          <Animated.View style={[styles.divider, { transform: [{ scaleX: lineScaleX }] }]} />

          <Animated.Text
            style={[styles.subtitle, { opacity: subtitleOpacity, transform: [{ translateY: subtitleTranslateY }] }]}
          >
            YOUR PREMIUM GOLF COMPANION
          </Animated.Text>

          <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
            by DarkWave Studios LLC
          </Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  glowOrb: {
    position: "absolute",
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    borderRadius: SCREEN_W * 0.45,
    backgroundColor: "rgba(27, 94, 32, 0.15)",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoArea: {
    alignItems: "center",
    justifyContent: "center",
    width: 160,
    height: 160,
  },
  particleAnchor: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 0,
    height: 0,
  },
  shimmerRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: "rgba(197, 165, 90, 0.4)",
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C5A55A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  textArea: {
    alignItems: "center",
    marginTop: 36,
  },
  title: {
    color: "#C5A55A",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 10,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  divider: {
    width: 48,
    height: 1.5,
    backgroundColor: "rgba(197, 165, 90, 0.45)",
    marginVertical: 14,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    letterSpacing: 4,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  tagline: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 10,
    letterSpacing: 1.5,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 20,
  },
});
