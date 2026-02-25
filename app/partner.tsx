import React, { useState } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, TextInput, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming, withDelay, FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { OrbEffect } from "@/components/OrbEffect";
import { PremiumText } from "@/components/PremiumText";
import { apiRequest } from "@/lib/query-client";

const BUSINESS_TYPES = [
  { key: "course", label: "Golf Course", icon: "golf-outline" as const },
  { key: "pro_shop", label: "Pro Shop", icon: "storefront-outline" as const },
  { key: "driving_range", label: "Driving Range", icon: "flag-outline" as const },
  { key: "retail", label: "Retail Store", icon: "bag-outline" as const },
  { key: "other", label: "Other", icon: "ellipsis-horizontal-outline" as const },
];

const PARTNERSHIP_TIERS = [
  {
    key: "free_listing",
    label: "Free Listing",
    desc: "Basic profile with contact info and photos",
    icon: "leaf-outline" as const,
    color: "#4CAF50",
  },
  {
    key: "featured",
    label: "Featured Partner",
    desc: "Priority placement, deal slots, branded AI tips",
    icon: "star-outline" as const,
    color: "#C5A55A",
  },
  {
    key: "premium",
    label: "Premium Partner",
    desc: "Booking integration, analytics, dedicated support",
    icon: "diamond-outline" as const,
    color: "#7C4DFF",
  },
];

const VALUE_PROPS = [
  { icon: "people-outline" as const, text: "Reach thousands of local golfers" },
  { icon: "analytics-outline" as const, text: "Track views, clicks, and bookings" },
  { icon: "megaphone-outline" as const, text: "Promote deals during slow periods" },
  { icon: "phone-portrait-outline" as const, text: "Cross-platform: iOS, Android, Web" },
  { icon: "shield-checkmark-outline" as const, text: "Part of the Trust Layer ecosystem" },
  { icon: "cash-outline" as const, text: "No upfront costs — grow together" },
];

