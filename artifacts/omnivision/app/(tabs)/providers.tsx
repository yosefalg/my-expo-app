import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetProviders, useToggleProvider, getGetProvidersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const PROVIDER_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  google_lens: "search",
  bing_visual: "globe",
  tineye: "repeat",
  yandex: "map",
  gemini_vision: "cpu",
  openai_vision: "zap",
};

export default function ProvidersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const { data: providers = [], isLoading } = useGetProviders({
    query: { enabled: isAuthenticated },
  });
  const toggleMutation = useToggleProvider();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleToggle = async (id: string, newValue: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await toggleMutation.mutateAsync({ id, data: { enabled: newValue } });
      qc.invalidateQueries({ queryKey: getGetProvidersQueryKey() });
    } catch {}
  };

  const grouped = providers.reduce<Record<string, typeof providers>>((acc, p) => {
    const key = p.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const TYPE_LABELS: Record<string, string> = {
    reverse_image: "Reverse Image Search",
    ai_vision: "AI Vision Analysis",
    metadata: "Metadata Extraction",
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Search Engines</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enable or disable search providers
        </Text>
      </Animated.View>

      {Object.entries(grouped).map(([type, group], gi) => (
        <Animated.View key={type} entering={FadeInDown.delay(gi * 100).springify()}>
          <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
            {TYPE_LABELS[type] ?? type}
          </Text>
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {group.map((provider, pi) => (
              <View key={provider.id}>
                {pi > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.providerRow}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.highlight }]}>
                    <Feather
                      name={PROVIDER_ICONS[provider.id] ?? "search"}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={[styles.providerName, { color: colors.foreground }]}>
                      {provider.name}
                    </Text>
                    <Text style={[styles.providerDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {provider.description}
                    </Text>
                    {provider.successRate != null && (
                      <View style={styles.statsRow}>
                        <Feather name="activity" size={10} color={colors.success} />
                        <Text style={[styles.statsText, { color: colors.success }]}>
                          {Math.round(provider.successRate * 100)}% success
                        </Text>
                        {provider.avgResponseMs != null && (
                          <Text style={[styles.statsText, { color: colors.mutedForeground }]}>
                            · {provider.avgResponseMs}ms avg
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                  <Switch
                    value={provider.enabled}
                    onValueChange={(v) => handleToggle(provider.id, v)}
                    trackColor={{ false: colors.muted, true: colors.primary + "60" }}
                    thumbColor={provider.enabled ? colors.primary : colors.mutedForeground}
                  />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      ))}

      {!isLoading && providers.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="server" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No providers available
          </Text>
        </View>
      )}

      <Animated.View
        entering={FadeInDown.delay(400).springify()}
        style={[styles.infoBox, { backgroundColor: colors.highlight, borderColor: colors.primary + "30" }]}
      >
        <Feather name="info" size={14} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.primary }]}>
          Enabled providers will run in parallel for each search. More providers = better coverage but slower results.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  screenTitle: { fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 8 },
  groupLabel: { fontSize: 12, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: { height: 1, marginHorizontal: 16 },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  providerInfo: { flex: 1, gap: 2 },
  providerName: { fontSize: 15, fontWeight: "600" as const },
  providerDesc: { fontSize: 12 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  statsText: { fontSize: 11, fontWeight: "500" as const },
  emptyState: { alignItems: "center", gap: 10, paddingTop: 60 },
  emptyText: { fontSize: 14 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
