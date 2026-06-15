import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetSearchHistory } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, refetch } = useGetSearchHistory({}, { query: { enabled: isAuthenticated } });

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const items = data?.items ?? [];

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in required</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Sign in to view your search history</Text>
        <Pressable
          style={[styles.signInBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/auth")}
        >
          <Text style={{ color: "#fff", fontWeight: "700" as const, fontSize: 15 }}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn} style={[styles.headerBar, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>History</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{items.length} searches</Text>
      </Animated.View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90,
          }
        ]}
        scrollEnabled={!!items.length}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No searches yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Start searching by uploading an image on the home screen
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <Pressable
              style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/results/${item.id}`);
              }}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={[styles.thumb, { backgroundColor: colors.muted }]}
                contentFit="cover"
              />
              <View style={styles.cardBody}>
                <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                  {formatDate(item.createdAt)}
                </Text>
                <View style={styles.cardStats}>
                  <View style={[styles.statChip, { backgroundColor: colors.highlight }]}>
                    <Feather name="search" size={11} color={colors.primary} />
                    <Text style={[styles.statText, { color: colors.primary }]}>
                      {item.totalResults ?? 0} results
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === "completed" ? "#10B98120" : "#EF444420" }
                  ]}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: "600" as const,
                      color: item.status === "completed" ? "#10B981" : "#EF4444",
                    }}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                {item.processingTimeMs ? (
                  <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                    {item.processingTimeMs}ms processing
                  </Text>
                ) : null}
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  headerBar: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  screenTitle: { fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.5 },
  count: { fontSize: 13 },
  list: { padding: 16, gap: 10 },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    gap: 14,
    paddingRight: 14,
  },
  thumb: {
    width: 80,
    height: 80,
  },
  cardBody: { flex: 1, gap: 5 },
  cardDate: { fontSize: 12 },
  cardStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statText: { fontSize: 11, fontWeight: "600" as const },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeText: { fontSize: 11 },
  emptyState: { alignItems: "center", gap: 12, paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  signInBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
});
