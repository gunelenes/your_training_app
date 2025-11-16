import i18n from "@/src/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateWorkout() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [langUpdate, setLangUpdate] = useState(0); // 🔥 dil değişince yenile

  // ❗ Dil değişince ekranı yeniden yükle
  useEffect(() => {
    const handler = () => setLangUpdate((x) => x + 1);
    i18n.on("languageChanged", handler);

    return () => {
      i18n.off("languageChanged", handler);
    };
  }, []);

  // 📌 Fotoğraf seçme
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  // 📌 Oluştur
  const createWorkout = async () => {
    if (!name.trim()) return;

    const newWorkout = {
      id: Date.now().toString(),
      name,
      image,
      exercises: [],
    };

    const raw = await AsyncStorage.getItem("WORKOUTS");
    const list = raw ? JSON.parse(raw) : [];

    list.push(newWorkout);

    await AsyncStorage.setItem("WORKOUTS", JSON.stringify(list));

    router.push("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("new_workout")}</Text>

      <Text style={styles.label}>{i18n.t("workout_name")}</Text>
      <TextInput
        placeholder={i18n.t("workout_placeholder")}
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Text style={styles.label}>{i18n.t("select_photo")}</Text>
      <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
        <Text style={styles.photoBtnText}>
          {image ? i18n.t("change_photo") ?? "Fotoğrafı Değiştir" : i18n.t("select_photo")}
        </Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.preview} />}

      <TouchableOpacity style={styles.saveBtn} onPress={createWorkout}>
        <Text style={styles.saveBtnText}>{i18n.t("create")}</Text>
      </TouchableOpacity>
    </View>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 25,
  },
  label: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  photoBtn: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  photoBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 15,
  },
  saveBtn: {
    backgroundColor: "#34C759",
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
  },
  saveBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});
