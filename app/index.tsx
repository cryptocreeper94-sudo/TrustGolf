import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Dimensions, StatusBar,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming,
  withDelay, interpolate, FadeIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { OrbEffect } from "@/components/OrbEffect";
import { PremiumText } from "@/components/PremiumText";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { login, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginDeveloper } = useAuth();

  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(40);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)");
      return;
    }
    logoScale.value = withSpring(1, { damping: 12 });
    logoOpacity.value = withTiming(1, { duration: 800 });
    formTranslateY.value = withDelay(300, withSpring(0, { damping: 14 }));
    formOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
  }, [isLoggedIn]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
    opacity: formOpacity.value,
  }));

  const handleLogin = async () => {
    if (!username.trim()) { setError("Enter a username"); return; }
    setLoading(true);
    setError("");
    try {
      await login(username.trim(), password || "golfer");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Login failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    const success = await loginDeveloper(devPassword);
    if (success) {
      if (!isLoggedIn) {
        await login("developer", "0424");
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/developer");
    } else {
      setError("Invalid developer password");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={isDark ? ["#0A1A0A", "#0D2B0D", "#0A1A0A"] : ["#E8F5E9", "#C8E6C9", "#A5D6A7"]}
        style={[styles.container, { paddingTop: insets.top + webTopInset }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <OrbEffect color={isDark ? "#1B5E2040" : "#2E7D3225"} size={250} />

        <Pressable
          onPress={toggleTheme}
          style={[styles.themeToggle, { top: insets.top + webTopInset + 10 }]}
        >
          <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={colors.text} />
        </Pressable>

        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <View style={styles.content}>
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="golf" size={48} color={colors.primary} />
            </View>
            <PremiumText variant="hero" shadow style={{ textAlign: "center", marginTop: 16 }}>
              GolfPro
            </PremiumText>
            <PremiumText variant="body" color={colors.textSecondary} style={{ textAlign: "center", marginTop: 4 }}>
              Your premium golf companion
            </PremiumText>
          </Animated.View>

          <Animated.View style={[styles.formContainer, formStyle]}>
            {!showDevLogin ? (
              <>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Username"
                    placeholderTextColor={colors.textMuted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {!!error && (
                  <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
                )}

                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.loginButton,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? "Signing in..." : "Get Started"}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </Pressable>

                <Pressable
                  onPress={() => { setShowDevLogin(true); setError(""); }}
                  style={styles.devLink}
                >
                  <Ionicons name="code-slash" size={14} color={colors.textMuted} />
                  <Text style={[styles.devLinkText, { color: colors.textMuted }]}>Developer Access</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="key-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Developer Password"
                    placeholderTextColor={colors.textMuted}
                    value={devPassword}
                    onChangeText={setDevPassword}
                    secureTextEntry
                  />
                </View>

                {!!error && (
                  <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
                )}

                <Pressable
                  onPress={handleDevLogin}
                  style={({ pressed }) => [
                    styles.loginButton,
                    { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text style={[styles.loginButtonText, { color: "#1A1A1A" }]}>Enter Dashboard</Text>
                  <Ionicons name="shield-checkmark" size={18} color="#1A1A1A" />
                </Pressable>

                <Pressable
                  onPress={() => { setShowDevLogin(false); setError(""); }}
                  style={styles.devLink}
                >
                  <Ionicons name="arrow-back" size={14} color={colors.textMuted} />
                  <Text style={[styles.devLinkText, { color: colors.textMuted }]}>Back to User Login</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}>
          <PremiumText variant="caption" color={colors.textMuted}>
            Score Tracking  |  Course Discovery  |  AI Swing Analysis
          </PremiumText>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggle: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 40,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  error: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    gap: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  devLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 8,
  },
  devLinkText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    alignItems: "center",
    paddingTop: 16,
  },
});
