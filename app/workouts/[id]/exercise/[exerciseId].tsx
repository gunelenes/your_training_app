import ProgressionChart from "@/components/progression-chart";
import RestTimer from "@/components/rest-timer";
import { theme } from "@/constants/theme";
import { hapticSuccess, hapticTap } from "@/src/lib/haptics";
import { getWorkout, updateExerciseSets, type Exercise, type ExerciseSet } from "@/src/lib/storage";
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, { FadeIn, SlideInLeft } from "react-native-reanimated";

const AnimatedSetCard = ({
  item,
  index,
  onUpdate,
  onDelete,
  onDone,
}: {
  item: ExerciseSet;
  index: number;
  onUpdate: (field: "weight" | "reps" | "note", value: string) => void;
  onDelete: () => void;
  onDone: () => void;
}) => {
  const { t } = useTranslation();
  const swipeableRef = useRef<Swipeable>(null);
  const [showNote, setShowNote] = useState(!!item.note);

  const renderRightActions = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.7, 0],
      extrapolate: 'clamp',
    });

    return (
      <RNAnimated.View style={[styles.deleteSwipeContainer, { opacity, transform: [{ scale }] }]}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              t("delete_set_title"),
              t("delete_set_confirm"),
              [
                { text: t("cancel"), style: "cancel", onPress: () => swipeableRef.current?.close() },
                { text: t("delete"), style: "destructive", onPress: onDelete },
              ],
              { cancelable: true, userInterfaceStyle: 'dark' }
            );
          }}
          style={styles.deleteSwipe}
          activeOpacity={0.7}
        >
          <View style={styles.deleteBox}>
            <Text style={styles.deleteIcon}>✕</Text>
            <Text style={styles.deleteText}>{t("delete")}</Text>
          </View>
        </TouchableOpacity>
      </RNAnimated.View>
    );
  };

  return (
    <Animated.View entering={SlideInLeft.delay(50 * index)}>
      <Swipeable
        ref={swipeableRef}
        overshootRight={false}
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
      >
        <View style={styles.setCard}>
          <View style={styles.setRow}>
            <View style={styles.setIndexBadge}>
              <Text style={styles.setIndex}>{index + 1}</Text>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{t("weight")}</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={theme.color.textDim}
                keyboardType="numeric"
                value={item.weight}
                onChangeText={(v) => onUpdate("weight", v)}
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <Text style={styles.multSymbol}>×</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{t("reps")}</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={theme.color.textDim}
                keyboardType="numeric"
                value={item.reps}
                onChangeText={(v) => onUpdate("reps", v)}
              />
              <Text style={styles.inputUnit}>×</Text>
            </View>

            <TouchableOpacity onPress={onDone} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>✓</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.setFooter}>
            <View style={styles.dateChip}>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowNote((v) => !v)}>
              <Text style={styles.noteToggle}>
                {showNote ? "− " : "+ "}
                {t("note")}
              </Text>
            </TouchableOpacity>
          </View>

          {showNote && (
            <TextInput
              style={styles.noteInput}
              placeholder={t("note_placeholder")}
              placeholderTextColor={theme.color.textDim}
              value={item.note || ""}
              onChangeText={(v) => onUpdate("note", v)}
              multiline
            />
          )}
        </View>
      </Swipeable>
    </Animated.View>
  );
};

