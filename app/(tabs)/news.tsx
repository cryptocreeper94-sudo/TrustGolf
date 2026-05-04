import React, { useState, useEffect, useCallback } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, Platform,
  RefreshControl, Linking, ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { PremiumText } from "@/components/PremiumText";

interface NewsArticle {
  title: string;
  source: string;
  pubDate: string;
  link: string;
  imageUrl?: string;
}

const GOLF_NEWS_TOPICS = [
  { id: "all", label: "Top Stories", query: "golf" },
  { id: "pga", label: "PGA Tour", query: "PGA Tour golf" },
  { id: "lpga", label: "LPGA", query: "LPGA golf" },
  { id: "masters", label: "Majors", query: "golf major championship 2026" },
  { id: "gear", label: "Equipment", query: "golf equipment gear review" },
  { id: "liv", label: "LIV Golf", query: "LIV Golf" },
];

function parseRSSToArticles(xml: string, max = 10): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) && articles.length < max) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const sourceMatch = block.match(/<source[^>]*>(.*?)<\/source>/);
    const source = sourceMatch ? sourceMatch[1] : extractSource(title || "");

    if (title) {
      articles.push({
        title: decodeEntities(title),
        source: decodeEntities(source || "Golf News"),
        pubDate: pubDate || "",
        link: link || "",
      });
    }
  }

  return articles;
}

function extractTag(xml: string, tag: string): string | null {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, "i");
  const m = xml.match(regex);
  return m ? m[1].trim() : null;
}

function extractSource(title: string): string {
  const dash = title.lastIndexOf(" - ");
  return dash > 0 ? title.substring(dash + 3).trim() : "Golf News";
}

function decodeEntities(str: string): string {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SOURCE_COLORS: Record<string, string> = {
  "ESPN": "#D32F2F",
  "Golf Channel": "#1B5E20",
  "Golf Digest": "#333",
  "PGA Tour": "#003865",
  "CBS Sports": "#0D47A1",
  "The Athletic": "#0a0a0a",
  "BBC Sport": "#BB1919",
  "Sky Sports": "#E10600",
};

export default function NewsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = useCallback(async (topicId: string) => {
    const topic = GOLF_NEWS_TOPICS.find(t => t.id === topicId) || GOLF_NEWS_TOPICS[0];
    setLoading(true);
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(topic.query)}&hl=en-US&gl=US&ceid=US:en`;
      const response = await fetch(url);
      const xml = await response.text();
      const parsed = parseRSSToArticles(xml, 15);
      setArticles(parsed);
    } catch (err) {
      console.error("News fetch error:", err);
      setArticles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(activeTopic);
  }, [activeTopic]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNews(activeTopic);
  }, [activeTopic]);

  const handleTopicPress = (topicId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTopic(topicId);
  };

  const handleArticlePress = (article: NewsArticle) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (article.link) Linking.openURL(article.link);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: Platform.OS === "web" ? 6 : insets.top + 6 }]}>
        <View style={styles.headerRow}>
          <Ionicons name="newspaper" size={18} color="#fff" />
          <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 16 }}>Golf News</PremiumText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Topic Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {GOLF_NEWS_TOPICS.map((topic) => (
            <Pressable
              key={topic.id}
              onPress={() => handleTopicPress(topic.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: activeTopic === topic.id ? colors.primary : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                  borderColor: activeTopic === topic.id ? colors.primary : colors.border,
                },
              ]}
            >
              <PremiumText
                variant="caption"
                color={activeTopic === topic.id ? "#fff" : colors.text}
                style={{ fontSize: 12, fontWeight: "700" }}
              >
                {topic.label}
              </PremiumText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Articles */}
        <View style={styles.articlesContainer}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <PremiumText variant="caption" color={colors.textSecondary} style={{ marginTop: 12 }}>
                Fetching latest golf news...
              </PremiumText>
            </View>
          ) : articles.length === 0 ? (
            <View style={styles.loadingWrap}>
              <Ionicons name="newspaper-outline" size={48} color={colors.textMuted} />
              <PremiumText variant="body" color={colors.textSecondary} style={{ marginTop: 12 }}>
                No news found. Pull to refresh.
              </PremiumText>
            </View>
          ) : (
            articles.map((article, index) => {
              const sourceColor = SOURCE_COLORS[article.source] || colors.primary;
              const time = article.pubDate ? relativeTime(article.pubDate) : "";

              return (
                <Animated.View key={`${article.title}-${index}`} entering={FadeInDown.delay(index * 60).duration(400)}>
                  <GlassCard
                    style={styles.articleCard}
                    onPress={() => handleArticlePress(article)}
                  >
                    <View style={styles.articleContent}>
                      <View style={styles.articleMeta}>
                        <View style={[styles.sourceBadge, { backgroundColor: sourceColor + "18" }]}>
                          <PremiumText variant="caption" color={sourceColor} style={{ fontSize: 10, fontWeight: "800" }}>
                            {article.source}
                          </PremiumText>
                        </View>
                        {time ? (
                          <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>
                            {time}
                          </PremiumText>
                        ) : null}
                      </View>
                      <PremiumText variant="body" numberOfLines={3} style={{ fontSize: 14, lineHeight: 20 }}>
                        {article.title}
                      </PremiumText>
                      <View style={styles.readMore}>
                        <PremiumText variant="caption" color={colors.primary} style={{ fontSize: 11, fontWeight: "700" }}>
                          Read Full Article
                        </PremiumText>
                        <Ionicons name="open-outline" size={12} color={colors.primary} />
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>
              );
            })
          )}
        </View>

        <View style={styles.attribution}>
          <Ionicons name="globe-outline" size={12} color={colors.textMuted} />
          <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>
            Headlines via Google News RSS • Published sources cited
          </PremiumText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  articlesContainer: {
    paddingHorizontal: 14,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  articleCard: {
    marginBottom: 10,
  },
  articleContent: {
    gap: 8,
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  attribution: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 20,
  },
});
