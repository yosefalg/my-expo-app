import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUploadSearchImage, useStartVisualSearch } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";
import { ScanAnimation } from "@/components/ScanAnimation";
import { useColors } from "@/hooks/useColors";

type UploadState = "idle" | "picking" | "uploading" | "searching";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { setActiveJob } = useSearch();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const uploadMutation = useUploadSearchImage();
  const searchMutation = useStartVisualSearch();

  const searchScale = useSharedValue(1);
  const searchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

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
        data: {
          imageData: base64Data,
          mimeType: mimeType as any,
        },
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

      router.push(`/results/${job.id}`);
    } catch {
      setUploadState("idle");
      setErrorMsg("Search failed. Please try again.");
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
            {isAuthenticated ? `Hello, ${user?.name?.split(" ")[0] ?? "User"}` : "Welcome"}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Visual Search</Text>
        </View>
        <Pressable
          onPress={() => isAuthenticated ? router.push("/profile") : router.push("/auth")}
          style={[styles.avatarBtn, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}
        >
          {isAuthenticated ? (
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </Text>
          ) : (
            <Feather name="user" size={18} color={colors.primary} />
          )}
        </Pressable>
      </Animated.View>

      {/* Scan zone */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.scanZone}>
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
          <View style={[styles.dropZone, { borderColor: colors.accent + "60", backgroundColor: colors.card }]}>
            <ScanAnimation size={160} active={false} />
            <Text style={[styles.dropHint, { color: colors.mutedForeground }]}>
              Choose an image to search
            </Text>
          </View>
        )}

        {isSearching && (
          <Animated.View entering={FadeIn} style={styles.stateRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.stateText, { color: colors.primary }]}>
              {uploadState === "uploading" ? "Uploading image..." : "Searching across engines..."}
            </Text>
          </Animated.View>
        )}

        {errorMsg ? (
          <Animated.View entering={FadeIn} style={[styles.errorBox, { backgroundColor: "#EF444415", borderColor: "#EF444430" }]}>
            <Feather name="alert-circle" size={14} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontSize: 13 }}>{errorMsg}</Text>
          </Animated.View>
        ) : null}
      </Animated.View>

      {/* Action buttons */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.actions}>
        <Animated.View style={searchAnimStyle}>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, isSearching && styles.disabled]}
            onPressIn={() => { searchScale.value = withSpring(0.96); }}
            onPressOut={() => { searchScale.value = withSpring(1); }}
            onPress={() => handlePickImage("gallery")}
            disabled={isSearching}
          >
            <Feather name="image" size={22} color="#fff" />
            <Text style={styles.primaryBtnText}>Choose from Gallery</Text>
          </Pressable>
        </Animated.View>

        <Pressable
          style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }, isSearching && styles.disabled]}
          onPress={() => handlePickImage("camera")}
          disabled={isSearching}
        >
          <Feather name="camera" size={22} color={colors.primary} />
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Take Photo</Text>
        </Pressable>
      </Animated.View>

      {/* Feature chips */}
      <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.featureRow}>
        {[
          { icon: "search" as const, label: "Multi-Engine" },
          { icon: "layers" as const, label: "Dedup Results" },
          { icon: "award" as const, label: "Confidence Score" },
          { icon: "zap" as const, label: "Fast & Parallel" },
        ].map((f) => (
          <View key={f.label} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={f.icon} size={13} color={colors.accent} />
            <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Plan badge */}
      {isAuthenticated && (
        <Animated.View entering={FadeInDown.delay(550).springify()} style={[styles.planBadge, { backgroundColor: colors.highlight, borderColor: colors.primary + "30" }]}>
          <Feather name="shield" size={14} color={colors.primary} />
          <Text style={[styles.planText, { color: colors.primary }]}>
            {user?.plan?.toUpperCase() ?? "FREE"} PLAN
          </Text>
          {user?.searchesUsed !== undefined && (
            <Text style={[styles.planUsage, { color: colors.mutedForeground }]}>
              · {user.searchesUsed}/{user.searchesLimit ?? "∞"} searches used
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: { fontSize: 13, fontWeight: "500" as const, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5 },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700" as const },
  scanZone: { alignItems: "center", gap: 16 },
  imagePreviewContainer: {
    width: 260,
    height: 260,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderWidth: 2,
    borderRadius: 20,
  },
  scanOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  dropZone: {
    width: 260,
    height: 260,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  dropHint: { fontSize: 14, fontWeight: "500" as const },
  stateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stateText: { fontSize: 14, fontWeight: "600" as const },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actions: { gap: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 56,
    borderRadius: 16,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" as const },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: "600" as const },
  disabled: { opacity: 0.5 },
  featureRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: "500" as const },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  planText: { fontSize: 12, fontWeight: "700" as const },
  planUsage: { fontSize: 12 },
});
