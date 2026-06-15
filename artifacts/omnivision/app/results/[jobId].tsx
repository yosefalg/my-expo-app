import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetSearchJob } from "@workspace/api-client-react";
import { useSearch } from "@/context/SearchContext";
import { SearchResultCard } from "@/components/SearchResultCard";
import { ProviderStatusRow } from "@/components/ProviderStatusRow";
import { useColors } from "@/hooks/useColors";

type Tab = "results" | "sources" | "providers";

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { activeJob, addToHistory } = useSearch();
  const [activeTab, setActiveTab] = useState<Tab>("results");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: job, refetch } = useGetSearchJob(jobId ?? "", {
    query: { enabled: !!jobId },
  });

  const isRunning = job?.status === "pending" || job?.status === "running";

  useEffect(() => {
    if (isRunning) {
      pollingRef.current = setInterval(() => refetch(), 2000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (job && (job.status === "completed" || job.status === "failed")) {
        addToHistory({
          id: job.id,
          imageUrl: job.imageUrl ?? activeJob?.imageUrl ?? "",
          status: job.status,
          results: (job.results as any) ?? [],
          totalResults: job.totalResults ?? 0,
          processingTimeMs: job.processingTimeMs ?? null,
          createdAt: job.createdAt,
          completedAt: job.completedAt ?? null,
          error: job.error ?? null,
        });
      }
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [isRunning, job?.status]);

  const displayJob = job ?? activeJob;
  const results = (displayJob as any)?.results ?? [];
  const providerResults = (displayJob as any)?.providerResults ?? [];

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const TABS: { key: Tab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "results", label: "Results", icon: "list" },
    { key: "providers", label: "Engines", icon: "server" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>

        {displayJob?.imageUrl ? (
          <Image
            source={{ uri: displayJob.imageUrl }}
            style={[styles.headerThumb, { backgroundColor: colors.muted }]}
            contentFit="cover"
          />
        ) : null}

        <View style={styles.headerMeta}>
          <View style={styles.statusRow}>
            {isRunning ? (
              <>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.statusText, { color: colors.primary }]}>Searching...</Text>
              </>
            ) : (
              <>
                <View style={[styles.statusDot, { backgroundColor: displayJob?.status === "completed" ? "#10B981" : "#EF4444" }]} />
                <Text style={[styles.statusText, { color: colors.foreground }]}>
                  {displayJob?.totalResults ?? results.length} results
                </Text>
              </>
            )}
          </View>
          {displayJob?.processingTimeMs ? (
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
              {displayJob.processingTimeMs}ms
            </Text>
          ) : null}
        </View>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabs, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Feather
              name={tab.icon}
              size={14}
              color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? colors.primary : colors.mutedForeground },
                activeTab === tab.key && { fontWeight: "700" as const },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === "results" ? (
        <FlatList
          data={results}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20 },
          ]}
          scrollEnabled={!!results.length}
          ListEmptyComponent={
            isRunning ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Querying search engines in parallel...
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="search" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Try a different image or enable more search engines
                </Text>
              </View>
            )
          }
          renderItem={({ item, index }: { item: any; index: number }) => (
            <SearchResultCard result={item} index={index} />
          )}
        />
      ) : (
        <FlatList
          data={providerResults.length ? providerResults : []}
          keyExtractor={(item: any) => item.providerId}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20 },
          ]}
          scrollEnabled={!!providerResults.length}
          ListEmptyComponent={
            isRunning ? (
              <Animated.View entering={FadeIn} style={styles.loadingState}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Engines running in parallel...
                </Text>
              </Animated.View>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="server" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No engine data</Text>
              </View>
            )
          }
          ListHeaderComponent={
            providerResults.length ? (
              <Animated.View entering={FadeInDown.springify()} style={styles.engineHeader}>
                <Text style={[styles.engineHeaderText, { color: colors.foreground }]}>
                  {providerResults.length} engines queried in parallel
                </Text>
              </Animated.View>
            ) : null
          }
          renderItem={({ item }: { item: any }) => (
            <ProviderStatusRow
              providers={[{
                providerId: item.providerId,
                providerName: item.providerName,
                status: item.status === "success" ? "success" : item.status === "failed" ? "failed" : "skipped",
                resultCount: item.resultCount,
                processingTimeMs: item.processingTimeMs,
              }]}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  headerMeta: { flex: 1, gap: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: "600" as const },
  timeText: { fontSize: 12 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  tabLabel: { fontSize: 13, fontWeight: "500" as const },
  list: { padding: 14, gap: 0 },
  loadingState: { alignItems: "center", gap: 16, paddingTop: 60 },
  loadingText: { fontSize: 14, textAlign: "center" },
  emptyState: { alignItems: "center", gap: 12, paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "700" as const, textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  engineHeader: { paddingBottom: 10 },
  engineHeaderText: { fontSize: 13, fontWeight: "600" as const },
});
