import React, { useState } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, TextInput, Platform, KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { PremiumText } from "@/components/PremiumText";
import { apiRequest, getQueryFn } from "@/lib/query-client";

export default function NewRoundScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [courseName, setCourseName] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [par, setPar] = useState("72");
  const [putts, setPutts] = useState("");
  const [fairways, setFairways] = useState("");
  const [gir, setGir] = useState("");
  const [notes, setNotes] = useState("");

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rounds", {
        userId: user?.id,
        courseName: courseName.trim(),
        totalScore: parseInt(totalScore),
        par: parseInt(par) || 72,
        holes: 18,
        putts: putts ? parseInt(putts) : undefined,
        fairwaysHit: fairways ? parseInt(fairways) : undefined,
        greensInRegulation: gir ? parseInt(gir) : undefined,
        notes: notes.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
  });

  const isValid = courseName.trim() && totalScore && parseInt(totalScore) > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <PremiumText variant="subtitle">New Round</PremiumText>
        <Pressable
          onPress={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending}
          style={{ opacity: isValid ? 1 : 0.4 }}
        >
          <PremiumText variant="subtitle" color={colors.primary}>
            {mutation.isPending ? "Saving..." : "Save"}
          </PremiumText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <GlassCard>
          <PremiumText variant="label" color={colors.textMuted} style={{ marginBottom: 10 }}>COURSE DETAILS</PremiumText>

          <PremiumText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>Course Name</PremiumText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
            value={courseName}
            onChangeText={setCourseName}
            placeholder="e.g. Augusta National"
            placeholderTextColor={colors.textMuted}
          />

          {courses && courses.length > 0 && !courseName && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6, marginBottom: 8 }}>
              {courses.slice(0, 5).map((c: any) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setCourseName(c.name);
                    setPar(String(c.par));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.courseSuggestion, { borderColor: colors.border }]}
                >
                  <PremiumText variant="caption" color={colors.primary} numberOfLines={1}>{c.name}</PremiumText>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <PremiumText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>Score</PremiumText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={totalScore}
                onChangeText={setTotalScore}
                placeholder="85"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <PremiumText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>Par</PremiumText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={par}
                onChangeText={setPar}
                placeholder="72"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </GlassCard>

        <GlassCard style={{ marginTop: 14 }}>
          <PremiumText variant="label" color={colors.textMuted} style={{ marginBottom: 10 }}>STATS (OPTIONAL)</PremiumText>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <PremiumText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>Putts</PremiumText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={putts}
                onChangeText={setPutts}
                placeholder="32"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <PremiumText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>Fairways Hit</PremiumText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={fairways}
                onChangeText={setFairways}
                placeholder="10"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <PremiumText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>GIR</PremiumText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={gir}
                onChangeText={setGir}
                placeholder="12"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </GlassCard>

        <GlassCard style={{ marginTop: 14 }}>
          <PremiumText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>Notes</PremiumText>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did the round go?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </GlassCard>

        {mutation.isError && (
          <PremiumText variant="caption" color={colors.error} style={{ textAlign: "center", marginTop: 8 }}>
            Failed to save round. Try again.
          </PremiumText>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  form: { paddingHorizontal: 16 },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: 10 },
  courseSuggestion: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
});
