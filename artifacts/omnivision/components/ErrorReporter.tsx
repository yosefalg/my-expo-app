import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

// ⚠️ أمان: التوكن مكتوب صراحةً – لا تشارك هذا الملف مع أي شخص
const GEMINI_API_KEY = "AQ.Ab8RN6IWXMwcPMRoQ3x74G9TOAXj3pOpDn1_Sx0cCaj8Icb5Hw";

interface Props {
  error: string;
  onDismiss: () => void;
  onAIFix?: (suggestion: string) => void;
}

export function ErrorReporter({ error, onDismiss, onAIFix }: Props) {
  const colors = useColors();
  const [loading, setLoading] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState("");
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  const askGemini = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `App error in OmniVision React Native app: "${error}". Give a SHORT user-friendly fix suggestion in Arabic (max 2 sentences).`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        "حدث خطأ في الاتصال، حاول مرة أخرى.";
      setSuggestion(text);
      onAIFix?.(text);
    } catch (err) {
      setSuggestion("تحقق من اتصالك بالإنترنت وأعد المحاولة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: "#1a0a0a",
          borderColor: "#EF444440",
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.title}>حدث خطأ</Text>
        </View>
        <Pressable onPress={onDismiss}>
          <Feather name="x" size={18} color="#94A3B8" />
        </Pressable>
      </View>

      <Text style={styles.errorText}>{error}</Text>

      {suggestion ? (
        <View style={styles.suggestionBox}>
          <Text style={styles.suggestionLabel}>💡 اقتراح Gemini:</Text>
          <Text style={styles.suggestionText}>{suggestion}</Text>
        </View>
      ) : (
        <Pressable
          style={[styles.aiBtn, { opacity: loading ? 0.6 : 1 }]}
          onPress={askGemini}
          disabled={loading}
        >
          <Text style={styles.aiBtnText}>
            {loading ? "⏳ جاري التحليل..." : "🤖 اسأل Gemini لإصلاحه"}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#EF4444", fontWeight: "700", fontSize: 14 },
  errorText: { color: "#94A3B8", fontSize: 13, lineHeight: 20 },
  suggestionBox: {
    backgroundColor: "#0f2a1a",
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#10B98130",
  },
  suggestionLabel: { color: "#10B981", fontSize: 12, fontWeight: "700" },
  suggestionText: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
  },
  aiBtn: {
    backgroundColor: "#1E3A5F",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  aiBtnText: { color: "#60A5FA", fontWeight: "600", fontSize: 13 },
});
