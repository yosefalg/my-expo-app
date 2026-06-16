import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!isAuthenticated) {
      setError("الرجاء تسجيل الدخول أولاً");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // محاكاة عملية البحث
      setTimeout(() => {
        setLoading(false);
        router.push("/results");
      }, 2000);
    } catch (e) {
      setError("فشل البحث");
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.foreground }]}>Visual Search</Text>
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          {isAuthenticated ? `Hello, ${user?.name || "User"}` : "Hello, Guest"}
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="search" size={20} color="#fff" />
              <Text style={styles.btnText}>Start Search</Text>
            </>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            0/100 searches used
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20, flex: 1 },
  title: { fontSize: 28, fontWeight: "bold" },
  greeting: { fontSize: 16 },
  errorBox: { backgroundColor: "#ffcccc", padding: 10, borderRadius: 8 },
  errorText: { color: "#cc0000" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 10 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: { marginTop: 30, alignItems: "center" },
  footerText: { fontSize: 12 },
});
