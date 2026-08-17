import ExerciseAutocomplete from "@/components/exercise-autocomplete";
import RestTimer from "@/components/rest-timer";
import { theme } from "@/constants/theme";
import { inferMuscleGroup, MUSCLE_GROUP_META } from "@/src/lib/exercise-library";
import { hapticError, hapticSuccess, hapticTap } from "@/src/lib/haptics";
import { persistImage, resolveImage } from "@/src/lib/images";
import { addExercise, type ExerciseSet, type MuscleGroup } from "@/src/lib/storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
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
import Animated, { FadeIn, FadeInUp, SlideInLeft } from "react-native-reanimated";

const SetCard = ({
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
    _p: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.7, 0],
      extrapolate: "clamp",
    });
    return (
      <RNAnimated.View style={[{ justifyContent: "center" }, { opacity }]}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              t("delete_set_title"),
              t("delete_set_confirm"),
              [
                { text: t("cancel"), style: "cancel", onPress: () => swipeableRef.current?.close() },
                { text: t("delete"), style: "destructive", onPress: onDelete },
              ],
              { cancelable: true, userInterfaceStyle: "dark" }
            );
          }}
          style={styles.deleteBox}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </RNAnimated.View>
    );
  };

  return (
    <Animated.View entering={SlideInLeft.delay(50 * index)}>
      <Swipeable ref={swipeableRef} overshootRight={false} renderRightActions={renderRightActions} friction={2} rightThreshold={40}>
        <View style={styles.setCard}>
          <View style={styles.setRow}>
            <View style={styles.setIndexBadge}>
              <Text style={styles.setIndex}>{index + 1}</Text>
            </View>

            <View style={styles.setInputBox}>
              <Text style={styles.setInputLabel}>{t("kg")}</Text>
              <TextInput
                style={styles.setInputField}
                placeholder="0"
                placeholderTextColor={theme.color.textDim}
                keyboardType="numeric"
                value={item.weight}
                onChangeText={(v) => onUpdate("weight", v)}
              />
            </View>

            <Text style={styles.mult}>×</Text>

            <View style={styles.setInputBox}>
              <Text style={styles.setInputLabel}>{t("reps")}</Text>
              <TextInput
                style={styles.setInputField}
                placeholder="0"
                placeholderTextColor={theme.color.textDim}
                keyboardType="numeric"
                value={item.reps}
                onChangeText={(v) => onUpdate("reps", v)}
              />
            </View>

            <TouchableOpacity onPress={onDone} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>✓</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.setFooter}>
            <Text style={styles.setDate}>{item.date}</Text>
            <TouchableOpacity onPress={() => setShowNote((v) => !v)}>
              <Text style={styles.noteToggle}>{showNote ? "−" : "+"} {t("note")}</Text>
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

