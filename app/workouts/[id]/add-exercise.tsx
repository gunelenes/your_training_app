import { addExercise, type ExerciseSet } from "@/src/lib/storage";
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
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInLeft,
} from "react-native-reanimated";

const AnimatedSetCard = ({
  item,
  index,
  onUpdate,
  onDelete,
}: {
  item: ExerciseSet;
  index: number;
  onUpdate: (field: "weight" | "reps", value: string) => void;
  onDelete: () => void;
}) => {
  const { t } = useTranslation();
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (_progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.7, 0],
      extrapolate: "clamp",
    });

    return (
      <RNAnimated.View
        style={[
          styles.deleteSwipeContainer,
          { opacity, transform: [{ scale }] },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              t("delete_set_title"),
              t("delete_set_confirm"),
              [
                {
                  text: t("cancel"),
                  style: "cancel",
                  onPress: () => swipeableRef.current?.close(),
                },
                {
                  text: t("delete"),
                  style: "destructive",
                  onPress: onDelete,
                },
              ],
              {
                cancelable: true,
                userInterfaceStyle: "dark",
              }
            );
          }}
          style={styles.deleteSwipe}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#FF3B30", "#C62828"]}
            style={styles.deleteGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.deleteIconContainer}>
              <Text style={styles.deleteIcon}>✕</Text>
            </View>
            <Text style={styles.deleteText}>{t("delete")}</Text>
          </LinearGradient>
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
          <View style={styles.setIndexContainer}>
            <LinearGradient
              colors={["#667EEA", "#764BA2"]}
              style={styles.setIndexGradient}
            >
              <Text style={styles.setIndex}>{index + 1}</Text>
            </LinearGradient>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{t("kg")}</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#6E7178"
                keyboardType="numeric"
                value={item.weight}
                onChangeText={(v) => onUpdate("weight", v)}
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <View style={styles.inputDivider} />

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{t("reps")}</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#6E7178"
                keyboardType="numeric"
                value={item.reps}
                onChangeText={(v) => onUpdate("reps", v)}
              />
              <Text style={styles.inputUnit}>x</Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
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
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [exerciseImage, setExerciseImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled) {
      setExerciseImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("camera_permission"));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled) {
      setExerciseImage(result.assets[0].uri);
    }
  };

  const addSet = () => {
    setSets((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        weight: "",
        reps: "",
        date: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const updateSet = (index: number, field: "weight" | "reps", value: string) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const deleteSet = (index: number) => {
    setSets((prev) => prev.filter((_, i) => i !== index));
  };

  const saveExercise = async () => {
    if (!exerciseName) {
      Alert.alert(
        t("exercise_name_required_title"),
        t("exercise_name_required")
      );
      return;
    }

    if (sets.length === 0) {
      Alert.alert(
        t("no_sets_title"),
        t("at_least_one_set")
      );
      return;
    }

    setIsLoading(true);

    await addExercise(id, {
      id: Date.now().toString(),
      name: exerciseName,
      image: exerciseImage,
      sets,
    });

    setIsLoading(false);

    Alert.alert("✅", t("exercise_saved"), [
      { text: t("ok"), onPress: () => router.back() },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("new_exercise"),
          headerStyle: {
            backgroundColor: "#0A0B0D",
          },
          headerTintColor: "#667EEA",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 18,
            color: "#fff",
          },
          headerShadowVisible: false,
          headerBackTitle: t("back"),
          headerBackTitleStyle: {
            fontSize: 16,
          },
          gestureEnabled: true,
          gestureDirection: "horizontal",
          fullScreenGestureEnabled: true,
        }}
      />

      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              entering={FadeInUp.duration(600)}
              style={styles.header}
            >
              <Text style={styles.headerSubtext}>
                {t("new_exercise")}
              </Text>
              <Text style={styles.title}>
                {t("new_exercise")}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
              <Text style={styles.label}>
                <Text style={styles.labelIcon}>📸 </Text>
                {t("select_photo")}
              </Text>

              {exerciseImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: exerciseImage }}
                    style={styles.preview}
                  />
                  <LinearGradient
                    colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
                    style={styles.previewOverlay}
                  />
                  <View style={styles.photoActionsOverlay}>
                    <TouchableOpacity
                      style={styles.overlayBtn}
                      onPress={pickImage}
                    >
                      <Text style={styles.overlayBtnText}>
                        🖼️ {t("select_from_gallery")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.overlayBtn}
                      onPress={takePhoto}
                    >
                      <Text style={styles.overlayBtnText}>
                        📸 {t("take_photo")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.photoCard}>
                  <View style={styles.photoEmptyState}>
                    <Text style={styles.photoEmptyIcon}>📷</Text>
                    <Text style={styles.photoEmptyText}>
                      {t("no_photo_selected")}
                    </Text>
                  </View>

                  <View style={styles.photoButtons}>
                    <TouchableOpacity
                      style={styles.photoBtn}
                      onPress={pickImage}
                    >
                      <LinearGradient
                        colors={["#667EEA", "#764BA2"]}
                        style={styles.photoBtnGradient}
                      >
                        <Text style={styles.photoBtnIcon}>🖼️</Text>
                        <Text style={styles.photoBtnText}>
                          {t("select_from_gallery")}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.photoBtn}
                      onPress={takePhoto}
                    >
                      <LinearGradient
                        colors={["#4ADE80", "#22C55E"]}
                        style={styles.photoBtnGradient}
                      >
                        <Text style={styles.photoBtnIcon}>📸</Text>
                        <Text style={styles.photoBtnText}>
                          {t("take_photo")}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(400)}
              style={styles.section}
            >
              <Text style={styles.label}>
                <Text style={styles.labelIcon}>💪 </Text>
                {t("exercise_name")}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.nameInput}
                  placeholder={t("exercise_name_placeholder")}
                  placeholderTextColor="#6E7178"
                  value={exerciseName}
                  onChangeText={setExerciseName}
                />
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(600)}
              style={styles.section}
            >
              <View style={styles.setsHeader}>
                <Text style={styles.label}>
                  <Text style={styles.labelIcon}>🏋️ </Text>
                  {t("sets")}
                </Text>
                <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
                  <Text style={styles.addSetBtnText}>
                    + {t("add_set")}
                  </Text>
                </TouchableOpacity>
              </View>

              {sets.length === 0 ? (
                <Animated.View entering={FadeIn} style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🏋️</Text>
                  <Text style={styles.emptyTitle}>
                    {t("no_sets")}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {t("tap_add_set")}
                  </Text>
                </Animated.View>
              ) : (
                sets.map((item, index) => (
                  <AnimatedSetCard
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={(field, value) =>
                      updateSet(index, field, value)
                    }
                    onDelete={() => deleteSet(index)}
                  />
                ))
              )}
            </Animated.View>

            {sets.length > 0 && (
              <Animated.View
                entering={FadeIn.delay(800)}
                style={styles.saveButtonContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    !exerciseName.trim() && styles.saveBtnDisabled,
                  ]}
                  onPress={saveExercise}
                  disabled={!exerciseName.trim() || isLoading}
                >
                  <LinearGradient
                    colors={
                      !exerciseName.trim()
                        ? ["#2A2C2E", "#1A1C1E"]
                        : ["#4ADE80", "#22C55E"]
                    }
                    style={styles.saveBtnGradient}
                  >
                    <Text
                      style={[
                        styles.saveBtnText,
                        !exerciseName.trim() &&
                          styles.saveBtnTextDisabled,
                      ]}
                    >
                      {isLoading
                        ? "⏳ " + t("saving")
                        : "💾 " + t("save")}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0B0D",
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  headerSubtext: {
    color: "#6E7178",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "white",
  },
  section: { marginBottom: 32 },

  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
  },
  labelIcon: { fontSize: 20 },

  photoCard: {
    backgroundColor: "#1A1C1E",
    borderRadius: 20,
    padding: 20,
  },
  photoEmptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  photoEmptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  photoEmptyText: {
    color: "#6E7178",
    fontSize: 16,
    fontWeight: "600",
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
  },
  photoBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
  },
  photoBtnIcon: {
    fontSize: 24,
  },
  photoBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  photoActionsOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
  },
  overlayBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  overlayBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },

  inputContainer: {
    backgroundColor: "#1A1C1E",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2A2C2E",
  },
  nameInput: {
    padding: 18,
    fontSize: 16,
    color: "white",
  },

  setsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addSetBtn: {
    backgroundColor: "#1A1C1E",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#667EEA",
  },
  addSetBtnText: {
    color: "#667EEA",
    fontSize: 14,
    fontWeight: "700",
  },
  setCard: {
    backgroundColor: "#1A1C1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 88,
  },
  setIndexContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  setIndexGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  setIndex: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  inputGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F1012",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    alignItems: "center",
  },
  inputLabel: {
    color: "#6E7178",
    fontSize: 11,
    marginBottom: 4,
  },
  input: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  inputUnit: {
    color: "#6E7178",
    fontSize: 12,
    marginTop: 2,
  },
  inputDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#2A2C2E",
  },

  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(102,126,234,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  dateIcon: { fontSize: 12 },
  dateText: {
    color: "#667EEA",
    fontSize: 11,
    fontWeight: "700",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: "white",
    fontSize: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#6E7178",
    fontSize: 14,
  },

  saveButtonContainer: { marginTop: 20 },
  saveBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnGradient: {
    paddingVertical: 20,
    alignItems: "center",
  },
  saveBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  saveBtnTextDisabled: {
    color: "#6E7178",
  },

  deleteSwipeContainer: {
    justifyContent: "center",
    height: 88,
  },
  deleteSwipe: {
    height: 88,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginLeft: 8,
    overflow: "hidden",
  },
  deleteGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  deleteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIcon: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  deleteText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});
