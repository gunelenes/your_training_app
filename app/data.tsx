import { theme } from "@/constants/theme";
import { hapticError, hapticSuccess } from "@/src/lib/haptics";
import { exportAll, importAll, type ExportPayload } from "@/src/lib/storage";
import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function DataScreen() {
  const { t } = useTranslation();
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");

  const doExport = async () => {
    const payload = await exportAll();
    setExportText(JSON.stringify(payload, null, 2));
    hapticSuccess();
  };

  const doImport = async () => {
    try {
      const parsed = JSON.parse(importText) as ExportPayload;
      await importAll(parsed);
      hapticSuccess();
      Alert.alert("✅", t("import_success"), [{ text: t("ok") }], { userInterfaceStyle: "dark" });
      setImportText("");
    } catch {
      hapticError();
      Alert.alert("❌", t("import_failed"), [{ text: t("ok") }], { userInterfaceStyle: "dark" });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("data"),
          headerStyle: { backgroundColor: theme.color.bg },
          headerTintColor: theme.color.accent,
          headerTitleStyle: { fontWeight: "700", fontSize: 18, color: theme.color.text },
          headerShadowVisible: false,
          headerBackTitle: t("back"),
        }}
      />
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* Export */}
            <View style={styles.card}>
              <Text style={styles.blockLabel}>{t("export_data")}</Text>
              <Text style={styles.description}>{t("export_desc")}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={doExport}>
                <Text style={styles.primaryBtnText}>📤 {t("export_data")}</Text>
              </TouchableOpacity>
              {exportText ? (
                <TextInput
                  style={styles.jsonBox}
                  value={exportText}
                  multiline
                  editable={false}
                  selectTextOnFocus
                />
              ) : null}
            </View>

            {/* Import */}
            <View style={styles.card}>
              <Text style={styles.blockLabel}>{t("import_data")}</Text>
              <Text style={styles.description}>{t("import_desc")}</Text>
              <TextInput
                style={styles.jsonBox}
                placeholder={t("import_paste")}
                placeholderTextColor={theme.color.textDim}
                value={importText}
                onChangeText={setImportText}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, !importText.trim() && styles.disabledBtn]}
                onPress={doImport}
                disabled={!importText.trim()}
              >
                <Text style={[styles.primaryBtnText, !importText.trim() && { color: theme.color.textMuted }]}>
                  📥 {t("import_data")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space.xl, gap: theme.space.xl, paddingBottom: 60 },

  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.md,
  },

  blockLabel: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  description: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
  },

  primaryBtn: {
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space.md,
    alignItems: "center",
  },
  disabledBtn: { backgroundColor: theme.color.surfaceElevated },
  primaryBtnText: { color: theme.color.bg, fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold },

  jsonBox: {
    backgroundColor: theme.color.surfaceMuted,
    borderRadius: theme.radius.sm,
    padding: theme.space.md,
    color: theme.color.text,
    fontSize: 11,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    minHeight: 140,
    textAlignVertical: "top",
  },
});
