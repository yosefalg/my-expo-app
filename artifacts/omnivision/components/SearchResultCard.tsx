import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { LocalSearchResult } from "@/context/SearchContext";

interface Props {
  result: LocalSearchResult;
  index: number;
}

const MATCH_COLORS: Record<string, string> = {
  exact: "#10B981",
  similar: "#F59E0B",
  partial: "#6B7280",
};

export function SearchResultCard({ result, index }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Linking.openURL(result.url);
    } catch {}
  };

  const onPressIn = () => { scale.value = withSpring(0.97); };
  const onPressOut = () => { scale.value = withSpring(1); };

  const confidencePct = Math.round(result.confidence * 100);
  const matchColor = MATCH_COLORS[result.matchType] ?? "#6B7280";

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={animStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {result.thumbnailUrl ? (
          <Image
            source={{ uri: result.thumbnailUrl }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={20} color={colors.mutedForeground} />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={[styles.matchBadge, { backgroundColor: matchColor + "22", borderColor: matchColor + "44" }]}>
              <Text style={[styles.matchText, { color: matchColor }]}>
                {result.matchType}
              </Text>
            </View>
            <View style={[styles.confidenceBadge, { backgroundColor: colors.highlight }]}>
              <Text style={[styles.confidenceText, { color: colors.primary }]}>
                {confidencePct}%
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {result.title || result.pageTitle || "Untitled"}
          </Text>

          {result.siteName ? (
            <Text style={[styles.siteName, { color: colors.mutedForeground }]} numberOfLines={1}>
              {result.siteName}
            </Text>
          ) : null}

          <View style={styles.footer}>
            <View style={[styles.providerTag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.providerText, { color: colors.mutedForeground }]}>
                {result.providerName}
              </Text>
            </View>
            <Feather name="external-link" size={13} color={colors.mutedForeground} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  thumbnail: {
    width: 90,
    height: 90,
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 10,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matchBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  matchText: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  title: {
    fontSize: 13,
    fontWeight: "600" as const,
    lineHeight: 18,
  },
  siteName: {
    fontSize: 11,
    lineHeight: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  providerTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  providerText: {
    fontSize: 10,
    fontWeight: "500" as const,
  },
});