export default function PartnerSignup() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [partnershipTier, setPartnershipTier] = useState("free_listing");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

  React.useEffect(() => {
    formOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(200, withSpring(0, { damping: 14 }));
  }, []);

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const handleSubmit = async () => {
    if (!businessName.trim()) { setError("Enter your business name"); return; }
    if (!contactName.trim()) { setError("Enter your contact name"); return; }
    if (!email.trim()) { setError("Enter your email address"); return; }
    if (!businessType) { setError("Select your business type"); return; }

    setLoading(true);
    setError("");
    try {
      await apiRequest("POST", "/api/vendor-applications", {
        businessName: businessName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        businessType,
        partnershipTier,
        message: message.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || "Failed to submit application");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ["#0A1A0A", "#0D2B0D", "#0A0F0A"] : ["#E8F5E9", "#F1F8F1", "#F5F7F5"]}
          style={StyleSheet.absoluteFill}
        />
        <OrbEffect color={colors.primary + "15"} size={300} style={{ top: "20%", left: "-10%" }} />
        <View style={[styles.successContainer, { paddingTop: insets.top + webTopInset + 60 }]}>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.successContent}>
            <View style={[styles.successIcon, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
            </View>
            <PremiumText variant="hero" style={{ textAlign: "center", marginTop: 24 }}>
              Application Submitted
            </PremiumText>
            <PremiumText variant="body" color={colors.textSecondary} style={{ textAlign: "center", marginTop: 12, lineHeight: 22, paddingHorizontal: 20 }}>
              Thank you for your interest in partnering with Trust Golf. We've sent a confirmation to {email} and will review your application within 2-3 business days.
            </PremiumText>
            <Pressable
              onPress={() => router.replace("/(tabs)")}
              style={[styles.backBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="home-outline" size={18} color="#fff" />
              <PremiumText variant="body" color="#fff" style={{ fontWeight: "700" }}>
                Back to Trust Golf
              </PremiumText>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ["#0A1A0A", "#0D2B0D", "#0A0F0A"] : ["#E8F5E9", "#F1F8F1", "#F5F7F5"]}
        style={StyleSheet.absoluteFill}
      />
      <OrbEffect color={colors.primary + "12"} size={280} style={{ top: "5%", right: "-15%" }} />
      <OrbEffect color={colors.accent + "10"} size={200} style={{ bottom: "10%", left: "-10%" }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + webTopInset + 10, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.heroSection}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="handshake-outline" size={28} color="#fff" />
            </View>
            <PremiumText variant="label" color={colors.accent} style={{ marginTop: 12 }}>
              PARTNER PROGRAM
            </PremiumText>
            <PremiumText variant="hero" style={{ textAlign: "center", marginTop: 4 }}>
              Grow With Trust Golf
            </PremiumText>
            <PremiumText variant="body" color={colors.textSecondary} style={{ textAlign: "center", marginTop: 8, lineHeight: 22, paddingHorizontal: 10 }}>
              Join Tennessee's premier golf platform and connect with thousands of active golfers.
            </PremiumText>
          </View>

          <GlassCard style={{ marginTop: 20 }}>
            <PremiumText variant="label" color={colors.primary} style={{ marginBottom: 12 }}>
              WHY PARTNER WITH US
            </PremiumText>
            <View style={styles.valueGrid}>
              {VALUE_PROPS.map((vp, i) => (
                <View key={i} style={styles.valueProp}>
                  <Ionicons name={vp.icon} size={18} color={colors.primary} />
                  <PremiumText variant="caption" color={colors.text} style={{ flex: 1, lineHeight: 18 }}>
                    {vp.text}
                  </PremiumText>
                </View>
              ))}
            </View>
          </GlassCard>

          <Animated.View style={formStyle}>
            <GlassCard style={{ marginTop: 16 }}>
              <PremiumText variant="label" color={colors.primary} style={{ marginBottom: 12 }}>
                BUSINESS INFORMATION
              </PremiumText>

              <View style={styles.fieldGroup}>
                <PremiumText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>Business Name *</PremiumText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="e.g. Pine Valley Golf Club"
                  placeholderTextColor={colors.textMuted}
                  testID="partner-business-name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <PremiumText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>Contact Name *</PremiumText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textMuted}
                  testID="partner-contact-name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <PremiumText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>Email *</PremiumText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@business.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  testID="partner-email"
                />
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <PremiumText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>Phone</PremiumText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="(615) 555-0100"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <PremiumText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>Location</PremiumText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="City, State"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </GlassCard>

            <GlassCard style={{ marginTop: 16 }}>
              <PremiumText variant="label" color={colors.primary} style={{ marginBottom: 12 }}>
                BUSINESS TYPE *
              </PremiumText>
              <View style={styles.typeGrid}>
                {BUSINESS_TYPES.map((bt) => (
                  <Pressable
                    key={bt.key}
                    onPress={() => { setBusinessType(bt.key); Haptics.selectionAsync(); }}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: businessType === bt.key ? colors.primary + "15" : colors.surfaceElevated,
                        borderColor: businessType === bt.key ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={bt.icon}
                      size={18}
                      color={businessType === bt.key ? colors.primary : colors.textMuted}
                    />
                    <PremiumText
                      variant="caption"
                      color={businessType === bt.key ? colors.primary : colors.text}
                      style={{ fontSize: 12 }}
                    >
                      {bt.label}
                    </PremiumText>
                  </Pressable>
                ))}
              </View>
            </GlassCard>

            <GlassCard style={{ marginTop: 16 }}>
              <PremiumText variant="label" color={colors.primary} style={{ marginBottom: 12 }}>
                PARTNERSHIP TIER
              </PremiumText>
              {PARTNERSHIP_TIERS.map((tier) => (
                <Pressable
                  key={tier.key}
                  onPress={() => { setPartnershipTier(tier.key); Haptics.selectionAsync(); }}
                  style={[
                    styles.tierCard,
                    {
                      backgroundColor: partnershipTier === tier.key ? tier.color + "12" : colors.surfaceElevated,
                      borderColor: partnershipTier === tier.key ? tier.color : colors.border,
                    },
                  ]}
                >
                  <View style={styles.tierHeader}>
                    <Ionicons
                      name={tier.icon}
                      size={20}
                      color={partnershipTier === tier.key ? tier.color : colors.textMuted}
                    />
                    <PremiumText
                      variant="body"
                      color={partnershipTier === tier.key ? tier.color : colors.text}
                      style={{ fontWeight: "700", flex: 1 }}
                    >
                      {tier.label}
                    </PremiumText>
                    <View style={[
                      styles.radioOuter,
                      { borderColor: partnershipTier === tier.key ? tier.color : colors.border },
                    ]}>
                      {partnershipTier === tier.key && (
                        <View style={[styles.radioInner, { backgroundColor: tier.color }]} />
                      )}
                    </View>
                  </View>
                  <PremiumText variant="caption" color={colors.textSecondary} style={{ marginTop: 4, lineHeight: 16 }}>
                    {tier.desc}
                  </PremiumText>
                </Pressable>
              ))}
            </GlassCard>

            <GlassCard style={{ marginTop: 16 }}>
              <PremiumText variant="label" color={colors.primary} style={{ marginBottom: 8 }}>
                MESSAGE (OPTIONAL)
              </PremiumText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border },
                ]}
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us about your business and how you'd like to partner..."
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              <PremiumText variant="caption" color={colors.textMuted} style={{ textAlign: "right", marginTop: 4 }}>
                {message.length}/500
              </PremiumText>
            </GlassCard>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: "#B71C1C15", borderColor: "#B71C1C40" }]}>
                <Ionicons name="alert-circle" size={16} color="#B71C1C" />
                <PremiumText variant="caption" color="#B71C1C" style={{ flex: 1 }}>{error}</PremiumText>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
              testID="partner-submit"
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                  <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 16 }}>
                    Submit Application
                  </PremiumText>
                </>
              )}
            </Pressable>

            <PremiumText variant="caption" color={colors.textMuted} style={{ textAlign: "center", marginTop: 12, lineHeight: 16, paddingHorizontal: 16 }}>
              By submitting, you agree to be contacted by Trust Golf about partnership opportunities. We'll never share your information with third parties.
            </PremiumText>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  heroSection: { alignItems: "center", paddingVertical: 10 },
  logoBadge: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  valueGrid: { gap: 10 },
  valueProp: { flexDirection: "row", alignItems: "center", gap: 10 },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 11, marginBottom: 4 },
  input: {
    height: 48, borderRadius: 12, paddingHorizontal: 14,
    fontSize: 15, fontFamily: "Inter_400Regular", borderWidth: 1,
  },
  textArea: { height: 100, paddingTop: 12 },
  rowFields: { flexDirection: "row", gap: 10 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
  },
  tierCard: {
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10,
  },
  tierHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12,
  },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, borderRadius: 14, marginTop: 16,
  },
  backBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 48, borderRadius: 12, marginTop: 28, paddingHorizontal: 24,
  },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  successContent: { alignItems: "center" },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center",
  },
});
