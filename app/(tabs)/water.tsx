import { theme } from "@/constants/theme";
import { hapticTap } from "@/src/lib/haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HistoryItem = {
  date: string;
  amount: number;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const getDateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function Water() {
  const { t } = useTranslation();

  const [water, setWater] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [dailyGoal, setDailyGoal] = useState(2500);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const saveHistory = useCallback(async (date: string, amount: number) => {
    const raw = await AsyncStorage.getItem("WATER_HISTORY");
    const list: HistoryItem[] = raw ? JSON.parse(raw) : [];
    const existing = list.find((h) => h.date === date);
    if (existing) existing.amount = amount;
    else list.push({ date, amount });
    await AsyncStorage.setItem("WATER_HISTORY", JSON.stringify(list));
    setHistory(list);
  }, []);

  const handleDailyReset = useCallback(async () => {
    const todayKey = getDateKey(new Date());
    const lastDate = await AsyncStorage.getItem("LAST_WATER_DATE");
    if (lastDate !== todayKey) {
      const prevRaw = await AsyncStorage.getItem("DAILY_WATER");
      const prevAmount = prevRaw ? Number(prevRaw) : 0;
      if (prevAmount > 0 && lastDate) {
        await saveHistory(lastDate, prevAmount);
      }
      await AsyncStorage.setItem("DAILY_WATER", "0");
      await AsyncStorage.setItem("LAST_WATER_DATE", todayKey);
      setWater(0);
    } else {
      const raw = await AsyncStorage.getItem("DAILY_WATER");
      setWater(raw ? Number(raw) : 0);
    }
  }, [saveHistory]);

  const loadHistory = async () => {
    const raw = await AsyncStorage.getItem("WATER_HISTORY");
    setHistory(raw ? JSON.parse(raw) : []);
  };

  const loadGoal = async () => {
    const raw = await AsyncStorage.getItem("WATER_GOAL");
    setDailyGoal(raw ? Number(raw) : 2500);
  };

  useEffect(() => {
    (async () => {
      await handleDailyReset();
      await loadGoal();
      await loadHistory();
    })();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [handleDailyReset, pulseAnim]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") handleDailyReset();
    });
    return () => sub.remove();
  }, [handleDailyReset]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(water / dailyGoal, 1),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [water, dailyGoal, progressAnim]);

  const addWater = async (amount: number) => {
    hapticTap();
    const todayKey = getDateKey(new Date());
    let newAmount = water + amount;
    if (newAmount < 0) newAmount = 0;
    setWater(newAmount);
    await AsyncStorage.setItem("DAILY_WATER", newAmount.toString());
    await AsyncStorage.setItem("LAST_WATER_DATE", todayKey);
  };

  const addManual = () => {
    if (!inputValue) return;
    const val = Number(inputValue);
    if (isNaN(val)) return;
    addWater(val);
    setInputValue("");
  };

  const updateGoal = async (delta: number) => {
    hapticTap();
    const g = Math.max(500, dailyGoal + delta);
    setDailyGoal(g);
    await AsyncStorage.setItem("WATER_GOAL", g.toString());
  };

  const getDayKey = (date: Date): string => {
    const d = date.getDay();
    if (d === 1) return "mon";
    if (d === 2) return "tue";
    if (d === 3) return "wed";
    if (d === 4) return "thu";
    if (d === 5) return "fri";
    if (d === 6) return "sat";
    return "sun";
  };

  const today = new Date();
  const todayKey = getDateKey(today);

  const getWeeklyData = () => {
    const combined = [...history];
    const todayEntry = combined.find((x) => x.date === todayKey);
    if (!todayEntry) combined.push({ date: todayKey, amount: water });
    else todayEntry.amount = water;

    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = getDateKey(d);
      const record = combined.find((x) => x.date === dateKey);
      const key = getDayKey(d);
      const label = t(`days_short.${key}`);
      arr.push({ label, amount: record ? record.amount : 0 });
    }
    return arr;
  };

  const weeklyData = getWeeklyData();
  const maxWeekly = Math.max(...weeklyData.map((x) => x.amount), dailyGoal);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0] });
  const percent = Math.min((water / dailyGoal) * 100, 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.headerLabel}>{t("today")}</Text>
        <Text style={styles.headerTitle}>{t("water_intake")}</Text>

        {/* Ring */}
        <View style={styles.ringWrap}>
          <Animated.View
            style={[styles.pulseCircle, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
          />
          <View style={styles.ring}>
            <Text style={styles.ringValue}>{water}</Text>
            <Text style={styles.ringUnit}>ml</Text>
            <Text style={styles.ringPct}>{percent.toFixed(0)}%</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <Text style={styles.goalText}>
          {t("daily_goal")}: <Text style={{ color: theme.color.accent }}>{dailyGoal} ml</Text>
        </Text>

        {/* Quick add */}
        <View style={styles.quickRow}>
          {[250, 500, 750].map((ml) => (
            <TouchableOpacity
              key={ml}
              onPress={() => addWater(ml)}
              style={styles.quickBtn}
            >
              <Text style={styles.quickBtnText}>+{ml}</Text>
              <Text style={styles.quickBtnUnit}>ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Manual input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="300  /  -200"
            placeholderTextColor={theme.color.textDim}
            keyboardType="numbers-and-punctuation"
            value={inputValue}
            onChangeText={setInputValue}
          />
          <TouchableOpacity onPress={addManual} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{t("add")}</Text>
          </TouchableOpacity>
        </View>

        {/* Goal */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("daily_goal")}</Text>
          <View style={styles.goalRow}>
            <TouchableOpacity onPress={() => updateGoal(-250)} style={styles.goalBtn}>
              <Text style={styles.goalBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.goalValue}>{dailyGoal} ml</Text>
            <TouchableOpacity onPress={() => updateGoal(250)} style={styles.goalBtn}>
              <Text style={styles.goalBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("weekly_overview")}</Text>
          <View style={styles.barRow}>
            {weeklyData.map((d, i) => {
              const height = (d.amount / maxWeekly) * 100;
              return (
                <View key={i} style={styles.barItem}>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, { height, backgroundColor: theme.color.accent }]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.bg },
  container: { flex: 1, paddingHorizontal: theme.space.xl, paddingTop: theme.space.lg },

  headerLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: theme.color.text,
    fontSize: theme.font.size.hero,
    fontWeight: theme.font.weight.bold,
    letterSpacing: -1,
    marginBottom: theme.space.xxl,
  },

  ringWrap: { alignItems: "center", marginBottom: theme.space.xl },

  pulseCircle: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.color.accent,
  },

  ring: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 6,
    borderColor: theme.color.accent,
    backgroundColor: theme.color.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  ringValue: {
    color: theme.color.text,
    fontSize: 44,
    fontWeight: theme.font.weight.bold,
    letterSpacing: -1,
  },
  ringUnit: { color: theme.color.textMuted, fontSize: theme.font.size.sm, marginTop: -4 },
  ringPct: { color: theme.color.accent, fontSize: theme.font.size.sm, marginTop: 4, fontWeight: theme.font.weight.bold },

  progressTrack: {
    height: 8,
    backgroundColor: theme.color.surface,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: theme.space.md,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.color.accent,
  },

  goalText: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
    marginBottom: theme.space.lg,
    textAlign: "center",
  },

  quickRow: {
    flexDirection: "row",
    gap: theme.space.md,
    marginBottom: theme.space.lg,
  },

  quickBtn: {
    flex: 1,
    backgroundColor: theme.color.surface,
    paddingVertical: theme.space.lg,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  quickBtnText: {
    color: theme.color.accent,
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
  },
  quickBtnUnit: { color: theme.color.textMuted, fontSize: theme.font.size.xs },

  inputRow: {
    flexDirection: "row",
    gap: theme.space.md,
    marginBottom: theme.space.xl,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.md,
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.semibold,
  },
  addBtn: {
    paddingHorizontal: theme.space.xl,
    justifyContent: "center",
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.md,
  },
  addBtnText: {
    color: theme.color.bg,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
  },

  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginBottom: theme.space.md,
  },
  cardLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: theme.space.md,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.color.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  goalBtnText: { color: theme.color.text, fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold },
  goalValue: {
    color: theme.color.text,
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
  },

  barRow: { flexDirection: "row", justifyContent: "space-between", height: 140 },
  barItem: { alignItems: "center", flex: 1 },
  barTrack: {
    width: 12,
    height: 100,
    backgroundColor: theme.color.surfaceMuted,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 6,
  },
  barFill: {
    width: "100%",
    borderRadius: 6,
  },
  barLabel: { color: theme.color.textMuted, fontSize: 10, fontWeight: theme.font.weight.semibold },
});
