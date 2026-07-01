import RestTimer from "@/components/rest-timer";
import { theme } from "@/constants/theme";
import { MUSCLE_GROUP_META } from "@/src/lib/exercise-library";
import { hapticSuccess, hapticTap } from "@/src/lib/haptics";
import {
  addSession,
  deleteExercise,
  getWorkout,
  type Exercise,
  type Workout,
} from "@/src/lib/storage";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  FlatList,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

const SkeletonExerciseCard = ({ delay = 0 }: { delay?: number }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, delay, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [delay, pulseAnim]);
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[styles.skeletonCard, { opacity }]} />;
};

const ExerciseCard = ({
  item,
  index,
  onPress,
  onDelete,
}: {
  item: Exercise;
  index: number;
  onPress: () => void;
  onDelete: (swipeableRef: React.RefObject<Swipeable | null>) => void;
}) => {
  const { t } = useTranslation();
  const swipeableRef = useRef<Swipeable>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 50,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [index, scaleAnim]);

  const meta = MUSCLE_GROUP_META[item.muscleGroup ?? "other"];

  const renderRightActions = (
    _p: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.7, 0],
      extrapolate: "clamp",
    });
    return (
      <Animated.View style={[{ justifyContent: "center" }, { opacity }]}>
        <TouchableOpacity onPress={() => onDelete(swipeableRef)} style={styles.deleteBox}>
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale: scaleAnim }] }]}>
      <Swipeable
        ref={swipeableRef}
        overshootRight={false}
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
      >
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          <View style={styles.card}>
            <View style={[styles.cardIconWrap, { backgroundColor: meta.color + "20" }]}>
              <Text style={styles.cardIcon}>{meta.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardMetaText}>
                  {item.sets?.length || 0} {t("sets")}
                </Text>
                <Text style={styles.cardDot}>·</Text>
                <Text style={[styles.cardMetaText, { color: meta.color }]}>
                  {t(`muscle_${item.muscleGroup ?? "other"}`)}
                </Text>
              </View>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
};

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerVisible, setTimerVisible] = useState(false);

  const loadWorkout = useCallback(async () => {
    setLoading(true);
    const found = await getWorkout(id);
    setWorkout(found);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadWorkout();
    }, [loadWorkout])
  );

  // Session timer
  useEffect(() => {
    if (!sessionActive || !sessionStart) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive, sessionStart]);

  const startSession = () => {
    hapticSuccess();
    setSessionStart(Date.now());
    setSessionActive(true);
    setElapsed(0);
  };

  const finishSession = async () => {
    if (!workout || !sessionStart) return;
    const duration = Math.floor((Date.now() - sessionStart) / 1000);
    hapticSuccess();
    const totalVolume = workout.exercises.reduce(
      (sum, e) =>
        sum +
        e.sets.reduce((s, x) => s + (Number(x.weight) || 0) * (Number(x.reps) || 0), 0),
      0
    );
    await addSession({
      id: Date.now().toString(),
      workoutId: workout.id,
      workoutName: workout.name,
      startedAt: new Date(sessionStart).toISOString(),
      finishedAt: new Date().toISOString(),
      durationSec: duration,
      totalVolume,
    });
    Alert.alert(
      `✅ ${t("session_finished")}`,
      `${t("session_duration")}: ${Math.floor(duration / 60)}m ${duration % 60}s\n${t("total_volume")}: ${totalVolume.toFixed(0)} kg`,
      [{ text: t("ok") }],
      { userInterfaceStyle: "dark" }
    );
    setSessionActive(false);
    setSessionStart(null);
    setElapsed(0);
  };

  const handleDeleteExercise = async (
    exerciseId: string,
    swipeableRef: React.RefObject<Swipeable | null>
  ) => {
    Alert.alert(
      t("delete"),
      t("delete_confirm"),
      [
        { text: t("cancel"), style: "cancel", onPress: () => swipeableRef.current?.close() },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            hapticTap();
            await deleteExercise(id, exerciseId);
            loadWorkout();
          },
        },
      ],
      { cancelable: true, userInterfaceStyle: "dark" }
    );
  };

  if (!workout && !loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{t("empty")}</Text>
      </View>
    );
  }

  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: workout?.name || t("workouts"),
          headerStyle: { backgroundColor: theme.color.bg },
          headerTintColor: theme.color.accent,
          headerTitleStyle: { fontWeight: "700", fontSize: 18, color: theme.color.text },
          headerShadowVisible: false,
          headerBackTitle: t("back"),
          gestureEnabled: true,
        }}
      />

      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {workout?.image ? (
          <ImageBackground source={{ uri: workout.image }} style={styles.headerImage}>
            <View style={styles.headerOverlay} />
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push(`/workouts/${id}/edit`)}
            >
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>{t("workout_plan")}</Text>
              <Text style={styles.headerTitle}>{workout?.name}</Text>
              <View style={styles.headerStats}>
                <View style={styles.statBadge}>
                  <Text style={styles.statNumber}>{workout?.exercises?.length || 0}</Text>
                  <Text style={styles.statLabel}>{t("exercises")}</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.headerImage, styles.noImage]}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push(`/workouts/${id}/edit`)}
            >
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>{t("workout_plan")}</Text>
              <Text style={styles.headerTitle}>{workout?.name}</Text>
              <View style={styles.headerStats}>
                <View style={styles.statBadge}>
                  <Text style={styles.statNumber}>{workout?.exercises?.length || 0}</Text>
                  <Text style={styles.statLabel}>{t("exercises")}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Session bar */}
        {sessionActive && (
          <View style={styles.sessionBar}>
            <View style={styles.sessionDot} />
            <Text style={styles.sessionLabel}>{t("session_active")}</Text>
            <Text style={styles.sessionTime}>
              {mm}:{ss.toString().padStart(2, "0")}
            </Text>
            <TouchableOpacity style={styles.sessionTimerBtn} onPress={() => setTimerVisible(true)}>
              <Text style={styles.sessionTimerText}>⏱</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sessionFinishBtn} onPress={finishSession}>
              <Text style={styles.sessionFinishText}>{t("finish_session")}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.contentContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("exercises")}</Text>
            <View style={styles.exerciseCount}>
              <Text style={styles.exerciseCountText}>{workout?.exercises?.length || 0}</Text>
            </View>
          </View>

          {loading ? (
            <View>
              {[0, 1, 2].map((i) => (
                <SkeletonExerciseCard key={i} delay={i * 100} />
              ))}
            </View>
          ) : (
            <FlatList
              data={workout?.exercises || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <ExerciseCard
                  item={item}
                  index={index}
                  onPress={() => router.push(`/workouts/${id}/exercise/${item.id}`)}
                  onDelete={(ref) => handleDeleteExercise(item.id, ref)}
                />
              )}
              contentContainerStyle={{ paddingBottom: 160 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🏋️</Text>
                  <Text style={styles.emptyTitle}>{t("no_exercises")}</Text>
                  <Text style={styles.emptySubtitle}>{t("tap_plus_first_exercise")}</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Bottom action bar */}
        <View style={styles.bottomBar}>
          {!sessionActive && (workout?.exercises?.length || 0) > 0 && (
            <TouchableOpacity style={styles.startBtn} onPress={startSession}>
              <Text style={styles.startBtnText}>▶ {t("start_session")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.fabAdd}
            onPress={() => router.push(`/workouts/${id}/add-exercise`)}
          >
            <Text style={styles.fabAddText}>+</Text>
          </TouchableOpacity>
        </View>

        <RestTimer
          visible={timerVisible}
          initialSeconds={90}
          onClose={() => setTimerVisible(false)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.color.bg },

  headerImage: {
    height: 220,
    justifyContent: "flex-end",
  },

  noImage: {
    backgroundColor: theme.color.surface,
  },

  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,11,13,0.65)",
  },

  headerContent: {
    padding: theme.space.xxl,
    paddingBottom: theme.space.xxxl,
  },

  headerLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: theme.space.xs,
  },

  headerTitle: {
    fontSize: theme.font.size.display,
    fontWeight: theme.font.weight.bold,
    color: theme.color.text,
    marginBottom: theme.space.md,
  },

  headerStats: { flexDirection: "row", gap: theme.space.md },

  statBadge: {
    backgroundColor: theme.color.accentSoft,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    alignSelf: "flex-start",
  },

  statNumber: {
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    color: theme.color.accent,
  },

  statLabel: {
    fontSize: theme.font.size.xs,
    color: theme.color.accent,
    fontWeight: theme.font.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  editBtn: {
    position: "absolute",
    top: 48,
    right: theme.space.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },

  editIcon: { fontSize: 18 },

  sessionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    backgroundColor: theme.color.accent,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },

  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.color.danger,
  },

  sessionLabel: {
    flex: 1,
    color: theme.color.bg,
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  sessionTime: {
    color: theme.color.bg,
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    fontVariant: ["tabular-nums"],
  },

  sessionTimerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(10,11,13,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  sessionTimerText: { fontSize: 16 },

  sessionFinishBtn: {
    backgroundColor: theme.color.bg,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.sm,
  },

  sessionFinishText: {
    color: theme.color.accent,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  contentContainer: {
    flex: 1,
    backgroundColor: theme.color.bg,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    marginTop: -20,
    paddingTop: theme.space.xl,
    paddingHorizontal: theme.space.xl,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.space.md,
  },

  sectionTitle: {
    fontSize: theme.font.size.xxl,
    fontWeight: theme.font.weight.bold,
    color: theme.color.text,
  },

  exerciseCount: {
    backgroundColor: theme.color.surfaceElevated,
    paddingHorizontal: theme.space.md,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },

  exerciseCountText: {
    color: theme.color.accent,
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.bold,
  },

  cardWrap: { marginBottom: theme.space.sm },

  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.md,
  },

  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  cardIcon: { fontSize: 22 },

  cardName: {
    color: theme.color.text,
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    marginBottom: 4,
  },

  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },

  cardMetaText: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
  },

  cardDot: { color: theme.color.textDim },

  cardArrow: {
    color: theme.color.accent,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
  },

  deleteBox: {
    marginLeft: 8,
    width: 80,
    height: 72,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.danger,
    justifyContent: "center",
    alignItems: "center",
  },

  deleteIcon: {
    color: theme.color.text,
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
  },

  emptyContainer: { alignItems: "center", marginTop: 40, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: theme.space.md },
  emptyTitle: {
    color: theme.color.text,
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.semibold,
    textAlign: "center",
  },
  emptySubtitle: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
    textAlign: "center",
    marginTop: theme.space.xs,
  },
  emptyText: {
    color: theme.color.textMuted,
    textAlign: "center",
    marginTop: 50,
    fontSize: theme.font.size.md,
  },

  skeletonCard: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    height: 72,
    marginBottom: theme.space.sm,
  },

  bottomBar: {
    position: "absolute",
    bottom: 108,
    left: theme.space.xl,
    right: theme.space.xl,
    flexDirection: "row",
    gap: theme.space.md,
  },

  startBtn: {
    flex: 1,
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.space.lg,
    alignItems: "center",
    shadowColor: theme.color.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  startBtnText: {
    color: theme.color.bg,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  fabAdd: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.color.surfaceElevated,
    borderWidth: 2,
    borderColor: theme.color.accent,
    justifyContent: "center",
    alignItems: "center",
  },

  fabAddText: {
    color: theme.color.accent,
    fontSize: 26,
    fontWeight: theme.font.weight.bold,
    marginTop: -2,
  },
});
