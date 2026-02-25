import React, { useState } from "react";
import {
  View, Text, Pressable, StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, StatusBar, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming,
  withDelay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { OrbEffect } from "@/components/OrbEffect";
import { PremiumText } from "@/components/PremiumText";

type AuthTab = "login" | "register";

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { login, register, loginDeveloper, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ redirect?: string; reason?: string }>();

  const [tab, setTab] = useState<AuthTab>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(40);
  const formOpacity = useSharedValue(0);

  React.useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12 });
    logoOpacity.value = withTiming(1, { duration: 800 });
    formTranslateY.value = withDelay(300, withSpring(0, { damping: 14 }));
    formOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
    opacity: formOpacity.value,
  }));

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const handleLogin = async () => {
    if (!username.trim()) { setError("Enter your username or email"); return; }
    if (!password.trim()) { setError("Enter your password"); return; }
    setLoading(true);
    setError("");
    try {
      await login(username.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (params.redirect) {
        router.replace(params.redirect as any);
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setError(e.message || "Login failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim()) { setError("Choose a username"); return; }
    if (!email.trim()) { setError("Enter your email"); return; }
    if (!password) { setError("Create a password"); return; }
    if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.special) {
      setError("Password doesn't meet all requirements");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(username.trim(), email.trim(), password, displayName.trim() || username.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMsg("Account created! Check your email to verify.");
      setTimeout(() => {
        if (params.redirect) {
          router.replace(params.redirect as any);
        } else {
          router.replace("/(tabs)");
        }
      }, 1500);
    } catch (e: any) {
      setError(e.message || "Registration failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    const success = await loginDeveloper(devPassword);
    if (success) {
      if (!isLoggedIn) {
        try { await login("developer", "Dev@0424!"); } catch {}
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/developer");
    } else {
      setError("Invalid developer password");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const switchTab = (newTab: AuthTab) => {
    setTab(newTab);
    setError("");
    setSuccessMsg("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <LinearGradient
        colors={isDark ? ["#0A1A0A", "#0D2B0D", "#0A1A0A"] : ["#E8F5E9", "#C8E6C9", "#A5D6A7"]}
        style={[styles.container, { paddingTop: insets.top + webTopInset }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <OrbEffect color={isDark ? "#1B5E2040" : "#2E7D3225"} size={250} />

        <Pressable onPress={() => router.back()} style={[styles.closeBtn, { top: insets.top + webTopInset + 10 }]}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>

        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="golf" size={44} color={colors.primary} />
            </View>
            <PremiumText variant="hero" shadow style={{ textAlign: "center", marginTop: 12, fontSize: 28 }}>
              Trust Golf
            </PremiumText>
            {params.reason ? (
              <PremiumText variant="body" color={colors.textSecondary} style={{ textAlign: "center", marginTop: 4, fontSize: 13 }}>
                {params.reason}
              </PremiumText>
            ) : (
              <PremiumText variant="body" color={colors.textSecondary} style={{ textAlign: "center", marginTop: 4, fontSize: 13 }}>
                {tab === "login" ? "Welcome back" : "Create your account"}
              </PremiumText>
            )}
          </Animated.View>

          <Animated.View style={[styles.formContainer, formStyle]}>
            {!showDevLogin ? (
              <>
                <View style={[styles.tabRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Pressable
                    onPress={() => switchTab("login")}
                    style={[styles.tabBtn, tab === "login" && { backgroundColor: colors.primary }]}
                  >
                    <PremiumText variant="body" color={tab === "login" ? "#fff" : colors.textSecondary} style={{ fontSize: 14, fontWeight: "600" }}>
                      Sign In
                    </PremiumText>
                  </Pressable>
                  <Pressable
                    onPress={() => switchTab("register")}
                    style={[styles.tabBtn, tab === "register" && { backgroundColor: colors.primary }]}
                  >
                    <PremiumText variant="body" color={tab === "register" ? "#fff" : colors.textSecondary} style={{ fontSize: 14, fontWeight: "600" }}>
                      Register
                    </PremiumText>
                  </Pressable>
                </View>

                {tab === "register" && (
                  <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Display Name"
                      placeholderTextColor={colors.textMuted}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name={tab === "login" ? "person-outline" : "at-outline"} size={18} color={colors.textMuted} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={tab === "login" ? "Username or Email" : "Username"}
                    placeholderTextColor={colors.textMuted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {tab === "register" && (
                  <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Email Address"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                    />
                  </View>
                )}

                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
                  </Pressable>
                </View>

                {tab === "register" && password.length > 0 && (
                  <View style={styles.pwChecks}>
                    <PasswordCheck met={passwordChecks.length} label="8+ characters" colors={colors} />
                    <PasswordCheck met={passwordChecks.uppercase} label="1 uppercase letter" colors={colors} />
                    <PasswordCheck met={passwordChecks.special} label="1 special character" colors={colors} />
                  </View>
                )}

                {!!successMsg && (
                  <View style={[styles.successBanner, { backgroundColor: colors.success + "15" }]}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={[styles.successText, { color: colors.success }]}>{successMsg}</Text>
                  </View>
                )}

                {!!error && (
                  <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
                )}

                <Pressable
                  onPress={tab === "login" ? handleLogin : handleRegister}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.loginButton,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
                  ]}
                  testID="auth-submit-btn"
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? (tab === "login" ? "Signing in..." : "Creating account...") : (tab === "login" ? "Sign In" : "Create Account")}
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
                  <Ionicons name="key-outline" size={18} color={colors.textMuted} />
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
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}>
          <PremiumText variant="caption" color={colors.textMuted}>
            DarkWave Studios LLC {"\u00A9"} 2026
          </PremiumText>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function PasswordCheck({ met, label, colors }: { met: boolean; label: string; colors: any }) {
  return (
    <View style={styles.pwCheckRow}>
      <Ionicons name={met ? "checkmark-circle" : "ellipse-outline"} size={14} color={met ? colors.success : colors.textMuted} />
      <Text style={[styles.pwCheckText, { color: met ? colors.success : colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 32,
    paddingVertical: 40,
  },
  logoContainer: { alignItems: "center" },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: { gap: 12 },
  tabRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  pwChecks: { gap: 4, paddingLeft: 4 },
  pwCheckRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pwCheckText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  error: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  successText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  devLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 6,
  },
  devLinkText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    alignItems: "center",
    paddingTop: 12,
  },
});
