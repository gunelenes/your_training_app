import i18n from "@/src/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
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

export default function Water() {
  const { t } = useTranslation();

  const [water, setWater] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [dailyGoal, setDailyGoal] = useState(2500);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [langUpdate, setLangUpdate] = useState(0);

  const today = new Date();
  const todayStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  /* ---------------------------------------------
     LANGUAGE CHANGE RE-RENDER
  --------------------------------------------- */
  useEffect(() => {
    const handler = () => setLangUpdate((v) => v + 1);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  /* ---------------------------------------------
     INITIAL LOAD
  --------------------------------------------- */
  useEffect(() => {
    const init = async () => {
      await handleDailyReset();
      await loadGoal();
      await loadHistory();
    };
    init();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  /* ---------------------------------------------
     PROGRESS ANIMATION
  --------------------------------------------- */
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(water / dailyGoal, 1),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [water, dailyGoal, langUpdate]);


  /* ---------------------------------------------
     HISTORY & GOAL LOADERS
  --------------------------------------------- */
  const loadHistory = async () => {
    const raw = await AsyncStorage.getItem("WATER_HISTORY");
    setHistory(raw ? JSON.parse(raw) : []);
  };

  const loadGoal = async () => {
    const raw = await AsyncStorage.getItem("WATER_GOAL");
    setDailyGoal(raw ? Number(raw) : 2500);
  };


  /* ---------------------------------------------
     DAILY RESET LOGIC
  --------------------------------------------- */
  const handleDailyReset = async () => {
    const lastDate = await AsyncStorage.getItem("LAST_WATER_DATE");

    if (lastDate !== todayStr) {
      const prevRaw = await AsyncStorage.getItem("DAILY_WATER");
      const prevAmount = prevRaw ? Number(prevRaw) : 0;

      if (prevAmount > 0 && lastDate) {
        await saveHistory(lastDate, prevAmount);
      }

      await AsyncStorage.setItem("DAILY_WATER", "0");
      await AsyncStorage.setItem("LAST_WATER_DATE", todayStr);
      setWater(0);
    } else {
      const raw = await AsyncStorage.getItem("DAILY_WATER");
      setWater(raw ? Number(raw) : 0);
    }
  };

  const saveHistory = async (date: string, amount: number) => {
    const raw = await AsyncStorage.getItem("WATER_HISTORY");
    const list = raw ? JSON.parse(raw) : [];

    if (!list.find((h: HistoryItem) => h.date === date)) {
      list.push({ date, amount });
      await AsyncStorage.setItem("WATER_HISTORY", JSON.stringify(list));
      setHistory(list);
    }
  };


  /* ---------------------------------------------
     ADD & REMOVE WATER (same function)
  --------------------------------------------- */
  const addWater = async (amount: number) => {
    let newAmount = water + amount;

    // ❗ Never go below zero
    if (newAmount < 0) newAmount = 0;

    setWater(newAmount);

    await AsyncStorage.setItem("DAILY_WATER", newAmount.toString());
    await AsyncStorage.setItem("LAST_WATER_DATE", todayStr);
  };

  const addManual = () => {
    if (!inputValue) return;

    const val = Number(inputValue);
    if (isNaN(val)) return;

    addWater(val);
    setInputValue("");
  };


  /* ---------------------------------------------
     CHANGE GOAL
  --------------------------------------------- */
  const updateGoal = async (delta: number) => {
    const g = Math.max(500, dailyGoal + delta);
    setDailyGoal(g);
    await AsyncStorage.setItem("WATER_GOAL", g.toString());
  };


  /* ---------------------------------------------
     WEEKLY GRAPH
  --------------------------------------------- */
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

  const getWeeklyData = () => {
    const combined = [...history];
    const todayEntry = combined.find((x) => x.date === todayStr);

    if (!todayEntry) combined.push({ date: todayStr, amount: water });
    else todayEntry.amount = water;

    const arr = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const dateKey = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
      const record = combined.find((x) => x.date === dateKey);

      const key = getDayKey(d);
      const label = t(`days_short.${key}`);

      arr.push({
        label,
        amount: record ? record.amount : 0,
      });
    }
    return arr;
  };

  const weeklyData = getWeeklyData();
  const maxWeekly = Math.max(...weeklyData.map((x) => x.amount), dailyGoal);

  const monthlyTotal = (() => {
    const combined = [...history];
    const tE = combined.find((x) => x.date === todayStr);

    if (!tE) combined.push({ date: todayStr, amount: water });
    else tE.amount = water;

    return combined.reduce((sum, x) => {
      const [, m, y] = x.date.split("-");
      if (
        Number(m) === today.getMonth() + 1 &&
        Number(y) === today.getFullYear()
      ) {
        return sum + x.amount;
      }
      return sum;
    }, 0);
  })();

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0],
  });

  const percent = Math.min((water / dailyGoal) * 100, 100);


  /* ---------------------------------------------
     RENDER
  --------------------------------------------- */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        
        {/* HEADER */}
        <Text style={styles.headerTitle}>{t("water_intake")}</Text>
        <Text style={styles.headerSubtitle}>
          {t("daily_goal")}: {dailyGoal} ml
        </Text>

        {/* ANIMATED CIRCLE */}
        <View style={styles.progressWrapper}>
          <Animated.View
            style={[
              styles.pulseCircle,
              { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
            ]}
          />
          <View style={styles.circle}>
            <Text style={styles.circleText}>{water} ml</Text>
            <Text style={styles.percentText}>{percent.toFixed(0)}%</Text>
          </View>
        </View>

        {/* HORIZONTAL PROGRESS */}
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
            <LinearGradient colors={["#667EEA", "#764BA2"]} style={{ flex: 1 }} />
          </Animated.View>
        </View>

        {/* QUICK ADD */}
        <View style={styles.quickRow}>
          {[250, 500, 750].map((ml) => (
            <TouchableOpacity key={ml} onPress={() => addWater(ml)}>
              <LinearGradient colors={["#667EEA", "#764BA2"]} style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>+{ml} ml</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>


        {/* MANUAL INPUT */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="300  /  -200"
            placeholderTextColor="#6E7178"
            keyboardType="numbers-and-punctuation"
            value={inputValue}
            onChangeText={setInputValue}
          />

          <TouchableOpacity onPress={addManual}>
            <LinearGradient colors={["#667EEA", "#764BA2"]} style={styles.inputBtn}>
              <Text style={styles.inputBtnText}>{t("add")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* GOAL */}
        <View style={styles.goalCard}>
          <Text style={styles.sectionTitle}>{t("daily_goal")}</Text>
          <Text style={styles.goalValue}>{dailyGoal} ml</Text>

          <View style={styles.goalButtonsRow}>
            <TouchableOpacity onPress={() => updateGoal(-250)} style={styles.goalBtn}>
              <Text style={styles.goalBtnText}>-250</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => updateGoal(250)} style={styles.goalBtn}>
              <Text style={styles.goalBtnText}>+250</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WEEKLY GRAPH */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("weekly_overview")}</Text>

          <View style={styles.barRow}>
            {weeklyData.map((d, i) => {
              const height = (d.amount / maxWeekly) * 120;
              return (
                <View key={i} style={styles.barItem}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height }]} />
                  </View>
                  <Text style={styles.barLabel}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* MONTHLY TOTAL */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("monthly_total")}</Text>
          <Text style={styles.monthlyValue}>{monthlyTotal} ml</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0B0D" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  headerTitle: {
    fontSize: 34,
    color: "white",
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#6E7178",
    fontSize: 16,
    marginBottom: 20,
  },

  progressWrapper: { alignItems: "center", marginBottom: 24 },

  pulseCircle: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "#667EEA",
  },

  circle: {
    width: 190,
    height: 190,
    borderRadius: 190,
    borderWidth: 8,
    borderColor: "#667EEA",
    backgroundColor: "#111216",
    justifyContent: "center",
    alignItems: "center",
  },

  circleText: { color: "white", fontSize: 26, fontWeight: "700" },
  percentText: { color: "#6E7178", marginTop: 6 },

  progressBarTrack: {
    height: 10,
    backgroundColor: "#1A1C1E",
    borderRadius: 999,
    marginBottom: 24,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 999 },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  quickBtn: {
    width: 100,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickBtnText: { color: "white", fontSize: 15, fontWeight: "600" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    height: 48,
    backgroundColor: "#1A1C1E",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "white",
  },

  inputBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  inputBtnText: { color: "white", fontSize: 16, fontWeight: "600" },

  goalCard: {
    backgroundColor: "#111216",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  goalValue: {
    color: "#667EEA",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  goalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  goalBtn: {
    flex: 1,
    backgroundColor: "#1A1C1E",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
  },
  goalBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#111216",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  barRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  barItem: {
    alignItems: "center",
    flex: 1,
  },

  barTrack: {
    width: 14,
    height: 120,
    backgroundColor: "#1A1C1E",
    borderRadius: 999,
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 6,
  },

  barFill: {
    width: "100%",
    backgroundColor: "#667EEA",
    borderRadius: 999,
  },

  barLabel: {
    color: "#6E7178",
    fontSize: 11,
  },

  monthlyValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
});
