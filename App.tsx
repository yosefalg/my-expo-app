import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Todo } from "./src/types";
import TodoItem from "./src/components/TodoItem";

const STORAGE_KEY = "TODOS_V1";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    // حفظ تلقائي عند تغير todos
    saveTodos(todos);
  }, [todos]);

  async function loadTodos() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Todo[] = JSON.parse(raw);
        setTodos(parsed);
      }
    } catch (e) {
      Alert.alert("خطأ", "فشل تحميل المه��م من التخزين المحلي.");
      console.error(e);
    }
  }

  async function saveTodos(list: Todo[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("فشل حفظ المهام:", e);
    }
  }

  function addTodo() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: trimmed,
      done: false,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    setText("");
    Keyboard.dismiss();
  }

  function toggleTodo(id: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function removeTodo(id: string) {
    Alert.alert("حذف المهمة", "هل تريد حذف هذه المهمة؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: () => setTodos((prev) => prev.filter((t) => t.id !== id)),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>قائمة المهام</Text>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="أضف مهمة..."
          value={text}
          onChangeText={setText}
          style={styles.input}
          onSubmitEditing={addTodo}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={addTodo} style={styles.addButton}>
          <Text style={styles.addButtonText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TodoItem todo={item} onToggle={() => toggleTodo(item.id)} onRemove={() => removeTodo(item.id)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>لا توجد مهام بعد</Text>}
        contentContainerStyle={todos.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7f8" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  inputRow: { flexDirection: "row", marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: "#0066ff",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
  empty: { textAlign: "center", color: "#666" },
  emptyContainer: { flex: 1, justifyContent: "center" },
});
