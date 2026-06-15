import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { data: me } = useGetMe({ query: { enabled: isAuthenticated } });

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const planColor = PLAN_COLORS[me?.plan ?? user?.plan ?? "free"] ?? "#6B7280";
  const usedPct = me?.searchesUsed && me?.searchesLimit ? me.searchesUsed / me.searchesLimit : 0;

  const handleLogout = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    router.replace("/auth");
  };

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
      {/* Avatar */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: planColor + "20", borderColor: planColor + "40" }]}>
          <Text style={[styles.avatarChar, { color: planColor }]}>
            {displayUser?.name?.[0]?.toUpperCase() ?? "G"}
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

      {/* Language Selector */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          🌐 {t.language}
        </Text>
        <View style={styles.langRow}>
          {(["en", "ar"] as const).map((lang) => (
            <Pressable
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[
                styles.langBtn,
                {
                  backgroundColor: language === lang ? colors.primary : colors.muted,
                  borderColor: language === lang ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[
                styles.langBtnText,
                { color: language === lang ? "#fff" : colors.mutedForeground },
              ]}>
                {lang === "ar" ? `🇮🇶 ${t.arabic}` : `🇺🇸 ${t.english}`}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Usage */}
      {displayUser?.searchesLimit != null && (
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.searchUsage}</Text>
          <ConfidenceBar
            label={`${displayUser.searchesUsed ?? 0} / ${displayUser.searchesLimit}`}
            value={usedPct}
            color={planColor}
          />
          {displayUser.plan === "free" && (
            <Pressable style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}>
              <Feather name="zap" size={14} color="#fff" />
              <Text style={styles.upgradeBtnText}>{t.upgradePro}</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {/* Account Info */}
      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.accountInfo}</Text>
        {[
          { icon: "user" as const, label: t.name, value: displayUser?.name },
          { icon: "mail" as const, label: t.email, value: displayUser?.email },
          { icon: "shield" as const, label: t.plan, value: displayUser?.plan?.toUpperCase() },
          { icon: "settings" as const, label: t.role, value: displayUser?.role },
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

      {/* Sign Out */}
      <Animated.View entering={FadeInDown.delay(400).springify()}>
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            { borderColor: "#EF4444", opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={18} color="#EF4444" />
          <Text style={{ color: "#EF4444", fontWeight: "600" as const, fontSize: 15 }}>{t.signOut}</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  avatarSection: { alignItems: "center", gap: 8, paddingVertical: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
  },
  avatarChar: { fontSize: 32, fontWeight: "800" as const },
  userName: { fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.5 },
  userEmail: { fontSize: 14 },
  planBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  planText: { fontSize: 12, fontWeight: "700" as const },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700" as const, letterSpacing: 0.2 },
  langRow: { flexDirection: "row", gap: 10 },
  langBtn: {
    flex: 1, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  langBtnText: { fontSize: 14, fontWeight: "600" as const },
  upgradeBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  upgradeBtnText: { color: "#fff", fontWeight: "700" as const, fontSize: 14 },
  infoRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10, borderTopWidth: 1,
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: "600" as const },
  logoutBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10,
    height: 52, borderRadius: 14, borderWidth: 1.5,
  },
});
