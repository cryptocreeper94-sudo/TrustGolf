import React, { useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Animated, Platform, Dimensions, Easing } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const USE_NATIVE = Platform.OS !== "web";
const NUM_PARTICLES = 18;
const NUM_RINGS = 4;

interface AppSplashProps {
  onFinish: () => void;
}

function GoldenParticle({ delay, angle, distance }: { delay: number; angle: number; distance: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.2)).current;

  const finalX = Math.cos((angle * Math.PI) / 180) * distance;
  const finalY = Math.sin((angle * Math.PI) / 180) * distance;
  const size = 2 + Math.random() * 4;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0.8, duration: 600, useNativeDriver: USE_NATIVE }),
        Animated.timing(translateX, { toValue: finalX, duration: 1800, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        Animated.timing(translateY, { toValue: finalY, duration: 1800, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: USE_NATIVE }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: USE_NATIVE }),
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
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

function ExpandingRing({ delay, maxSize, duration }: { delay: number; maxSize: number; duration: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        Animated.timing(opacity, { toValue: 0, duration, useNativeDriver: USE_NATIVE }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: maxSize,
        height: maxSize,
        borderRadius: maxSize / 2,
        borderWidth: 1.5,
        borderColor: "#C5A55A",
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export function AppSplash({ onFinish }: AppSplashProps) {
  const bgGlow = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(-0.05)).current;
  const glowBurst = useRef(new Animated.Value(0)).current;
  const glowBurstOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(15)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const scaleOut = useRef(new Animated.Value(1)).current;

  const particles = useMemo(() =>
    Array.from({ length: NUM_PARTICLES }, (_, i) => ({
      angle: (360 / NUM_PARTICLES) * i + Math.random() * 20 - 10,
      distance: 80 + Math.random() * 100,
      delay: 300 + Math.random() * 400,
    })),
  []);

  const rings = useMemo(() =>
    Array.from({ length: NUM_RINGS }, (_, i) => ({
      delay: 200 + i * 200,
      maxSize: 200 + i * 100,
      duration: 1200 + i * 200,
    })),
  []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bgGlow, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: USE_NATIVE }),

      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: USE_NATIVE }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: USE_NATIVE }),
        Animated.timing(logoRotate, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1.5)), useNativeDriver: USE_NATIVE }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowBurst, { toValue: 1, duration: 600, useNativeDriver: USE_NATIVE }),
            Animated.timing(glowBurstOpacity, { toValue: 0.7, duration: 300, useNativeDriver: USE_NATIVE }),
          ]),
          Animated.timing(glowBurstOpacity, { toValue: 0, duration: 500, useNativeDriver: USE_NATIVE }),
        ]),
      ]),

      Animated.stagger(120, [
        Animated.parallel([
          Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: USE_NATIVE }),
          Animated.timing(titleTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        ]),
        Animated.parallel([
          Animated.timing(lineWidth, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        ]),
        Animated.parallel([
          Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: USE_NATIVE }),
          Animated.timing(subtitleTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        ]),
        Animated.parallel([
          Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: USE_NATIVE }),
          Animated.timing(taglineTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
        ]),
      ]),

      Animated.delay(700),

      Animated.parallel([
        Animated.timing(fadeOut, { toValue: 0, duration: 500, easing: Easing.in(Easing.ease), useNativeDriver: USE_NATIVE }),
        Animated.timing(scaleOut, { toValue: 1.1, duration: 500, easing: Easing.in(Easing.ease), useNativeDriver: USE_NATIVE }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const logoSpin = logoRotate.interpolate({
    inputRange: [-0.05, 0],
    outputRange: ["-3deg", "0deg"],
  });

  const glowBurstScale = glowBurst.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2.5],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut, transform: [{ scale: scaleOut }] }]}>
      <LinearGradient
        colors={["#0D3B12", "#1B5E20", "#0D3B12"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.bgGlowCenter, { opacity: bgGlow }]} />
      <Animated.View style={[styles.bgGlowTop, { opacity: bgGlow }]} />

      {rings.map((ring, i) => (
        <ExpandingRing key={i} {...ring} />
      ))}

      <View style={styles.particleContainer}>
        {particles.map((p, i) => (
          <GoldenParticle key={i} {...p} />
        ))}
      </View>

      <Animated.View style={[styles.glowBurstCircle, { opacity: glowBurstOpacity, transform: [{ scale: glowBurstScale }] }]} />

      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }, { rotate: logoSpin }],
        }}
      >
        <View style={styles.logoShadow}>
          <Image
            source={require("@/assets/images/splash-icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </Animated.View>

      <View style={styles.textBlock}>
        <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}>
          TRUST GOLF
        </Animated.Text>

        <Animated.View style={[styles.dividerLine, { transform: [{ scaleX: lineWidth }] }]} />

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity, transform: [{ translateY: subtitleTranslateY }] }]}>
          Your Premium Golf Companion
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] }]}>
          by DarkWave Studios LLC
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  bgGlowCenter: {
    position: "absolute",
    width: SCREEN_W * 1.2,
    height: SCREEN_W * 1.2,
    borderRadius: SCREEN_W * 0.6,
    backgroundColor: "rgba(76, 175, 80, 0.06)",
  },
  bgGlowTop: {
    position: "absolute",
    top: -SCREEN_H * 0.15,
    width: SCREEN_W * 0.8,
    height: SCREEN_W * 0.8,
    borderRadius: SCREEN_W * 0.4,
    backgroundColor: "rgba(197, 165, 90, 0.04)",
  },
  particleContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  glowBurstCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(197, 165, 90, 0.15)",
  },
  logoShadow: {
    shadowColor: "#C5A55A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  logo: {
    width: 140,
    height: 140,
  },
  textBlock: {
    alignItems: "center",
    marginTop: 30,
  },
  title: {
    color: "#C5A55A",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 8,
    fontFamily: "Inter_700Bold",
  },
  dividerLine: {
    width: 60,
    height: 1.5,
    backgroundColor: "rgba(197, 165, 90, 0.5)",
    marginVertical: 12,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 3,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
  },
  tagline: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 16,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1.5,
  },
});
