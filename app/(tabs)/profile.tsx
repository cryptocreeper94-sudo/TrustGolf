import React, { useState, useEffect } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform, TextInput, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { BentoRow, BentoCell } from "@/components/BentoGrid";
import { AccordionItem } from "@/components/AccordionItem";
import { PremiumText } from "@/components/PremiumText";
import { getQueryFn } from "@/lib/query-client";

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme, themeMode, setThemeMode } = useTheme();
  const { user, logout, isDeveloper, isLoggedIn, updateProfile, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    age: "",
    swingSpeed: "",
    avgDriveDistance: "",
    flexibilityLevel: "medium",
    golfGoals: "",
  });
  const [saving, setSaving] = useState(false);

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats", user?.id || "none"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user?.id,
  });

  const { data: analyses } = useQuery<any[]>({
    queryKey: ["/api/swing-analyses", user?.id || "none"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || "",
        age: user.age ? String(user.age) : "",
        swingSpeed: user.swingSpeed ? String(user.swingSpeed) : "",
        avgDriveDistance: user.avgDriveDistance ? String(user.avgDriveDistance) : "",
        flexibilityLevel: user.flexibilityLevel || "medium",
        golfGoals: user.golfGoals || "",
      });
    }
  }, [user]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        displayName: profileForm.displayName || undefined,
        age: profileForm.age ? parseInt(profileForm.age) : undefined,
        swingSpeed: profileForm.swingSpeed ? parseInt(profileForm.swingSpeed) : undefined,
        avgDriveDistance: profileForm.avgDriveDistance ? parseInt(profileForm.avgDriveDistance) : undefined,
        flexibilityLevel: profileForm.flexibilityLevel || undefined,
        golfGoals: profileForm.golfGoals || undefined,
      } as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingProfile(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const flexOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + webTopInset + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <PremiumText variant="hero">Profile</PremiumText>
          {isDeveloper && (
            <Pressable
              onPress={() => router.push("/developer")}
              style={[styles.devBtn, { backgroundColor: colors.accent + "20" }]}
            >
              <Ionicons name="code-slash" size={16} color={colors.accent} />
            </Pressable>
          )}
        </View>

        <GlassCard style={{ marginTop: 16 }}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
              <PremiumText variant="hero" style={{ color: colors.primary }}>
                {(user?.displayName || user?.username || "G").charAt(0).toUpperCase()}
              </PremiumText>
            </View>
            <View style={{ flex: 1 }}>
              <PremiumText variant="title">{user?.displayName || user?.username || "Guest"}</PremiumText>
              {user?.email && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <PremiumText variant="caption" color={colors.textMuted}>{user.email}</PremiumText>
                  {user.emailVerified && (
                    <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  )}
                </View>
              )}
              <PremiumText variant="caption" color={colors.textMuted}>
                Member since {new Date().getFullYear()}
              </PremiumText>
            </View>
          </View>
        </GlassCard>

        {isLoggedIn && stats && stats.totalRounds > 0 && (
          <View style={{ marginTop: 14, gap: 10 }}>
            {stats.handicapIndex != null && (
              <GlassCard style={{ height: 72 }}>
                <View style={styles.handicapRow}>
                  <View style={[styles.handicapIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name="analytics" size={22} color={colors.primary} />
                  </View>
                  <View>
                    <PremiumText variant="label" color={colors.textMuted}>HANDICAP INDEX</PremiumText>
                    <PremiumText variant="title" accent style={{ fontSize: 24 }}>{stats.handicapIndex}</PremiumText>
                  </View>
                </View>
              </GlassCard>
            )}
            <BentoRow>
              <BentoCell>
                <GlassCard style={{ height: 80 }}>
                  <View style={styles.statItem}>
                    <PremiumText variant="label" color={colors.textMuted}>ROUNDS</PremiumText>
                    <PremiumText variant="title" accent>{stats.totalRounds}</PremiumText>
                  </View>
                </GlassCard>
              </BentoCell>
              <BentoCell>
                <GlassCard style={{ height: 80 }}>
                  <View style={styles.statItem}>
                    <PremiumText variant="label" color={colors.textMuted}>AVG</PremiumText>
                    <PremiumText variant="title">{stats.averageScore}</PremiumText>
                  </View>
                </GlassCard>
              </BentoCell>
              <BentoCell>
                <GlassCard style={{ height: 80 }}>
                  <View style={styles.statItem}>
                    <PremiumText variant="label" color={colors.textMuted}>ANALYSES</PremiumText>
                    <PremiumText variant="title">{(analyses || []).length}</PremiumText>
                  </View>
                </GlassCard>
              </BentoCell>
            </BentoRow>
          </View>
        )}

        {isLoggedIn && (
          <GlassCard style={{ marginTop: 14 }}>
            <AccordionItem
              title="Golf Profile"
              icon="golf-outline"
              defaultOpen={editingProfile}
            >
              {editingProfile ? (
                <View style={{ gap: 12 }}>
                  <ProfileField
                    label="Display Name"
                    value={profileForm.displayName}
                    onChangeText={(v) => setProfileForm({ ...profileForm, displayName: v })}
                    placeholder="Your name"
                    colors={colors}
                  />
                  <ProfileField
                    label="Age"
                    value={profileForm.age}
                    onChangeText={(v) => setProfileForm({ ...profileForm, age: v })}
                    placeholder="e.g. 32"
                    keyboardType="numeric"
                    colors={colors}
                  />
                  <ProfileField
                    label="Swing Speed (mph)"
                    value={profileForm.swingSpeed}
                    onChangeText={(v) => setProfileForm({ ...profileForm, swingSpeed: v })}
                    placeholder="e.g. 95"
                    keyboardType="numeric"
                    colors={colors}
                  />
                  <ProfileField
                    label="Avg Drive Distance (yds)"
                    value={profileForm.avgDriveDistance}
                    onChangeText={(v) => setProfileForm({ ...profileForm, avgDriveDistance: v })}
                    placeholder="e.g. 230"
                    keyboardType="numeric"
                    colors={colors}
                  />
                  <View>
                    <PremiumText variant="caption" color={colors.textMuted} style={{ marginBottom: 6, fontSize: 11 }}>
                      FLEXIBILITY LEVEL
                    </PremiumText>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {flexOptions.map((opt) => (
                        <Pressable
                          key={opt.value}
                          onPress={() => setProfileForm({ ...profileForm, flexibilityLevel: opt.value })}
                          style={[
                            styles.flexChip,
                            {
                              backgroundColor: profileForm.flexibilityLevel === opt.value ? colors.primary + "15" : colors.surfaceElevated,
                              borderColor: profileForm.flexibilityLevel === opt.value ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <PremiumText
                            variant="caption"
                            color={profileForm.flexibilityLevel === opt.value ? colors.primary : colors.textSecondary}
                            style={{ fontWeight: profileForm.flexibilityLevel === opt.value ? "700" : "400" }}
                          >
                            {opt.label}
                          </PremiumText>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <ProfileField
                    label="Golf Goals"
                    value={profileForm.golfGoals}
                    onChangeText={(v) => setProfileForm({ ...profileForm, golfGoals: v })}
                    placeholder="e.g. Break 80, improve short game"
                    multiline
                    colors={colors}
                  />
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                    <Pressable
                      onPress={() => setEditingProfile(false)}
                      style={[styles.cancelBtn, { borderColor: colors.border }]}
                    >
                      <PremiumText variant="body" color={colors.textSecondary}>Cancel</PremiumText>
                    </Pressable>
                    <Pressable
                      onPress={handleSaveProfile}
                      disabled={saving}
                      style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                    >
                      <PremiumText variant="body" color="#fff">
                        {saving ? "Saving..." : "Save Profile"}
                      </PremiumText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {(user?.age || user?.swingSpeed || user?.avgDriveDistance || user?.golfGoals) ? (
                    <>
                      {user?.age && (
                        <ProfileRow icon="calendar-outline" label="Age" value={`${user.age}`} colors={colors} />
                      )}
                      {user?.swingSpeed && (
                        <ProfileRow icon="speedometer-outline" label="Swing Speed" value={`${user.swingSpeed} mph`} colors={colors} />
                      )}
                      {user?.avgDriveDistance && (
                        <ProfileRow icon="locate-outline" label="Avg Drive" value={`${user.avgDriveDistance} yds`} colors={colors} />
                      )}
                      {user?.flexibilityLevel && (
                        <ProfileRow icon="body-outline" label="Flexibility" value={user.flexibilityLevel.charAt(0).toUpperCase() + user.flexibilityLevel.slice(1)} colors={colors} />
                      )}
                      {user?.golfGoals && (
                        <ProfileRow icon="flag-outline" label="Goals" value={user.golfGoals} colors={colors} />
                      )}
                    </>
                  ) : (
                    <PremiumText variant="body" color={colors.textMuted} style={{ textAlign: "center", paddingVertical: 8 }}>
                      Add your golf profile for personalized insights
                    </PremiumText>
                  )}
                  <Pressable
                    onPress={() => { setEditingProfile(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[styles.editBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <PremiumText variant="body" color={colors.primary} style={{ fontWeight: "600" }}>
                      {(user?.age || user?.swingSpeed) ? "Edit Golf Profile" : "Set Up Golf Profile"}
                    </PremiumText>
                  </Pressable>
                </View>
              )}
            </AccordionItem>
          </GlassCard>
        )}

        <GlassCard style={{ marginTop: 14 }}>
          <AccordionItem title="Appearance" icon="color-palette-outline" defaultOpen>
            <View style={styles.themeOptions}>
              {(["light", "dark", "system"] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => {
                    setThemeMode(mode);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: themeMode === mode ? colors.primary + "15" : "transparent",
                      borderColor: themeMode === mode ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={mode === "light" ? "sunny" : mode === "dark" ? "moon" : "phone-portrait"}
                    size={18}
                    color={themeMode === mode ? colors.primary : colors.textMuted}
                  />
                  <PremiumText
                    variant="caption"
                    color={themeMode === mode ? colors.primary : colors.textSecondary}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </PremiumText>
                </Pressable>
              ))}
            </View>
          </AccordionItem>
          <AccordionItem title="About Trust Golf" icon="information-circle-outline">
            <PremiumText variant="body" color={colors.textSecondary}>
              Trust Golf is your premium golf companion for score tracking, course discovery, AI-powered swing analysis, and exclusive deals.
            </PremiumText>
          </AccordionItem>
        </GlassCard>

        {isLoggedIn ? (
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutBtn, { borderColor: colors.error }]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <PremiumText variant="body" color={colors.error}>Sign Out</PremiumText>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/login")}
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="person-outline" size={18} color="#fff" />
            <PremiumText variant="body" color="#fff">Sign In</PremiumText>
          </Pressable>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function ProfileField({ label, value, onChangeText, placeholder, keyboardType, multiline, colors }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  keyboardType?: any; multiline?: boolean; colors: any;
}) {
  return (
    <View>
      <PremiumText variant="caption" color={colors.textMuted} style={{ marginBottom: 4, fontSize: 11 }}>
        {label.toUpperCase()}
      </PremiumText>
      <TextInput
        style={[
          styles.profileInput,
          {
            color: colors.text,
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
          multiline && { height: 70, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

function ProfileRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={styles.profileRow}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
      <PremiumText variant="caption" color={colors.textMuted} style={{ width: 80 }}>{label}</PremiumText>
      <PremiumText variant="body" color={colors.text} style={{ flex: 1 }}>{value}</PremiumText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  devBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  handicapRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  handicapIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  themeOptions: { flexDirection: "row", gap: 10 },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  profileInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  flexChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  saveBtn: {
    flex: 2,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
});
