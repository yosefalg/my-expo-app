import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useUploadSearchImage, useStartVisualSearch } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSearch } from "@/context/SearchContext";
import { ScanAnimation } from "@/components/ScanAnimation";
import { ErrorReporter } from "@/components/ErrorReporter";
import { useColors } from "@/hooks/useColors";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type UploadState = "idle" | "picking" | "uploading" | "searching";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { setActiveJob } = useSearch();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const uploadMutation = useUploadSearchImage();
  const searchMutation = useStartVisualSearch();

  const searchScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const searchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  useEffect(() => {
    registerForNotifications();
  }, []);

  useEffect(() => {
    if (uploadState === "searching") {
      glowOpacity.value = withTiming(1, { duration: 500 });
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [uploadState]);

  const registerForNotifications = async () => {
    if (Platform.OS === "web") return;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
  };

  const sendSearchCompleteNotification = async (resultCount: number) => {
    if (Platform.OS === "web") return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✅ اكتمل البحث!",
        body: `تم العثور على ${resultCount} نتيجة`,
        sound: true,
      },
      trigger: null,
    });
  };

  const handlePickImage = async (source: "camera" | "gallery") => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    setErrorMsg("");
    setUploadState("picking");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    let result;
    try {
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setUploadState("idle");
          setErrorMsg("Camera permission denied");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          base64: true,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setUploadState("idle");
          setErrorMsg("Gallery permission denied");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          base64: true,
        });
      }

      if (result.canceled || !result.assets?.[0]) {
        setUploadState("idle");
        return;
      }

      const asset = result.assets[0];
      setSelectedImage(asset.uri);
      await doSearch(asset.base64 ?? "", asset.mimeType ?? "image/jpeg");
    } catch (e) {
      setUploadState("idle");
      setErrorMsg("Failed to pick image");
    }
  };

  const doSearch = async (base64Data: string, mimeType: string) => {
    setUploadState("uploading");
    try {
      const uploaded = await uploadMutation.mutateAsync({
        data: { imageData: base64Data, mimeType: mimeType as any },
      });

      setUploadState("searching");
      const job = await searchMutation.mutateAsync({
        data: { imageUrl: uploaded.imageUrl },
      });

      setActiveJob({
        id: job.id,
        imageUrl: job.imageUrl ?? uploaded.imageUrl,
        status: job.status,
        results: (job.results as any) ?? [],
        totalResults: job.totalResults ?? 0,
        processingTimeMs: job.processingTimeMs ?? null,
        createdAt: job.createdAt,
        completedAt: job.completedAt ?? null,
        error: job.error ?? null,
      });

      await sendSearchCompleteNotification(job.totalResults ?? 0);
      router.push(`/results/${job.id}`);
    } catch (e: any) {
      setUploadState("idle");
      setErrorMsg(e?.message ?? "Search failed. Please try again.");
    }
  };

  const isSearching = uploadState !== "idle";
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: bottomPad + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {isAuthenticated ? `👋 ${t.search}, ${user?.name?.split(" ")[0] ?? ""}` : "👋 Welcome"}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>OmniVision</Text>
        </View>
        <Pressable
          onPress={() => isAuthenticated ? router.push("/profile") : router.push("/auth")}
          style={[styles.avatarBtn, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}
        >
          {isAuthenticated ? (
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.name?.[0]?.toUpperCase() ?? "G"}
            </Text>
          ) : (
            <Feather name="user" size={18} color={colors.primary} />
          )}
        </Pressable>
      </Animated.View>

      {/* Error Reporter */}
      {errorMsg ? (
        <ErrorReporter
          error={errorMsg}
          onDismiss={() => setErrorMsg("")}
        />
      ) : null}

      {/* Scan Zone */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.scanZone}>
        <View style={styles.scanWrapper}>
          {/* Glow effect */}
          <Animated.View style={[styles.glowRing, glowStyle, { borderColor: colors.accent }]} />

          {selectedImage && isSearching ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={[styles.previewImage, { borderColor: colors.accent }]}
                contentFit="cover"
              />
              <View style={styles.scanOverlay}>
                <ScanAnimation size={220} active={isSearching} />
              </View>
            </View>
          ) : (
            <LinearGradient
              colors={[colors.card, colors.highlight]}
              style={[styles.dropZone, { borderColor: colors.accent + "40" }]}
            >
              <ScanAnimation size={140} active={false} />
              <Text style={[styles.dropHint, { color: colors.mutedForeground }]}>
                {t.pickImage}
              </Text>
              <Text style={[styles.dropSubHint, { color: colors.mutedForeground + "80" }]}>
                {t.searchSubtitle}
              </Text>
            </LinearGradient>
          )}
        </View>

        {isSearching && (
          <Animated.View entering={FadeIn} style={[styles.stateRow, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.stateText, { color: colors.primary }]}>
              {uploadState === "uploading" ? "⬆️ رفع الصورة..." : "🔍 جاري البحث في المحركات..."}
            </Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.actions}>
        <Animated.View style={searchAnimStyle}>
          <Pressable
            onPressIn={() => { searchScale.value = withSpring(0.96); }}
            onPressOut={() => { searchScale.value = withSpring(1); }}
            onPress={() => handlePickImage("gallery")}
            disabled={isSearching}
            style={[styles.primaryBtnWrapper, isSearching && styles.disabled]}
          >
            <LinearGradient
              colors={["#3B82F6", "#1D4ED8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Feather name="image" size={22} color="#fff" />
              <Text style={styles.primaryBtnText}>{t.gallery}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <Pressable
          style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }, isSearching && styles.disabled]}
          onPress={() => handlePickImage("camera")}
          disabled={isSearching}
        >
          <Feather name="camera" size={22} color={colors.primary} />
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>{t.camera}</Text>
        </Pressable>
      </Animated.View>

      {/* Feature chips */}
      <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.featureRow}>
        {[
          { icon: "search" as const, label: "Multi-Engine" },
          { icon: "layers" as const, label: "Dedup" },
          { icon: "award" as const, label: "AI Ranked" },
          { icon: "zap" as const, label: "Fast" },
        ].map((f) => (
          <View key={f.label} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={f.icon} size={12} color={colors.accent} />
            <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Plan badge */}
      {isAuthenticated && (
        <Animated.View
          entering={FadeInDown.delay(550).springify()}
          style={[styles.planBadge, { backgroundColor: colors.highlight, borderColor: colors.primary + "30" }]}
        >
          <Feather name="shield" size={14} color={colors.primary} />
          <Text style={[styles.planText, { color: colors.primary }]}>
            {user?.plan?.toUpperCase() ?? "FREE"}
          </Text>
          {user?.searchesUsed !== undefined && (
            <Text style={[styles.planUsage, { color: colors.mutedForeground }]}>
              · {user.searchesUsed}/{user.searchesLimit ?? "∞"}
            </Text>
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 24 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  greeting: { fontSize: 13, fontWeight: "500" as const, marginBottom: 2 },
  title: { fontSize: 30, fontWeight: "800" as const, letterSpacing: -1 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" as const },
  scanZone: { alignItems: "center", gap: 16 },
  scanWrapper: { alignItems: "center", justifyContent: "center" },
  glowRing: { position: "absolute", width: 280, height: 280, borderRadius: 140, borderWidth: 2, zIndex: 0 },
  imagePreviewContainer: { width: 260, height: 260, borderRadius: 20, overflow: "hidden" },
  previewImage: { width: "100%", height: "100%", borderWidth: 2, borderRadius: 20 },
  scanOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  dropZone: { width: 260, height: 260, borderRadius: 28, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 12 },
  dropHint: { fontSize: 15, fontWeight: "600" as const },
  dropSubHint: { fontSize: 12, textAlign: "center", paddingHorizontal: 20 },
  stateRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  stateText: { fontSize: 13, fontWeight: "600" as const },
  actions: { gap: 12 },
  primaryBtnWrapper: { borderRadius: 16, overflow: "hidden" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, height: 56, borderRadius: 16 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" as const },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, height: 52, borderRadius: 16, borderWidth: 1.5 },
  secondaryBtnText: { fontSize: 16, fontWeight: "600" as const },
  disabled: { opacity: 0.5 },
  featureRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: "500" as const },
  planBadge: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  planText: { fontSize: 12, fontWeight: "700" as const },
  planUsage: { fontSize: 12 },
});
