import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { useColors } from "@/hooks/useColors";

const PLAN_COLORS: Record<string, string> = {
  free: "#6B7280",
  pro: "#3B82F6",
  enterprise: "#8B5CF6",
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, isAuthenticated } = useAuth();
  const { data: me } = useGetMe({ query: { enabled: isAuthenticated } });

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const planColor = PLAN_COLORS[me?.plan ?? user?.plan ?? "free"] ?? "#6B7280";
  const usedPct = me?.searchesUsed && me?.searchesLimit ? me.searchesUsed / me.searchesLimit : 0;

  const handleLogout = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    router.replace("/auth");
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Feather name="user" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Not signed in</Text>
        <Pressable
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/auth")}
        >
          <Text style={{ color: "#fff", fontWeight: "700" as const, fontSize: 15 }}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  const displayUser = me ?? user;

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
      {/* Avatar section */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: planColor + "20", borderColor: planColor + "40" }]}>
          <Text style={[styles.avatarChar, { color: planColor }]}>
            {displayUser?.name?.[0]?.toUpperCase() ?? "U"}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.foreground }]}>{displayUser?.name}</Text>
        <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{displayUser?.email}</Text>
        <View style={[styles.planBadge, { backgroundColor: planColor + "20", borderColor: planColor + "40" }]}>
          <Feather name="shield" size={12} color={planColor} />
          <Text style={[styles.planText, { color: planColor }]}>
            {displayUser?.plan?.toUpperCase() ?? "FREE"}
          </Text>
        </View>
      </Animated.View>

      {/* Usage */}
      {displayUser?.searchesLimit != null && (
        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Search Usage</Text>
          <ConfidenceBar
            label={`${displayUser.searchesUsed ?? 0} / ${displayUser.searchesLimit} searches used`}
            value={usedPct}
            color={planColor}
          />
          {(displayUser.plan === "free") && (
            <Pressable
              style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
              onPress={() => {}}
            >
              <Feather name="zap" size={14} color="#fff" />
              <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {/* Stats */}
      <Animated.View
        entering={FadeInDown.delay(250).springify()}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Account Info</Text>
        {[
          { icon: "user" as const, label: "Name", value: displayUser?.name },
          { icon: "mail" as const, label: "Email", value: displayUser?.email },
          { icon: "shield" as const, label: "Plan", value: displayUser?.plan?.toUpperCase() },
          { icon: "settings" as const, label: "Role", value: displayUser?.role },
        ].map((item) => (
          <View key={item.label} style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <View style={styles.infoLeft}>
              <Feather name={item.icon} size={14} color={colors.mutedForeground} />
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value ?? "—"}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Logout */}
      <Animated.View entering={FadeInDown.delay(350).springify()}>
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            { borderColor: "#EF4444", opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={18} color="#EF4444" />
          <Text style={{ color: "#EF4444", fontWeight: "600" as const, fontSize: 15 }}>Sign Out</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  content: { paddingHorizontal: 20, gap: 16 },
  avatarSection: { alignItems: "center", gap: 8, paddingVertical: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarChar: { fontSize: 32, fontWeight: "800" as const },
  userName: { fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.5 },
  userEmail: { fontSize: 14 },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  planText: { fontSize: 12, fontWeight: "700" as const },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: "700" as const, letterSpacing: 0.2 },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  upgradeBtnText: { color: "#fff", fontWeight: "700" as const, fontSize: 14 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: "600" as const },
  emptyTitle: { fontSize: 20, fontWeight: "700" as const },
  ctaBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
  },
});
