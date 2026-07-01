import { theme } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { getSessions } from "@/src/lib/storage";

const RING_SIZE = 72;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function Ring({ progress, color }: { progress: number; color: string }) {
  const p = Math.min(Math.max(progress, 0), 1);
  const dash = CIRCUMFERENCE * p;
  return (
    <Svg width={RING_SIZE} height={RING_SIZE}>
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke={theme.color.surfaceElevated}
        strokeWidth={RING_STROKE}
        fill="none"
      />
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke={color}
        strokeWidth={RING_STROKE}
        fill="none"
        strokeDasharray={`${dash},${CIRCUMFERENCE}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
      />
    </Svg>
  );
}

export default function TodaySummary() {
  const { t } = useTranslation();
  const [waterPct, setWaterPct] = useState(0);
  const [workoutDone, setWorkoutDone] = useState(false);

  const load = useCallback(async () => {
    const [waterRaw, goalRaw, sessions] = await Promise.all([
      AsyncStorage.getItem("DAILY_WATER"),
      AsyncStorage.getItem("WATER_GOAL"),
      getSessions(),
    ]);
    const water = waterRaw ? Number(waterRaw) : 0;
    const goal = goalRaw ? Number(goalRaw) : 2500;
    setWaterPct(goal > 0 ? Math.min(water / goal, 1) : 0);

    const todayKey = new Date().toISOString().split("T")[0];
    const done = sessions.some(
      (s) => s.finishedAt && s.finishedAt.split("T")[0] === todayKey
    );
    setWorkoutDone(done);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.rings}>
        <View style={styles.ringWrap}>
          <Ring progress={workoutDone ? 1 : 0} color={theme.color.accent} />
          <Text style={styles.ringEmoji}>💪</Text>
        </View>
        <View style={styles.ringWrap}>
          <Ring progress={waterPct} color={theme.color.info} />
          <Text style={styles.ringEmoji}>💧</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{t("today_progress")}</Text>
        <Text style={styles.status}>
          {workoutDone ? `✓ ${t("workout_done")}` : t("no_workout_yet")}
        </Text>
        <Text style={styles.waterText}>
          💧 {Math.round(waterPct * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.md,
    backgroundColor: theme.color.surface,
    padding: theme.space.lg,
    borderRadius: theme.radius.lg,
    marginBottom: theme.space.lg,
  },

  rings: {
    flexDirection: "row",
    gap: -12,
  },

  ringWrap: {
    justifyContent: "center",
    alignItems: "center",
    width: RING_SIZE,
    height: RING_SIZE,
    position: "relative",
  },

  ringEmoji: {
    position: "absolute",
    fontSize: 24,
  },

  label: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },

  status: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
  },

  waterText: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
    marginTop: 2,
  },
});