export default function AddExercise() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("other");
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [exerciseImage, setExerciseImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [16, 9] });
    if (!result.canceled) setExerciseImage(await persistImage(result.assets[0].uri));
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("camera_permission"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [16, 9] });
    if (!result.canceled) setExerciseImage(await persistImage(result.assets[0].uri));
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

  const updateSet = (index: number, field: "weight" | "reps" | "note", value: string) => {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const deleteSet = (index: number) => {
    hapticTap();
    setSets((prev) => prev.filter((_, i) => i !== index));
  };

  const saveExercise = async () => {
    if (!exerciseName) {
      hapticError();
      Alert.alert(t("exercise_name_required_title"), t("exercise_name_required"));
      return;
    }
    if (sets.length === 0) {
      hapticError();
      Alert.alert(t("no_sets_title"), t("at_least_one_set"));
      return;
    }

    setIsLoading(true);
    await addExercise(id, {
      id: Date.now().toString(),
      name: exerciseName,
      image: exerciseImage,
      muscleGroup,
      sets,
    });
    hapticSuccess();
    setIsLoading(false);
    Alert.alert("✅", t("exercise_saved"), [{ text: t("ok"), onPress: () => router.back() }]);
  };

  const meta = MUSCLE_GROUP_META[muscleGroup];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("new_exercise"),
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

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInUp.duration(500)}>
              <Text style={styles.headerLabel}>{t("new_exercise")}</Text>
              <Text style={styles.title}>{t("new_exercise")}</Text>
            </Animated.View>

            {/* Photo */}
            <Animated.View entering={FadeInUp.delay(150)} style={styles.section}>
              {exerciseImage ? (
                <View style={styles.imgWrap}>
                  <Image source={{ uri: resolveImage(exerciseImage) }} style={styles.imgPreview} />
                  <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]} style={StyleSheet.absoluteFillObject} />
                  <View style={styles.imgActions}>
                    <TouchableOpacity onPress={pickImage} style={styles.imgActionBtn}>
                      <Text style={styles.imgActionText}>🖼️ {t("select_from_gallery")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={takePhoto} style={styles.imgActionBtn}>
                      <Text style={styles.imgActionText}>📸 {t("take_photo")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.photoRow}>
                  <TouchableOpacity onPress={pickImage} style={styles.photoBtn}>
                    <Text style={styles.photoIcon}>🖼️</Text>
                    <Text style={styles.photoText}>{t("select_from_gallery")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={takePhoto} style={styles.photoBtn}>
                    <Text style={styles.photoIcon}>📸</Text>
                    <Text style={styles.photoText}>{t("take_photo")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>

            {/* Name + autocomplete */}
            <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
              <Text style={styles.label}>{t("exercise_name")}</Text>
              <View style={styles.nameInputWrap}>
                <TextInput
                  style={styles.nameInput}
                  placeholder={t("exercise_name_placeholder")}
                  placeholderTextColor={theme.color.textDim}
                  value={exerciseName}
                  onChangeText={(v) => {
                    setExerciseName(v);
                    setMuscleGroup(inferMuscleGroup(v));
                  }}
                />
                <View style={[styles.groupChip, { backgroundColor: meta.color + "20" }]}>
                  <Text style={[styles.groupChipText, { color: meta.color }]}>
                    {meta.emoji} {t(`muscle_${muscleGroup}`)}
                  </Text>
                </View>
              </View>
              <ExerciseAutocomplete
                query={exerciseName}
                onSelect={(ex) => {
                  setExerciseName(ex.name);
                  setMuscleGroup(ex.muscleGroup);
                }}
              />
            </Animated.View>

            {/* Sets */}
            <Animated.View entering={FadeInUp.delay(450)} style={styles.section}>
              <View style={styles.setsHeader}>
                <Text style={styles.label}>{t("sets")}</Text>
                <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
                  <Text style={styles.addSetBtnText}>+ {t("add_set")}</Text>
                </TouchableOpacity>
              </View>

              {sets.length === 0 ? (
                <Animated.View entering={FadeIn} style={styles.emptyBox}>
                  <Text style={styles.emptyIcon}>🏋️</Text>
                  <Text style={styles.emptyTitle}>{t("no_sets")}</Text>
                  <Text style={styles.emptySub}>{t("tap_add_set")}</Text>
                </Animated.View>
              ) : (
                sets.map((item, index) => (
                  <SetCard
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={(f, v) => updateSet(index, f, v)}
                    onDelete={() => deleteSet(index)}
                    onDone={() => setTimerVisible(true)}
                  />
                ))
              )}
            </Animated.View>

            {sets.length > 0 && (
              <Animated.View entering={FadeIn.delay(600)} style={{ marginTop: theme.space.lg }}>
                <TouchableOpacity
                  style={[styles.saveBtn, !exerciseName.trim() && styles.saveBtnDisabled]}
                  onPress={saveExercise}
                  disabled={!exerciseName.trim() || isLoading}
                >
                  <Text style={[styles.saveBtnText, !exerciseName.trim() && { color: theme.color.textMuted }]}>
                    {isLoading ? "⏳ " + t("saving") : "💾 " + t("save")}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <RestTimer visible={timerVisible} initialSeconds={90} onClose={() => setTimerVisible(false)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.color.bg },
  scrollContent: { padding: theme.space.xl, paddingTop: 40, paddingBottom: 60 },

  headerLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    fontSize: theme.font.size.display,
    fontWeight: theme.font.weight.bold,
    color: theme.color.text,
    marginBottom: theme.space.lg,
  },

  section: { marginBottom: theme.space.xl },

  label: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
    marginBottom: theme.space.sm,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  photoRow: {
    flexDirection: "row",
    gap: theme.space.md,
  },
  photoBtn: {
    flex: 1,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.xl,
    alignItems: "center",
    gap: theme.space.sm,
  },
  photoIcon: { fontSize: 32 },
  photoText: { color: theme.color.text, fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semibold },

  imgWrap: { borderRadius: theme.radius.lg, overflow: "hidden" },
  imgPreview: { width: "100%", height: 200, resizeMode: "cover" },
  imgActions: {
    position: "absolute",
    bottom: theme.space.md,
    left: theme.space.md,
    right: theme.space.md,
    flexDirection: "row",
    gap: theme.space.sm,
  },
  imgActionBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: theme.space.sm,
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  imgActionText: { color: theme.color.text, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold },

  nameInputWrap: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
    gap: theme.space.sm,
  },
  nameInput: {
    color: theme.color.text,
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.semibold,
    paddingVertical: theme.space.sm,
  },
  groupChip: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.space.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  groupChipText: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
  },

  setsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.space.md,
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
  setIndex: { color: theme.color.bg, fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold },

  setInputBox: {
    flex: 1,
    backgroundColor: theme.color.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: theme.space.sm,
    alignItems: "center",
  },
  setInputLabel: {
    color: theme.color.textDim,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  setInputField: {
    color: theme.color.text,
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
    textAlign: "center",
    padding: 0,
    minWidth: 40,
  },
  mult: { color: theme.color.textDim, fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold },

  doneBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.color.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  doneBtnText: { color: theme.color.bg, fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold },

  setFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.space.sm,
  },
  setDate: { color: theme.color.textMuted, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semibold },
  noteToggle: { color: theme.color.accent, fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semibold },
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

  deleteBox: {
    marginLeft: 8,
    width: 80,
    height: 90,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIcon: { color: theme.color.text, fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIcon: { fontSize: 40, marginBottom: theme.space.sm },
  emptyTitle: { color: theme.color.text, fontSize: theme.font.size.lg, fontWeight: theme.font.weight.semibold },
  emptySub: { color: theme.color.textMuted, fontSize: theme.font.size.sm, marginTop: 4 },

  saveBtn: {
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.space.xl,
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: theme.color.surface },
  saveBtnText: { color: theme.color.bg, fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold },
});
