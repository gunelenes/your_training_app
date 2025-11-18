import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import Animated, { FadeIn, SlideInLeft } from "react-native-reanimated";

// 🎯 ANIMATED SET CARD
const AnimatedSetCard = ({
  item,
  index,
  onUpdate,
  onDelete,
}: {
  item: any;
  index: number;
  onUpdate: (field: string, value: string) => void;
  onDelete: () => void;
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (progress: any, dragX: any) => {
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
      <RNAnimated.View 
        style={[
          styles.deleteSwipeContainer,
          { opacity, transform: [{ scale }] }
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Delete Set",
              "Are you sure you want to delete this set?",
              [
                { 
                  text: "Cancel", 
                  style: "cancel",
                  onPress: () => swipeableRef.current?.close()
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: onDelete,
                },
              ],
              { 
                cancelable: true,
                userInterfaceStyle: 'dark'
              }
            );
          }}
          style={styles.deleteSwipe}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#FF3B30', '#C62828']}
            style={styles.deleteGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.deleteIconContainer}>
              <Text style={styles.deleteIcon}>✕</Text>
            </View>
            <Text style={styles.deleteText}>Delete</Text>
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
              colors={['#667EEA', '#764BA2']}
              style={styles.setIndexGradient}
            >
              <Text style={styles.setIndex}>{index + 1}</Text>
            </LinearGradient>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Weight</Text>
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
              <Text style={styles.inputLabel}>Reps</Text>
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

export default function ExerciseDetail() {
  const { id, exerciseId } = useLocalSearchParams();
  const router = useRouter();

  const [workout, setWorkout] = useState<any>(null);
  const [exercise, setExercise] = useState<any>(null);
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const raw = await AsyncStorage.getItem("WORKOUTS");
    const workouts = raw ? JSON.parse(raw) : [];

    const w = workouts.find((x: any) => x.id === id);
    const e = w?.exercises.find((x: any) => x.id === exerciseId);

    setWorkout(w);
    setExercise(e);
    setSets(e?.sets || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateSet = (index: number, field: string, value: string) => {
    const temp = [...sets];
    temp[index][field] = value;
    setSets(temp);
  };

  const addSet = () => {
    setSets([
      ...sets,
      {
        id: Date.now().toString(),
        weight: "",
        reps: "",
        date: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const deleteSet = (i: number) => {
    const temp = [...sets];
    temp.splice(i, 1);
    setSets(temp);
  };

  const save = async () => {
    const raw = await AsyncStorage.getItem("WORKOUTS");
    const workouts = raw ? JSON.parse(raw) : [];

    const wIndex = workouts.findIndex((x: any) => x.id === id);
    const eIndex = workouts[wIndex].exercises.findIndex(
      (x: any) => x.id === exerciseId
    );

    workouts[wIndex].exercises[eIndex].sets = sets;

    await AsyncStorage.setItem("WORKOUTS", JSON.stringify(workouts));
    Alert.alert("✅ Saved!", "Your sets have been saved successfully.", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  if (!exercise && !loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Exercise not found</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* HEADER */}
        {exercise?.image ? (
          <ImageBackground
            source={{ uri: exercise.image }}
            style={styles.headerImage}
            blurRadius={1}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
              style={styles.headerOverlay}
            />
            <View style={styles.headerContent}>
              <Text style={styles.headerSubtext}>Exercise</Text>
              <Text style={styles.headerTitle}>{exercise?.name || "..."}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <Text style={styles.statNumber}>{sets.length}</Text>
                  <Text style={styles.statLabel}>Sets</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.headerImage, styles.noImageHeader]}>
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.headerOverlay}
            />
            <View style={styles.headerContent}>
              <Text style={styles.headerSubtext}>Exercise</Text>
              <Text style={styles.headerTitle}>{exercise?.name || "..."}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <Text style={styles.statNumber}>{sets.length}</Text>
                  <Text style={styles.statLabel}>Sets</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* CONTENT */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.contentContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Sets</Text>
              <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
                <Text style={styles.addSetBtnText}>+ Add Set</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : sets.length === 0 ? (
                <Animated.View entering={FadeIn} style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🏋️</Text>
                  <Text style={styles.emptyTitle}>No sets yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap "+ Add Set" to start tracking
                  </Text>
                </Animated.View>
              ) : (
                sets.map((item, index) => (
                  <AnimatedSetCard
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={(field, value) => updateSet(index, field, value)}
                    onDelete={() => deleteSet(index)}
                  />
                ))
              )}
            </ScrollView>

            {/* SAVE BUTTON */}
            {sets.length > 0 && (
              <Animated.View entering={FadeIn.delay(300)} style={styles.saveButtonContainer}>
                <TouchableOpacity style={styles.saveBtn} onPress={save}>
                  <LinearGradient
                    colors={['#4ADE80', '#22C55E']}
                    style={styles.saveBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.saveBtnText}>💾 Save Progress</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0B0D",
  },

  headerImage: {
    height: 240,
    justifyContent: "flex-end",
  },

  noImageHeader: {
    backgroundColor: "#667EEA",
  },

  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  headerContent: {
    padding: 24,
    paddingBottom: 32,
  },

  headerSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  statsRow: {
    flexDirection: "row",
    gap: 16,
  },

  statBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },

  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },

  contentContainer: {
    flex: 1,
    backgroundColor: "#0A0B0D",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
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

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  setCard: {
    backgroundColor: "#1A1C1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 88,
  },

  setIndexContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },

  setIndexGradient: {
    width: "100%",
    height: "100%",
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
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  input: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    padding: 0,
    minWidth: 40,
  },

  inputUnit: {
    color: "#6E7178",
    fontSize: 12,
    fontWeight: "600",
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
    backgroundColor: "rgba(102, 126, 234, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },

  dateIcon: {
    fontSize: 12,
  },

  dateText: {
    color: "#667EEA",
    fontSize: 11,
    fontWeight: "700",
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
    overflow: 'hidden',
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  deleteGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  deleteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
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
    letterSpacing: 0.5,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },

  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  emptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },

  emptySubtitle: {
    color: "#6E7178",
    fontSize: 14,
    textAlign: "center",
  },

  emptyText: {
    color: "#6E7178",
    fontSize: 16,
  },

  loadingContainer: {
    alignItems: "center",
    marginTop: 60,
  },

  loadingText: {
    color: "#6E7178",
    fontSize: 16,
  },

  saveButtonContainer: {
    paddingVertical: 16,
  },

  saveBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#4ADE80",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  saveBtnGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },

  saveBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0B0D",
  },
});