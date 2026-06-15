import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = async () => {
    setError("");
    if (!email || !password || (mode === "register" && !name)) {
      setError("Please fill in all fields");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      if (mode === "login") {
        const result = await loginMutation.mutateAsync({ data: { email, password } });
        await login(result.token, result.user as any);
      } else {
        const result = await registerMutation.mutateAsync({ data: { email, password, name } });
        await login(result.token, result.user as any);
      }
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.data?.error ?? "Something went wrong");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40), paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
            <Feather name="eye" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>OmniVision</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            AI-Powered Visual Search
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
          <View style={[styles.cardInner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Mode toggle */}
            <View style={[styles.modeToggle, { backgroundColor: colors.muted }]}>
              {(["login", "register"] as const).map(m => (
                <Pressable
                  key={m}
                  style={[
                    styles.modeBtn,
                    mode === m && { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
                  ]}
                  onPress={() => { setMode(m); setError(""); }}
                >
                  <Text style={[styles.modeBtnText, { color: mode === m ? colors.primary : colors.mutedForeground }]}>
                    {m === "login" ? "Sign In" : "Create Account"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.form}>
              {mode === "register" && (
                <View style={[styles.inputWrap, { borderColor: colors.input, backgroundColor: colors.background }]}>
                  <Feather name="user" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Full name"
                    placeholderTextColor={colors.mutedForeground}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={[styles.inputWrap, { borderColor: colors.input, backgroundColor: colors.background }]}>
                <Feather name="mail" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Email address"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={[styles.inputWrap, { borderColor: colors.input, backgroundColor: colors.background }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {error ? (
                <Animated.View entering={FadeIn} style={[styles.errorBox, { backgroundColor: "#EF444420", borderColor: "#EF444440" }]}>
                  <Feather name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </Pressable>
            </View>

            {mode === "login" && (
              <Text style={[styles.demoHint, { color: colors.mutedForeground }]}>
                Demo: demo@omnivision.ai / password
              </Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { alignItems: "center", marginBottom: 32 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5 },
  tagline: { fontSize: 14, marginTop: 4 },
  card: { width: "100%" },
  cardInner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modeToggle: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modeBtnText: { fontSize: 14, fontWeight: "600" as const },
  form: { gap: 12 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: { color: "#EF4444", fontSize: 13 },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" as const },
  demoHint: { fontSize: 11, textAlign: "center", marginTop: 12 },
});
