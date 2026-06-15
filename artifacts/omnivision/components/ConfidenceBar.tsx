import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: number; // 0–1
  color?: string;
}

export function ConfidenceBar({ label, value, color }: Props) {
  const colors = useColors();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(value, { damping: 20, stiffness: 90 });
  }, [value]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  const barColor = color ?? (value >= 0.8 ? "#10B981" : value >= 0.5 ? "#F59E0B" : "#EF4444");

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.value, { color: barColor }]}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <Animated.View style={[styles.fill, { backgroundColor: barColor }, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 12, fontWeight: "500" as const },
  value: { fontSize: 12, fontWeight: "700" as const },
  track: { height: 5, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
});