export default function ExerciseDetail() {
  const { id, exerciseId } = useLocalSearchParams<{ id: string; exerciseId: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(90);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const w = await getWorkout(id);
      const e = w?.exercises.find((x) => x.id === exerciseId) ?? null;
      setExercise(e);
      setSets(e?.sets || []);
      setLoading(false);
    })();
  }, [id, exerciseId]);

  const updateSet = (index: number, field: "weight" | "reps" | "note", value: string) => {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addSet = () => {
    hapticTap();
    setSets((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        weight: prev[prev.length - 1]?.weight ?? "",
        reps: prev[prev.length - 1]?.reps ?? "",
        date: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const deleteSet = (i: number) => {
    hapticTap();
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  };

  const startTimer = (seconds: number) => {
    hapticSuccess();
    setTimerSeconds(seconds);
    setTimerVisible(true);
  };

  const save = async () => {
    hapticSuccess();
    await updateExerciseSets(id, exerciseId, sets);
    Alert.alert("✅", t("sets_saved"), [
      { text: t("ok"), onPress: () => router.back() },
    ]);
  };

  if (!exercise && !loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>{t("exercise_not_found")}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: exercise?.name || t("exercises"),
          headerStyle: { backgroundColor: theme.color.bg },
          headerTintColor: theme.color.accent,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: theme.color.text,
          },
          headerShadowVisible: false,
          headerBackTitle: t("back"),
          gestureEnabled: true,
        }}
      />

      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {exercise?.image ? (
          <ImageBackground
            source={{ uri: exercise.image }}
            style={styles.headerImage}
            blurRadius={1}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>{t("exercises")}</Text>
              <Text style={styles.headerTitle}>{exercise?.name}</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statNumber}>{sets.length}</Text>
                <Text style={styles.statLabel}>{t("sets")}</Text>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.headerImage, styles.noImageHeader]}>
            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>{t("exercises")}</Text>
              <Text style={styles.headerTitle}>{exercise?.name}</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statNumber}>{sets.length}</Text>
                <Text style={styles.statLabel}>{t("sets")}</Text>
              </View>
            </View>
          </View>
        )}

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.contentContainer}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Progression chart */}
              <Text style={styles.blockLabel}>{t("progression")}</Text>
              <ProgressionChart sets={sets} />

              {/* Sets */}
              <View style={styles.sectionHeader}>
                <Text style={styles.blockLabel}>{t("your_sets")}</Text>
                <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
                  <Text style={styles.addSetBtnText}>+ {t("add_set")}</Text>
                </TouchableOpacity>
              </View>

              {sets.length === 0 && !loading ? (
                <Animated.View entering={FadeIn} style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🏋️</Text>
                  <Text style={styles.emptyTitle}>{t("no_sets")}</Text>
                  <Text style={styles.emptySubtitle}>{t("tap_add_set")}</Text>
                </Animated.View>
              ) : (
                sets.map((item, index) => (
                  <AnimatedSetCard
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={(field, value) => updateSet(index, field, value)}
                    onDelete={() => deleteSet(index)}
                    onDone={() => startTimer(90)}
                  />
                ))
              )}
            </ScrollView>

            {/* Bottom actions */}
            <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.timerBtn} onPress={() => startTimer(90)}>
                <Text style={styles.timerBtnText}>⏱ {t("rest_timer")}</Text>
              </TouchableOpacity>
              {sets.length > 0 && (
                <TouchableOpacity style={styles.saveBtn} onPress={save}>
                  <Text style={styles.saveBtnText}>💾 {t("save")}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>

        <RestTimer
          visible={timerVisible}
          initialSeconds={timerSeconds}
          onClose={() => setTimerVisible(false)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.color.bg },

  headerImage: {
    height: 200,
    justifyContent: "flex-end",
  },

  noImageHeader: {
    backgroundColor: theme.color.surface,
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

  contentContainer: {
    flex: 1,
    backgroundColor: theme.color.bg,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    marginTop: -20,
    paddingTop: theme.space.xl,
    paddingHorizontal: theme.space.xl,
  },

  scrollView: { flex: 1 },

  scrollContent: { paddingBottom: 120 },

  blockLabel: {
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
    color: theme.color.text,
    marginBottom: theme.space.md,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.space.md,
    marginTop: theme.space.md,
  },

  addSetBtn: {
    backgroundColor: theme.color.accentSoft,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.md,
  },

  addSetBtnText: {
    color: theme.color.accent,
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.bold,
  },

  setCard: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
    marginBottom: theme.space.md,
  },

  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
  },

  setIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.color.accent,
    justifyContent: "center",
    alignItems: "center",
  },

  setIndex: {
    color: theme.color.bg,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
  },

  inputWrapper: {
    flex: 1,
    alignItems: "center",
    backgroundColor: theme.color.surfaceMuted,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space.sm,
  },

  inputLabel: {
    color: theme.color.textDim,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  input: {
    color: theme.color.text,
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
    textAlign: "center",
    padding: 0,
    minWidth: 40,
  },

  inputUnit: {
    color: theme.color.textDim,
    fontSize: 10,
  },

  multSymbol: {
    color: theme.color.textDim,
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
  },

  doneBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.color.accent,
    justifyContent: "center",
    alignItems: "center",
  },

  doneBtnText: {
    color: theme.color.bg,
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
  },

  setFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.space.sm,
  },

  dateChip: {
    backgroundColor: theme.color.surfaceMuted,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },

  dateText: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
  },

  noteToggle: {
    color: theme.color.accent,
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.semibold,
  },

  noteInput: {
    marginTop: theme.space.sm,
    backgroundColor: theme.color.surfaceMuted,
    borderRadius: theme.radius.sm,
    padding: theme.space.sm,
    color: theme.color.text,
    fontSize: theme.font.size.sm,
    minHeight: 40,
    textAlignVertical: "top",
  },

  deleteSwipeContainer: {
    justifyContent: "center",
    height: 100,
  },

  deleteSwipe: {
    height: 100,
    width: 90,
    marginLeft: 8,
  },

  deleteBox: {
    flex: 1,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.danger,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },

  deleteIcon: {
    color: theme.color.text,
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
  },

  deleteText: {
    color: theme.color.text,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
  },

  bottomBar: {
    flexDirection: "row",
    gap: theme.space.md,
    paddingVertical: theme.space.md,
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
    backgroundColor: theme.color.bg,
  },

  timerBtn: {
    flex: 1,
    paddingVertical: theme.space.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceElevated,
    alignItems: "center",
  },

  timerBtnText: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
  },

  saveBtn: {
    flex: 1,
    paddingVertical: theme.space.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.accent,
    alignItems: "center",
  },

  saveBtnText: {
    color: theme.color.bg,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 40,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.space.md,
  },

  emptyTitle: {
    color: theme.color.text,
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.semibold,
    marginBottom: theme.space.sm,
    textAlign: "center",
  },

  emptySubtitle: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
    textAlign: "center",
  },

  emptyText: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.md,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.color.bg,
  },
});
