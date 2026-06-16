import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Todo } from "../types";

type Props = {
  todo: Todo;
  onToggle: () => void;
  onRemove: () => void;
};

export default function TodoItem({ todo, onToggle, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onToggle} style={[styles.checkbox, todo.done && styles.checkboxDone]}>
        <Text style={{ color: todo.done ? "#fff" : "#333" }}>{todo.done ? "✓" : ""}</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.text, todo.done && styles.done]}>{todo.text}</Text>
        <Text style={styles.meta}>{new Date(todo.createdAt).toLocaleString()}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.delete}>
        <Text style={{ color: "#ff3b30" }}>حذف</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#e9e9ec",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: "#0066ff",
  },
  content: { flex: 1 },
  text: { fontSize: 16, color: "#111" },
  done: { textDecorationLine: "line-through", color: "#999" },
  meta: { fontSize: 12, color: "#999", marginTop: 4 },
  delete: { marginLeft: 12 },
});
