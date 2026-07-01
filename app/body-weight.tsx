import { theme } from "@/constants/theme";
import { hapticError, hapticSuccess, hapticTap } from "@/src/lib/haptics";
import { addWeightEntry, deleteWeightEntry, getWeightLog, type WeightEntry } from "@/src/lib/storage";
import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
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
import Svg, { Circle, Path } from "react-native-svg";

export default function BodyWeight() {
  const { t } = useTranslation();

  const [log, setLog] = useState<WeightEntry[]>([]);
  const [input, setInput] = useState("");

  const reload = async () => {
    const l = await getWeightLog();
    setLog(l);
  };

  useEffect(() => {
    reload();
  }, []);

  const submit = async () => {
    const kg = Number(input.replace(",", "."));
    if (!kg || kg <= 0 || kg > 500) {
      hapticError();
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    await addWeightEntry({ id: Date.now().toString(), date: today, kg });
    setInput("");
    hapticSuccess();
    reload();
  };

  const removeEntry = (id: string) => {
    Alert.alert(t("delete"), t("delete_confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          hapticTap();
          await deleteWeightEntry(id);
          reload();
        },
      },
    ], { userInterfaceStyle: "dark" });
  };

  const stats = useMemo(() => {
    if (log.length === 0) return null;
    const kgs = log.map((e) => e.kg);
    const min = Math.min(...kgs);
    const max = Math.max(...kgs);
    const current = kgs[kgs.length - 1];
    const first = kgs[0];
    const delta = current - first;
    return { min, max, current, delta };
  }, [log]);

  // Chart
  const width = Dimensions.get("window").width - 40 - 32;
  const height = 180;
  const padding = 20;

  const chartPath = useMemo(() => {
    if (log.length === 0) return "";
    const kgs = log.map((e) => e.kg);
    const min = Math.min(...kgs);
    const max = Math.max(...kgs);
    const range = max - min || 1;

    const stepX = log.length > 1 ? (width - padding * 2) / (log.length - 1) : 0;
    const chartH = height - padding * 2;

    return log
      .map((e, i) => {
        const x = padding + i * stepX;
        const y = padding + chartH - ((e.kg - min) / range) * chartH;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [log, width]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("body_weight"),
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
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Current weight card */}
            {stats && (
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>{t("body_weight")}</Text>
                <View style={styles.heroValueRow}>
                  <Text style={styles.heroValue}>{stats.current.toFixed(1)}</Text>
                  <Text style={styles.heroUnit}>kg</Text>
                </View>
                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatLabel}>Min</Text>
                    <Text style={styles.heroStatValue}>{stats.min.toFixed(1)}</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatLabel}>Max</Text>
                    <Text style={styles.heroStatValue}>{stats.max.toFixed(1)}</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatLabel}>Δ</Text>
                    <Text
                      style={[
                        styles.heroStatValue,
                        { color: stats.delta > 0 ? theme.color.warning : stats.delta < 0 ? theme.color.accent : theme.color.textMuted },
                      ]}
                    >
                      {stats.delta > 0 ? "+" : ""}
                      {stats.delta.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Input */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>{t("log_weight")}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={t("add_weight_placeholder")}
                  placeholderTextColor={theme.color.textDim}
                  keyboardType="decimal-pad"
                  value={input}
                  onChangeText={setInput}
                />
                <Text style={styles.inputUnit}>kg</Text>
                <TouchableOpacity style={styles.submitBtn} onPress={submit}>
                  <Text style={styles.submitBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Chart */}
            {log.length >= 2 && (
              <View style={styles.chartCard}>
                <Text style={styles.blockLabel}>{t("trend")}</Text>
                <Svg width={width} height={height}>
                  <Path d={chartPath} stroke={theme.color.accent} strokeWidth={2.5} fill="none" />
                  {log.map((e, i) => {
                    const kgs = log.map((x) => x.kg);
                    const min = Math.min(...kgs);
                    const max = Math.max(...kgs);
                    const range = max - min || 1;
                    const stepX = (width - padding * 2) / (log.length - 1);
                    const chartH = height - padding * 2;
                    const x = padding + i * stepX;
                    const y = padding + chartH - ((e.kg - min) / range) * chartH;
                    return (
                      <Circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={i === log.length - 1 ? 5 : 3}
                        fill={i === log.length - 1 ? theme.color.accent : theme.color.text}
                      />
                    );
                  })}
                </Svg>
              </View>
            )}

            {/* History */}
            <Text style={styles.blockLabel}>{t("history")}</Text>
            {log.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>⚖️</Text>
                <Text style={styles.emptyText}>{t("no_weights")}</Text>
              </View>
            ) : (
              [...log].reverse().map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={styles.historyRow}
                  onLongPress={() => removeEntry(e.id)}
                >
                  <Text style={styles.historyDate}>{e.date}</Text>
                  <Text style={styles.historyValue}>{e.kg.toFixed(1)} kg</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.color.bg },
  scrollContent: { padding: theme.space.xl, paddingBottom: 40 },

  heroCard: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.xl,
    padding: theme.space.xxl,
    marginBottom: theme.space.xl,
  },
  heroLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: theme.space.sm,
  },
  heroValueRow: { flexDirection: "row", alignItems: "baseline", gap: theme.space.sm },
  heroValue: {
    color: theme.color.text,
    fontSize: 56,
    fontWeight: theme.font.weight.bold,
    letterSpacing: -2,
  },
  heroUnit: { color: theme.color.textMuted, fontSize: theme.font.size.xl, fontWeight: theme.font.weight.semibold },

  heroStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.space.lg,
    paddingTop: theme.space.lg,
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
  },
  heroStat: { alignItems: "center", flex: 1 },
  heroStatLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    marginBottom: 2,
  },
  heroStatValue: { color: theme.color.text, fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold },

  inputCard: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginBottom: theme.space.xl,
  },
  inputLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: theme.space.sm,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: theme.space.md },
  input: {
    flex: 1,
    backgroundColor: theme.color.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    color: theme.color.text,
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
  },
  inputUnit: { color: theme.color.textMuted, fontSize: theme.font.size.md, fontWeight: theme.font.weight.semibold },
  submitBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.color.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnText: { color: theme.color.bg, fontSize: 28, fontWeight: theme.font.weight.bold, marginTop: -2 },

  chartCard: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginBottom: theme.space.xl,
  },

  blockLabel: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: theme.space.md,
  },

  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    padding: theme.space.lg,
    marginBottom: theme.space.sm,
  },
  historyDate: { color: theme.color.textMuted, fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semibold },
  historyValue: { color: theme.color.text, fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold },

  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: theme.space.sm },
  emptyText: { color: theme.color.textMuted, fontSize: theme.font.size.sm },
});
