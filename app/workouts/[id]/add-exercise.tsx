import i18n from "@/src/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp, SlideInLeft } from "react-native-reanimated";

export default function AddExercise() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState<any[]>([]);
  const [exerciseImage, setExerciseImage] = useState<string | null>(null);
  const [langUpdate, setLangUpdate] = useState(0);

  // 🔥 Dil değişince ekranı yenile
  useEffect(() => {
    const handler = () => setLangUpdate((x) => x + 1);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  // Fotoğraf seç
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setExerciseImage(result.assets[0].uri);
    }
  };

  // Kameradan fotoğraf çek
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(i18n.t("camera_permission") ?? "Kamera izni gerekli");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      setExerciseImage(result.assets[0].uri);
    }
  };

  // 🔥 SET EKLE (tarih otomatik)
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

  // SET GÜNCELLE
  const updateSet = (index: number, field: string, value: string) => {
    const temp = [...sets];
    temp[index][field] = value;
    setSets(temp);
  };

  // KAYDET
  const saveExercise = async () => {
    if (!exerciseName) {
      Alert.alert(i18n.t("exercise_name_required"));
      return;
    }

    if (sets.length === 0) {
      Alert.alert(i18n.t("at_least_one_set"));
      return;
    }

    const newExercise = {
      id: Date.now().toString(),
      name: exerciseName,
      image: exerciseImage || null,
      sets,
    };

    const raw = await AsyncStorage.getItem("WORKOUTS");
    const workouts = raw ? JSON.parse(raw) : [];

    const wIndex = workouts.findIndex((w: any) => w.id === id);

    if (wIndex !== -1) {
      workouts[wIndex].exercises.push(newExercise);
      await AsyncStorage.setItem("WORKOUTS", JSON.stringify(workouts));
    }

    Alert.alert(i18n.t("exercise_saved"));
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 130 }}>
        <Animated.Text entering={FadeInUp} style={styles.title}>
          {i18n.t("new_exercise")}
        </Animated.Text>

        {/* FOTOĞRAF KARTI */}
        <Animated.View entering={FadeInUp.delay(80)} style={styles.photoCard}>
          {exerciseImage ? (
            <Image source={{ uri: exerciseImage }} style={styles.preview} />
          ) : (
            <Text style={styles.photoEmptyText}>
              {i18n.t("no_photo_selected")}
            </Text>
          )}

          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <Text style={styles.photoBtnText}>{i18n.t("select_from_gallery")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Text style={styles.photoBtnText}>{i18n.t("take_photo")}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* EGZERSİZ ADI */}
        <Animated.View entering={FadeInUp.delay(120)}>
          <TextInput
            style={styles.nameInput}
            placeholder={i18n.t("exercise_name_placeholder")}
            placeholderTextColor="#aaa"
            value={exerciseName}
            onChangeText={setExerciseName}
          />
        </Animated.View>

        {/* SET LİSTESİ */}
        <Text style={styles.subTitle}>{i18n.t("sets")}</Text>

        {sets.map((item, index) => (
          <Animated.View key={item.id} entering={SlideInLeft.delay(80 * index)}>
            <View style={styles.setCard}>
              <Text style={styles.setIndex}>{index + 1}</Text>

              <TextInput
                style={styles.setInput}
                placeholder={i18n.t("kg")}
                keyboardType="numeric"
                value={item.weight}
                onChangeText={(v) => updateSet(index, "weight", v)}
              />

              <TextInput
                style={styles.setInput}
                placeholder={i18n.t("reps")}
                keyboardType="numeric"
                value={item.reps}
                onChangeText={(v) => updateSet(index, "reps", v)}
              />

              <Text style={styles.dateText}>{item.date}</Text>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  const temp = [...sets];
                  temp.splice(index, 1);
                  setSets(temp);
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>X</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}

        {/* KAYDET BUTTON */}
        <TouchableOpacity style={styles.saveBtn} onPress={saveExercise}>
          <Text style={styles.saveBtnText}>{i18n.t("save")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* FLOATING ADD SET BUTTON */}
      <TouchableOpacity style={styles.addFloat} onPress={addSet}>
        <Text style={styles.addFloatText}>+</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f7f7f7" },

  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 25,
    marginTop: 10,
    color: "#111",
  },

  photoCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignItems: "center",
  },

  preview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },

  photoEmptyText: { color: "#888", marginBottom: 15 },

  photoBtn: {
    backgroundColor: "#0d6efd",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginVertical: 6,
    width: "100%",
    alignItems: "center",
  },

  photoBtnText: { color: "white", fontWeight: "600" },

  nameInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },

  subTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#222",
  },

  setCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
  },

  setIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ddd",
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "700",
    marginRight: 8,
    color: "#333",
  },

  setInput: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    fontSize: 14,
  },

  dateText: {
    fontSize: 12,
    color: "#444",
    marginRight: 10,
    opacity: 0.6,
    fontWeight: "600",
  },

  deleteBtn: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 8,
  },

  saveBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    alignItems: "center",
    marginBottom: 40,
  },

  saveBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  addFloat: {
    position: "absolute",
    bottom: 20,
    right: 25,
    width: 65,
    height: 65,
    backgroundColor: "#0d6efd",
    borderRadius: 32.5,
    justifyContent: "center",
    alignItems: "center",
    elevation: 7,
  },

  addFloatText: {
    color: "white",
    fontSize: 36,
    fontWeight: "700",
    marginTop: -4,
  },
});
