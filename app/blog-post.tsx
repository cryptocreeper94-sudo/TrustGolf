import React from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { PremiumText } from "@/components/PremiumText";
import { OrbEffect } from "@/components/OrbEffect";
import { getQueryFn } from "@/lib/query-client";

function renderMarkdown(content: string, colors: any) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<View key={`sp-${i}`} style={{ height: 8 }} />);
      continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <PremiumText key={i} variant="body" style={{ fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 4 }}>
          {formatInline(trimmed.slice(4), colors)}
        </PremiumText>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <PremiumText key={i} variant="title" style={{ fontSize: 20, marginTop: 20, marginBottom: 6 }}>
          {formatInline(trimmed.slice(3), colors)}
        </PremiumText>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <View key={i} style={{ flexDirection: "row", gap: 8, paddingLeft: 4, marginTop: 4 }}>
          <PremiumText variant="body" color={colors.primary} style={{ fontSize: 14 }}>{"\u2022"}</PremiumText>
          <PremiumText variant="body" color={colors.textSecondary} style={{ flex: 1, fontSize: 14, lineHeight: 22 }}>
            {formatInline(trimmed.slice(2), colors)}
          </PremiumText>
        </View>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      listIndex++;
      const text = trimmed.replace(/^\d+\.\s/, "");
      elements.push(
        <View key={i} style={{ flexDirection: "row", gap: 8, paddingLeft: 4, marginTop: 4 }}>
          <PremiumText variant="body" color={colors.primary} style={{ fontSize: 14, fontWeight: "600", width: 20 }}>{listIndex}.</PremiumText>
          <PremiumText variant="body" color={colors.textSecondary} style={{ flex: 1, fontSize: 14, lineHeight: 22 }}>
            {formatInline(text, colors)}
          </PremiumText>
        </View>
      );
    } else {
      listIndex = 0;
      elements.push(
        <PremiumText key={i} variant="body" color={colors.textSecondary} style={{ fontSize: 15, lineHeight: 24, marginTop: 2 }}>
          {formatInline(trimmed, colors)}
        </PremiumText>
      );
    }
  }
  return elements;
}

function formatInline(text: string, colors: any): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
}

export default function BlogPostScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery<any>({
    queryKey: ["/api/blog", slug as string],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <PremiumText variant="body" color={colors.textMuted}>Loading...</PremiumText>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
        <PremiumText variant="body" color={colors.textMuted} style={{ marginTop: 12 }}>Post not found</PremiumText>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <PremiumText variant="body" color={colors.primary}>Go Back</PremiumText>
        </Pressable>
      </View>
    );
  }

  const tags = (post.tags || "").split(",").filter((t: string) => t.trim());

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {post.coverImage && (
          <Image
            source={{ uri: post.coverImage }}
            style={{ width: "100%", height: 220 } as any}
            contentFit="cover"
          />
        )}

        <View style={{ paddingTop: post.coverImage ? 0 : (insets.top + webTopInset + 10) }}>
          <View style={[styles.backBar, { paddingTop: post.coverImage ? (insets.top + webTopInset + 10) : 0 }]}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.backBtn, { backgroundColor: colors.surfaceElevated + "CC" }]}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <View style={[styles.catBadge, { backgroundColor: colors.primary + "20" }]}>
              <PremiumText variant="caption" color={colors.primary} style={{ fontSize: 10, fontWeight: "700" }}>
                {(post.category || "general").toUpperCase()}
              </PremiumText>
            </View>
            <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 11 }}>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : new Date(post.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </PremiumText>
          </View>

          <PremiumText variant="hero" style={{ fontSize: 26, lineHeight: 32, marginBottom: 8 }}>
            {post.title}
          </PremiumText>

          {post.excerpt && (
            <PremiumText variant="body" color={colors.textSecondary} style={{ fontSize: 16, lineHeight: 24, fontStyle: "italic", marginBottom: 12 }}>
              {post.excerpt}
            </PremiumText>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="person" size={14} color="#fff" />
            </View>
            <PremiumText variant="caption" color={colors.text} style={{ fontWeight: "600" }}>{post.authorName || "Trust Golf"}</PremiumText>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={{ marginTop: 16 }}>
            {renderMarkdown(post.content || "", colors)}
          </View>

          {tags.length > 0 && (
            <View style={{ marginTop: 24, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {tags.map((tag: string, i: number) => (
                <View key={i} style={[styles.tagPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <PremiumText variant="caption" color={colors.textSecondary} style={{ fontSize: 11 }}>#{tag.trim()}</PremiumText>
                </View>
              ))}
            </View>
          )}

          <GlassCard style={{ marginTop: 24 }}>
            <OrbEffect color={colors.primary + "15"} size={100} />
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <PremiumText variant="body" style={{ fontWeight: "700", textAlign: "center" }}>
                Improve Your Game with Trust Golf
              </PremiumText>
              <PremiumText variant="caption" color={colors.textSecondary} style={{ textAlign: "center", marginTop: 6, lineHeight: 18 }}>
                AI swing analysis, 45+ courses, score tracking, and exclusive deals.
              </PremiumText>
              <Pressable
                onPress={() => router.push("/(tabs)")}
                style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
              >
                <PremiumText variant="body" color="#fff" style={{ fontWeight: "700" }}>Explore Courses</PremiumText>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backBar: { position: "absolute", top: 0, left: 16, zIndex: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  divider: { height: 1 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  ctaBtn: { marginTop: 14, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});
