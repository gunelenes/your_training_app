import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { SlideInLeft } from "react-native-reanimated";

export default function ExerciseDetail() {
  const { id, exerciseId } = useLocalSearchParams();
  const router = useRouter();

  const [workout, setWorkout] = useState<any>(null);
  const [exercise, setExercise] = useState<any>(null);
  const [sets, setSets] = useState<any[]>([]);

  const load = async () => {
    const raw = await AsyncStorage.getItem("WORKOUTS");
    const workouts = raw ? JSON.parse(raw) : [];

    const w = workouts.find((x: any) => x.id === id);
    const e = w.exercises.find((x: any) => x.id === exerciseId);

    setWorkout(w);
    setExercise(e);
    setSets(e.sets);
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
        date: new Date().toISOString().split("T")[0], // 🔥 BUGÜNÜN TARİHİ
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
    Alert.alert("Kaydedildi!");
    router.back();
  };

  if (!exercise) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#333" }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={exercise.image ? { uri: exercise.image } : undefined}
      style={styles.bg}
      imageStyle={{ opacity: 0.25 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.overlay}>
          <Text style={styles.title}>{exercise.name}</Text>

          {sets.map((item, index) => (
            <Animated.View key={item.id} entering={SlideInLeft.delay(50 * index)}>
              <View style={styles.setCard}>
                <Text style={styles.setIndex}>{index + 1}</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Kg"
                  keyboardType="numeric"
                  value={item.weight}
                  onChangeText={(v) => updateSet(index, "weight", v)}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Tekrar"
                  keyboardType="numeric"
                  value={item.reps}
                  onChangeText={(v) => updateSet(index, "reps", v)}
                />

                {/* 🔥 TARİH ARTIK INPUT DEĞİL — SADECE GÖSTERİM */}
                <Text style={styles.dateText}>{item.date}</Text>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteSet(index)}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>X</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>Kaydet</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Floating button */}
        <TouchableOpacity style={styles.addSetFloat} onPress={addSet}>
          <Text style={styles.addSetFloatText}>+</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { padding: 20, paddingBottom: 160 },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    marginBottom: 25,
    marginTop: 20,
  },

  setCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
  },

  setIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
    color: "white",
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "700",
    marginRight: 10,
  },

  input: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 8,
    fontSize: 14,
  },

  dateText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
    marginRight: 10,
    opacity: 0.8,
  },

  deleteBtn: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 8,
  },

  saveBtn: {
    marginTop: 30,
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  saveBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  addSetFloat: {
    position: "absolute",
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0d6efd",
    alignItems: "center",
    justifyContent: "center",
  },

  addSetFloatText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: -4,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
