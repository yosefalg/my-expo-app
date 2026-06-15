import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface ProviderStatus {
  providerId: string;
  providerName: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  resultCount?: number;
  processingTimeMs?: number | null;
}

interface Props {
  providers: ProviderStatus[];
}

const STATUS_ICON: Record<string, { icon: keyof typeof Feather.glyphMap; color: string } | null> = {
  running: null,
  success: { icon: "check-circle", color: "#10B981" },
  failed: { icon: "x-circle", color: "#EF4444" },
  skipped: { icon: "minus-circle", color: "#6B7280" },
  pending: { icon: "clock", color: "#F59E0B" },
};

export function ProviderStatusRow({ providers }: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {providers.map((p, i) => {
        const statusInfo = STATUS_ICON[p.status];
        return (
          <Animated.View
            key={p.providerId}
            entering={FadeIn.delay(i * 100)}
            style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <View style={styles.left}>
              {p.status === "running" ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : statusInfo ? (
                <Feather name={statusInfo.icon} size={18} color={statusInfo.color} />
              ) : null}
              <Text style={[styles.name, { color: colors.foreground }]}>{p.providerName}</Text>
            </View>
            <View style={styles.right}>
              {p.status === "success" && p.resultCount !== undefined ? (
                <Text style={[styles.count, { color: colors.primary }]}>
                  {p.resultCount} results
                </Text>
              ) : null}
              {p.status === "running" ? (
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Searching...</Text>
              ) : p.status === "failed" ? (
                <Text style={[styles.label, { color: "#EF4444" }]}>Failed</Text>
              ) : p.status === "skipped" ? (
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Skipped</Text>
              ) : null}
              {p.processingTimeMs ? (
                <Text style={[styles.time, { color: colors.mutedForeground }]}>
                  {p.processingTimeMs}ms
                </Text>
              ) : null}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  count: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  label: {
    fontSize: 12,
  },
  time: {
    fontSize: 11,
  },
});
