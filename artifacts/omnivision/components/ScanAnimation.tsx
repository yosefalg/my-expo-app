import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface Props {
  size?: number;
  active?: boolean;
}

export function ScanAnimation({ size = 200, active = true }: Props) {
  const colors = useColors();
  const scanY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const outerRingOpacity = useSharedValue(0.3);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scanY.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      pulseScale.value = withRepeat(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      outerRingOpacity.value = withRepeat(
        withTiming(1, { duration: 1200 }),
        -1,
        true,
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(scanY);
      cancelAnimation(pulseScale);
      cancelAnimation(outerRingOpacity);
      cancelAnimation(rotation);
    }
  }, [active]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value * size - 2 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: outerRingOpacity.value,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer rotating ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.accent,
          },
          ringStyle,
        ]}
      />

      {/* Inner pulsing circle */}
      <Animated.View
        style={[
          styles.innerCircle,
          {
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: (size * 0.85) / 2,
            backgroundColor: colors.primary + "10",
            borderColor: colors.primary + "30",
          },
          pulseStyle,
        ]}
      />

      {/* Corner brackets */}
      <View style={[styles.cornerTL, { borderColor: colors.accent }]} />
      <View style={[styles.cornerTR, { borderColor: colors.accent }]} />
      <View style={[styles.cornerBL, { borderColor: colors.accent }]} />
      <View style={[styles.cornerBR, { borderColor: colors.accent }]} />

      {/* Scan line */}
      <View style={[styles.scanMask, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.scanLine,
            { backgroundColor: colors.accent, width: size },
            scanLineStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  outerRing: {
    position: "absolute",
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  innerCircle: {
    position: "absolute",
    borderWidth: 1,
  },
  scanMask: {
    position: "absolute",
    overflow: "hidden",
  },
  scanLine: {
    height: 2,
    position: "absolute",
    left: 0,
    opacity: 0.8,
  },
  cornerTL: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 20,
    height: 20,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRadius: 3,
  },
  cornerTR: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderRadius: 3,
  },
  cornerBL: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRadius: 3,
  },
  cornerBR: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderRadius: 3,
  },
});
