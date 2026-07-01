import { theme } from "@/constants/theme";
import type { ExerciseSet } from "@/src/lib/storage";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

type Props = {
  sets: ExerciseSet[];
};

type Point = { date: string; maxWeight: number; volume: number };

function aggregateByDate(sets: ExerciseSet[]): Point[] {
  const map = new Map<string, { maxWeight: number; volume: number }>();

  for (const s of sets) {
    const w = Number(s.weight) || 0;
    const r = Number(s.reps) || 0;
    if (!s.date) continue;
    const existing = map.get(s.date) ?? { maxWeight: 0, volume: 0 };
    map.set(s.date, {
      maxWeight: Math.max(existing.maxWeight, w),
      volume: existing.volume + w * r,
    });
  }

  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function ProgressionChart({ sets }: Props) {
  const { t } = useTranslation();
  const points = useMemo(() => aggregateByDate(sets), [sets]);

  if (points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t("no_history")}</Text>
      </View>
    );
  }

  const width = Dimensions.get("window").width - 80;
  const height = 160;
  const padding = 16;

  const maxWeight = Math.max(...points.map((p) => p.maxWeight), 1);
  const totalVolume = points.reduce((s, p) => s + p.volume, 0);
  const avgVolume = totalVolume / points.length;

  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const chartHeight = height - padding * 2;

  const path = points
    .map((p, i) => {
      const x = padding + i * stepX;
      const y = padding + chartHeight - (p.maxWeight / maxWeight) * chartHeight;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const delta = lastPoint.maxWeight - firstPoint.maxWeight;
  const trend = delta === 0 ? "→" : delta > 0 ? "↑" : "↓";
  const trendColor =
    delta > 0
      ? theme.color.accent
      : delta < 0
      ? theme.color.danger
      : theme.color.textMuted;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t("max_weight")}</Text>
          <Text style={styles.statValue}>{Math.max(...points.map((p) => p.maxWeight))} kg</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t("total_volume")}</Text>
          <Text style={styles.statValue}>{totalVolume.toFixed(0)} kg</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t("trend")}</Text>
          <Text style={[styles.statValue, { color: trendColor }]}>
            {trend} {Math.abs(delta).toFixed(0)}
          </Text>
        </View>
      </View>

      <Svg width={width} height={height}>
        <Line
          x1={padding}
          y1={padding + chartHeight - (avgVolume / (Math.max(...points.map((p) => p.volume)) || 1)) * chartHeight}
          x2={width - padding}
          y2={padding + chartHeight - (avgVolume / (Math.max(...points.map((p) => p.volume)) || 1)) * chartHeight}
          stroke={theme.color.border}
          strokeDasharray="3,4"
          strokeWidth={1}
        />
        <Path d={path} stroke={theme.color.accent} strokeWidth={2.5} fill="none" />
        {points.map((p, i) => {
          const x = padding + i * stepX;
          const y = padding + chartHeight - (p.maxWeight / maxWeight) * chartHeight;
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={i === points.length - 1 ? 5 : 3}
              fill={i === points.length - 1 ? theme.color.accent : theme.color.text}
            />
          );
        })}
      </Svg>

      <View style={styles.axisRow}>
        <Text style={styles.axisText}>{firstPoint.date}</Text>
        <Text style={styles.axisText}>{lastPoint.date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginBottom: theme.space.lg,
  },

  empty: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.xxl,
    marginBottom: theme.space.lg,
    alignItems: "center",
  },

  emptyText: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.space.lg,
  },

  stat: {
    alignItems: "center",
    flex: 1,
  },

  statLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  statValue: {
    color: theme.color.text,
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
  },

  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.space.sm,
  },

  axisText: {
    color: theme.color.textDim,
    fontSize: theme.font.size.xs,
  },
});
